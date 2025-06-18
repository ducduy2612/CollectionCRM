import { useState, useEffect, useCallback } from 'react';
import { workflowApi } from '../../../../services/api/workflow.api';
import { fudAutoConfigApi } from '../../../../services/api/workflow/fud-auto-config.api';
import { Customer, Loan, ActionType, ActionSubtype, ActionResult } from '../../types';
import { useTranslation } from '../../../../i18n/hooks/useTranslation';
import { useAuth } from '../../../../hooks/useAuth';

export type ActionMode = 'loan-level' | 'customer-level';

export interface LoanActionData {
  loanAccountNumber: string;
  selected: boolean;
  actionResultId: string;
  fUpdate: string;
  promiseAmount: string;
  promiseDate: string;
  notes: string;
  fudAutoCalculated?: boolean;
  fudManualOverride?: boolean;
}

interface UseRecordActionModalProps {
  isOpen: boolean;
  customer: Customer;
  loans: Loan[];
}

export const useRecordActionModal = ({ isOpen, customer, loans }: UseRecordActionModalProps) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  
  // State for dropdown options
  const [actionTypes, setActionTypes] = useState<ActionType[]>([]);
  const [actionSubtypes, setActionSubtypes] = useState<ActionSubtype[]>([]);
  const [actionResults, setActionResults] = useState<ActionResult[]>([]);

  // Customer-level action selections
  const [selectedActionTypeId, setSelectedActionTypeId] = useState('');
  const [selectedActionSubtypeId, setSelectedActionSubtypeId] = useState('');
  
  // Global FUD date state
  const [globalFudDate, setGlobalFudDate] = useState('');
  const [globalFudAutoCalculated, setGlobalFudAutoCalculated] = useState(false);

  // State for loan actions
  const [loanActions, setLoanActions] = useState<{ [key: string]: LoanActionData }>({});
  
  // Action mode state
  const [actionMode, setActionMode] = useState<ActionMode>('customer-level');
  
  // Customer-level action state
  const [customerLevelAction, setCustomerLevelAction] = useState({
    actionResultId: '',
    fUpdate: '',
    promiseAmount: '',
    promiseDate: '',
    notes: ''
  });
  
  // Global notes state
  const [globalNotes, setGlobalNotes] = useState('');
  const [applyGlobalNotes, setApplyGlobalNotes] = useState(false);

  // Loading and error states
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Helper function to check if user has permission
  const hasPermission = useCallback((permission: string): boolean => {
    if (!user || !user.permissions) return false;
    return user.permissions.some(p => p.startsWith(permission + ':') || p === permission);
  }, [user]);

  // Check if user can override FUD
  const canOverrideFud = hasPermission('FUD_config:enable');

  // Initialize loan actions when modal opens
  useEffect(() => {
    if (isOpen && loans.length > 0) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().split('T')[0];

      // Set global FUD date
      setGlobalFudDate(tomorrowStr);
      setGlobalFudAutoCalculated(false);

      const initialActions: { [key: string]: LoanActionData } = {};
      loans.forEach(loan => {
        initialActions[loan.accountNumber] = {
          loanAccountNumber: loan.accountNumber,
          selected: false,
          actionResultId: '',
          fUpdate: tomorrowStr,
          promiseAmount: '',
          promiseDate: '',
          notes: '',
          fudAutoCalculated: false,
          fudManualOverride: false
        };
      });
      setLoanActions(initialActions);
      
      // Initialize customer-level action
      setCustomerLevelAction({
        actionResultId: '',
        fUpdate: tomorrowStr,
        promiseAmount: '',
        promiseDate: '',
        notes: ''
      });
    }
  }, [isOpen, loans]);

  // Load action types when modal opens
  useEffect(() => {
    if (isOpen) {
      loadActionTypes();
    }
  }, [isOpen]);

  // Reset selections when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSelectedActionTypeId('');
      setSelectedActionSubtypeId('');
      setActionSubtypes([]);
      setActionResults([]);
      setActionMode('customer-level');
      setGlobalFudDate('');
      setGlobalFudAutoCalculated(false);
      setCustomerLevelAction({
        actionResultId: '',
        fUpdate: '',
        promiseAmount: '',
        promiseDate: '',
        notes: ''
      });
      setGlobalNotes('');
      setApplyGlobalNotes(false);
      setError(null);
    }
  }, [isOpen]);

  const loadActionTypes = async () => {
    try {
      setLoading(true);
      setError(null);
      const types = await workflowApi.getActionTypes();
      setActionTypes(types);
    } catch (err) {
      setError(t('customers:record_action.messages.failed_to_load_action_types'));
      console.error('Error loading action types:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadActionSubtypes = async (typeCode: string) => {
    try {
      const subtypes = await workflowApi.getActionSubtypes(typeCode);
      setActionSubtypes(subtypes);
    } catch (err) {
      console.error('Error loading action subtypes:', err);
      setActionSubtypes([]);
    }
  };

  const loadActionResults = async (subtypeCode: string) => {
    try {
      const results = await workflowApi.getActionResults(subtypeCode);
      setActionResults(results);
    } catch (err) {
      console.error('Error loading action results:', err);
      setActionResults([]);
    }
  };

  const handleActionTypeChange = useCallback(async (actionTypeId: string) => {
    const actionType = actionTypes.find(type => type.id === actionTypeId);
    if (!actionType) return;

    setSelectedActionTypeId(actionTypeId);
    setSelectedActionSubtypeId(''); // Reset subtype
    setActionResults([]); // Reset results

    // Load subtypes for this action type
    await loadActionSubtypes(actionType.code);

    // Reset all loan action results since the type changed
    setLoanActions(prev => {
      const updated = { ...prev };
      Object.keys(updated).forEach(loanAccountNumber => {
        updated[loanAccountNumber] = {
          ...updated[loanAccountNumber],
          actionResultId: '', // Reset result
          promiseAmount: '', // Reset promise fields
          promiseDate: ''
        };
      });
      return updated;
    });
  }, [actionTypes]);

  const handleActionSubtypeChange = useCallback(async (actionSubtypeId: string) => {
    const actionSubtype = actionSubtypes.find(sub => sub.subtype_id === actionSubtypeId);
    if (!actionSubtype) return;

    setSelectedActionSubtypeId(actionSubtypeId);

    // Load results for this subtype
    await loadActionResults(actionSubtype.subtype_code);

    // Reset loan actions when subtype changes
    setLoanActions(prev => {
      const updated = { ...prev };
      Object.keys(updated).forEach(loanAccountNumber => {
        updated[loanAccountNumber] = {
          ...updated[loanAccountNumber],
          actionResultId: '', // Reset result
          promiseAmount: '', // Reset promise fields
          promiseDate: ''
        };
      });
      return updated;
    });
  }, [actionSubtypes]);

  // Function to calculate FUD automatically
  const calculateAutoFud = useCallback(async (actionResultId: string, promiseDate?: string): Promise<string | null> => {
    try {
      console.log('calculateAutoFud called with:', { actionResultId, promiseDate });
      const actionDate = new Date().toISOString();
      const result = await fudAutoConfigApi.calculateFudDate({
        action_result_id: actionResultId,
        action_date: actionDate,
        promise_date: promiseDate
      });
      
      console.log('FUD calculation result:', result);
      
      if (result.auto_calculated && result.fud_date) {
        return new Date(result.fud_date).toISOString().split('T')[0];
      }
      return null;
    } catch (error) {
      console.error('Error calculating auto FUD:', error);
      return null;
    }
  }, []);

  // Handle global FUD date change
  const handleGlobalFudDateChange = useCallback((date: string) => {
    setGlobalFudDate(date);
    setGlobalFudAutoCalculated(false);
    
    // Update all loan actions with new FUD date
    setLoanActions(prev => {
      const updated = { ...prev };
      Object.keys(updated).forEach(loanAccountNumber => {
        updated[loanAccountNumber] = {
          ...updated[loanAccountNumber],
          fUpdate: date,
          fudAutoCalculated: false,
          fudManualOverride: true
        };
      });
      return updated;
    });
    
    // Update customer-level action
    setCustomerLevelAction(prev => ({
      ...prev,
      fUpdate: date
    }));
  }, []);

  // Toggle global FUD auto-calculation
  const toggleGlobalFudAutoCalculation = useCallback(async (enable: boolean) => {
    if (!canOverrideFud) return;
    
    if (enable) {
      // Find all selected loans with action results
      const selectedLoansWithData = Object.values(loanActions)
        .filter(action => action.selected && action.actionResultId);
      
      if (selectedLoansWithData.length > 0) {
        // For promise to pay actions, use the minimum promise date
        const promiseToPayActions = selectedLoansWithData.filter(action => {
          const result = actionResults.find(r => r.result_id === action.actionResultId);
          return result?.is_promise && action.promiseDate;
        });
        
        let calculatedFudDate = null;
        
        if (promiseToPayActions.length > 0) {
          // Find the minimum promise date
          const minPromiseDate = promiseToPayActions.reduce((min, action) => {
            if (!min || action.promiseDate < min) {
              return action.promiseDate;
            }
            return min;
          }, '');
          
          const actionWithMinDate = promiseToPayActions.find(action => action.promiseDate === minPromiseDate);
          if (actionWithMinDate) {
            calculatedFudDate = await calculateAutoFud(actionWithMinDate.actionResultId, minPromiseDate);
          }
        } else {
          // If no promise to pay actions, use the first selected action
          const firstAction = selectedLoansWithData[0];
          calculatedFudDate = await calculateAutoFud(firstAction.actionResultId);
        }
        
        if (calculatedFudDate) {
          setGlobalFudDate(calculatedFudDate);
          setGlobalFudAutoCalculated(true);
          
          // Update all loan actions
          setLoanActions(prev => {
            const updated = { ...prev };
            Object.keys(updated).forEach(loanAccountNumber => {
              updated[loanAccountNumber] = {
                ...updated[loanAccountNumber],
                fUpdate: calculatedFudDate,
                fudAutoCalculated: true,
                fudManualOverride: false
              };
            });
            return updated;
          });
          
          // Update customer-level action
          setCustomerLevelAction(prev => ({
            ...prev,
            fUpdate: calculatedFudDate
          }));
        }
      }
    } else {
      setGlobalFudAutoCalculated(false);
      
      // Mark all as manual override
      setLoanActions(prev => {
        const updated = { ...prev };
        Object.keys(updated).forEach(loanAccountNumber => {
          updated[loanAccountNumber] = {
            ...updated[loanAccountNumber],
            fudAutoCalculated: false,
            fudManualOverride: true
          };
        });
        return updated;
      });
    }
  }, [canOverrideFud, loanActions, actionResults, calculateAutoFud]);

  const handleActionResultChange = useCallback(async (loanAccountNumber: string, actionResultId: string) => {
    const actionResult = actionResults.find(result => result.result_id === actionResultId);
    const isPromiseToPay = actionResult?.is_promise || false;
    const loan = loans.find(l => l.accountNumber === loanAccountNumber);
    
    // Update the loan action
    let updatedLoanActions = { ...loanActions };
    updatedLoanActions[loanAccountNumber] = {
      ...updatedLoanActions[loanAccountNumber],
      actionResultId,
      promiseAmount: isPromiseToPay && loan ? String(loan.dueAmount) : '',
      promiseDate: isPromiseToPay ? updatedLoanActions[loanAccountNumber].promiseDate : '',
      // Keep the global FUD date
      fUpdate: globalFudDate,
      fudAutoCalculated: globalFudAutoCalculated,
      fudManualOverride: !globalFudAutoCalculated
    };
    
    // Check if this is the first action result being selected and auto-calculate FUD if not already set
    const hasAnyActionResult = Object.values(loanActions).some(action => action.actionResultId);
    if (!hasAnyActionResult && !globalFudAutoCalculated) {
      // This is the first action result, try to auto-calculate FUD
      console.log('First action result selected, attempting auto-calculation...');
      const autoFudDate = await calculateAutoFud(actionResultId, isPromiseToPay ? updatedLoanActions[loanAccountNumber].promiseDate : undefined);
      
      if (autoFudDate) {
        console.log('Auto-calculated FUD for first action:', autoFudDate);
        setGlobalFudDate(autoFudDate);
        setGlobalFudAutoCalculated(true);
        
        // Update all loan actions with the auto-calculated FUD
        Object.keys(updatedLoanActions).forEach(accountNumber => {
          updatedLoanActions[accountNumber] = {
            ...updatedLoanActions[accountNumber],
            fUpdate: autoFudDate,
            fudAutoCalculated: true,
            fudManualOverride: false
          };
        });
      }
    }
    
    // If global FUD is auto-calculated, recalculate based on minimum promise date
    if (globalFudAutoCalculated) {
      // Find all selected loans with promise dates and action results
      const selectedLoansWithData = Object.values(updatedLoanActions)
        .filter(action => action.selected && action.actionResultId);
      
      if (selectedLoansWithData.length > 0) {
        // For promise to pay actions, use the minimum promise date
        const promiseToPayActions = selectedLoansWithData.filter(action => {
          const result = actionResults.find(r => r.result_id === action.actionResultId);
          return result?.is_promise && action.promiseDate;
        });
        
        let calculatedFudDate = null;
        
        if (promiseToPayActions.length > 0) {
          // Find the minimum promise date
          const minPromiseDate = promiseToPayActions.reduce((min, action) => {
            if (!min || action.promiseDate < min) {
              return action.promiseDate;
            }
            return min;
          }, '');
          
          const actionWithMinDate = promiseToPayActions.find(action => action.promiseDate === minPromiseDate);
          if (actionWithMinDate) {
            calculatedFudDate = await calculateAutoFud(actionWithMinDate.actionResultId, minPromiseDate);
          }
        } else {
          // If no promise to pay actions, use the first selected action
          const firstAction = selectedLoansWithData[0];
          calculatedFudDate = await calculateAutoFud(firstAction.actionResultId);
        }
        
        if (calculatedFudDate) {
          setGlobalFudDate(calculatedFudDate);
          // Update all loan actions with new FUD
          Object.keys(updatedLoanActions).forEach(accountNumber => {
            updatedLoanActions[accountNumber] = {
              ...updatedLoanActions[accountNumber],
              fUpdate: calculatedFudDate
            };
          });
        }
      }
    }
    
    setLoanActions(updatedLoanActions);
  }, [actionResults, loans, globalFudDate, globalFudAutoCalculated, loanActions, calculateAutoFud]);

  const handleFieldChange = useCallback(async (loanAccountNumber: string, field: keyof LoanActionData, value: string | boolean) => {
    // First update the field value
    let updatedLoanActions = { ...loanActions };
    updatedLoanActions[loanAccountNumber] = {
      ...updatedLoanActions[loanAccountNumber],
      [field]: value
    };
    
    // If changing promise date and global FUD is auto-calculated, recalculate global FUD based on minimum promise date
    if (field === 'promiseDate' && typeof value === 'string' && globalFudAutoCalculated) {
      console.log('Promise date changed, recalculating FUD...');
      
      // Check if this loan has a promise-to-pay action result
      const currentAction = updatedLoanActions[loanAccountNumber];
      if (currentAction.actionResultId) {
        const actionResult = actionResults.find(r => r.result_id === currentAction.actionResultId);
        if (actionResult?.is_promise) {
          // Find all selected loans with promise-to-pay action results and promise dates
          const selectedPromiseActions = Object.values(updatedLoanActions)
            .filter(action => {
              if (!action.selected || !action.actionResultId || !action.promiseDate) return false;
              const result = actionResults.find(r => r.result_id === action.actionResultId);
              return result?.is_promise;
            });
          
          if (selectedPromiseActions.length > 0) {
            // Find the minimum promise date
            const minPromiseDate = selectedPromiseActions.reduce((min, action) => {
              if (!min || action.promiseDate < min) {
                return action.promiseDate;
              }
              return min;
            }, '');
            
            console.log('Minimum promise date:', minPromiseDate);
            
            // Find the action with the minimum promise date
            const actionWithMinDate = selectedPromiseActions.find(action => action.promiseDate === minPromiseDate);
            
            if (actionWithMinDate && actionWithMinDate.actionResultId) {
              console.log('Calculating FUD for action:', actionWithMinDate.actionResultId, 'with date:', minPromiseDate);
              const autoFudDate = await calculateAutoFud(actionWithMinDate.actionResultId, minPromiseDate);
              
              if (autoFudDate) {
                console.log('New FUD date:', autoFudDate);
                setGlobalFudDate(autoFudDate);
                // Update all loan actions with new FUD
                Object.keys(updatedLoanActions).forEach(accountNumber => {
                  updatedLoanActions[accountNumber] = {
                    ...updatedLoanActions[accountNumber],
                    fUpdate: autoFudDate
                  };
                });
              }
            }
          }
        }
      }
    }
    
    setLoanActions(updatedLoanActions);
  }, [loanActions, globalFudAutoCalculated, actionResults, calculateAutoFud]);


  const handleSelectAll = useCallback((checked: boolean) => {
    setLoanActions(prev => {
      const updated = { ...prev };
      Object.keys(updated).forEach(loanAccountNumber => {
        updated[loanAccountNumber] = {
          ...updated[loanAccountNumber],
          selected: checked
        };
      });
      return updated;
    });
  }, []);

  const handleGlobalNotesApply = useCallback(() => {
    if (applyGlobalNotes && globalNotes.trim()) {
      setLoanActions(prev => {
        const updated = { ...prev };
        Object.keys(updated).forEach(loanAccountNumber => {
          if (updated[loanAccountNumber].selected) {
            updated[loanAccountNumber] = {
              ...updated[loanAccountNumber],
              notes: globalNotes.trim()
            };
          }
        });
        return updated;
      });
    }
  }, [applyGlobalNotes, globalNotes]);

  useEffect(() => {
    handleGlobalNotesApply();
  }, [applyGlobalNotes, globalNotes, handleGlobalNotesApply]);

  const handleCustomerLevelFieldChange = useCallback((field: string, value: string) => {
    setCustomerLevelAction(prev => ({
      ...prev,
      [field]: value
    }));
  }, []);

  const handleApplyToAllLoans = useCallback(async () => {
    if (!customerLevelAction.actionResultId) return;

    const actionResult = actionResults.find(result => result.result_id === customerLevelAction.actionResultId);
    const isPromiseToPay = actionResult?.is_promise || false;

    // If FUD is not set yet, try to auto-calculate it
    let fudDateToUse = globalFudDate;
    let isAutoCalculated = globalFudAutoCalculated;
    
    if (!globalFudDate || globalFudDate === '') {
      console.log('No global FUD date set, attempting auto-calculation...');
      const autoFudDate = await calculateAutoFud(
        customerLevelAction.actionResultId,
        isPromiseToPay ? customerLevelAction.promiseDate : undefined
      );
      
      if (autoFudDate) {
        console.log('Auto-calculated FUD for customer-level action:', autoFudDate);
        fudDateToUse = autoFudDate;
        isAutoCalculated = true;
        setGlobalFudDate(autoFudDate);
        setGlobalFudAutoCalculated(true);
      }
    }

    setLoanActions(prev => {
      const updated = { ...prev };
      Object.keys(updated).forEach(loanAccountNumber => {
        const loan = loans.find(l => l.accountNumber === loanAccountNumber);
        updated[loanAccountNumber] = {
          ...updated[loanAccountNumber],
          selected: true, // Auto-select all loans
          actionResultId: customerLevelAction.actionResultId,
          fUpdate: fudDateToUse, // Use calculated or existing FUD date
          promiseAmount: isPromiseToPay && loan ?
            (customerLevelAction.promiseAmount || String(loan.dueAmount)) : '',
          promiseDate: isPromiseToPay ? customerLevelAction.promiseDate : '',
          notes: customerLevelAction.notes,
          fudAutoCalculated: isAutoCalculated,
          fudManualOverride: !isAutoCalculated
        };
      });
      return updated;
    });
  }, [customerLevelAction, actionResults, loans, globalFudDate, globalFudAutoCalculated, calculateAutoFud]);

  const isCustomerLevelPromiseToPayResult = (): boolean => {
    if (!customerLevelAction.actionResultId) return false;
    const actionResult = actionResults.find(result => result.result_id === customerLevelAction.actionResultId);
    return actionResult?.is_promise || false;
  };

  const validateForm = (): string | null => {
    const selectedActions = Object.values(loanActions).filter(action => action.selected);
    
    if (selectedActions.length === 0) {
      return t('customers:record_action.validation.select_at_least_one_loan');
    }

    if (!selectedActionTypeId) {
      return t('customers:record_action.validation.select_action_type');
    }

    if (!selectedActionSubtypeId) {
      return t('customers:record_action.validation.select_action_subtype');
    }

    for (const action of selectedActions) {
      if (!action.actionResultId) {
        return t('customers:record_action.validation.select_action_result');
      }

      // Validate promise fields if result is PROMISE_TO_PAY
      const actionResult = actionResults.find(result => result.result_id === action.actionResultId);
      
      if (actionResult?.result_code) {
        if (!action.promiseAmount || parseFloat(action.promiseAmount) <= 0) {
          return t('customers:record_action.validation.promise_amount_required');
        }
        if (!action.promiseDate) {
          return t('customers:record_action.validation.promise_date_required');
        }
      }
    }

    return null;
  };

  const handleSubmit = async (onSuccess?: () => void, onClose?: () => void) => {
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const selectedActions = Object.values(loanActions).filter(action => action.selected);

      const bulkActions = selectedActions.map(action => {
        const loan = loans.find(l => l.accountNumber === action.loanAccountNumber);
        
        return {
          cif: customer.cif,
          loanAccountNumber: action.loanAccountNumber,
          actionTypeId: selectedActionTypeId,
          actionSubtypeId: selectedActionSubtypeId,
          actionResultId: action.actionResultId,
          actionDate: new Date().toISOString(),
          promiseDate: action.promiseDate || undefined,
          promiseAmount: action.promiseAmount ? parseFloat(action.promiseAmount) : undefined,
          dueAmount: loan ? (typeof loan.dueAmount === 'string' ? parseFloat(loan.dueAmount) : loan.dueAmount) : undefined,
          dpd: loan?.dpd || 0,
          fUpdate: globalFudDate, // Use global FUD date
          notes: action.notes || undefined
        };
      });

      const result = await workflowApi.recordBulkActions(bulkActions);
      
      if (result.summary.failed > 0) {
        setError(t('customers:record_action.messages.partial_success', {
          replace: {
            successful: result.summary.successful,
            failed: result.summary.failed
          }
        }));
      } else {
        onSuccess?.();
        onClose?.();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t('customers:messages.failed_to_load_action_types'));
      console.error('Error recording actions:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const isPromiseToPayResult = (loanAccountNumber: string): boolean => {
    const action = loanActions[loanAccountNumber];
    if (!action?.actionResultId) return false;
    const actionResult = actionResults.find(result => result.result_id === action.actionResultId);
    return actionResult?.is_promise || false;
  };

  const selectedCount = Object.values(loanActions).filter(action => action.selected).length;
  const allSelected = selectedCount === loans.length && loans.length > 0;
  const someSelected = selectedCount > 0 && selectedCount < loans.length;

  return {
    // State
    actionTypes,
    actionSubtypes,
    actionResults,
    selectedActionTypeId,
    selectedActionSubtypeId,
    loanActions,
    actionMode,
    customerLevelAction,
    globalNotes,
    applyGlobalNotes,
    globalFudDate,
    globalFudAutoCalculated,
    loading,
    submitting,
    error,
    selectedCount,
    allSelected,
    someSelected,
    canOverrideFud,
    
    // Setters
    setGlobalNotes,
    setApplyGlobalNotes,
    setError,
    setActionMode,
    
    // Handlers
    handleActionTypeChange,
    handleActionSubtypeChange,
    handleActionResultChange,
    handleFieldChange,
    handleSelectAll,
    handleSubmit,
    handleCustomerLevelFieldChange,
    handleApplyToAllLoans,
    handleGlobalFudDateChange,
    toggleGlobalFudAutoCalculation,
    
    // Utilities
    isPromiseToPayResult,
    isCustomerLevelPromiseToPayResult,
    validateForm
  };
};