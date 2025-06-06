import { useState, useEffect, useCallback } from 'react';
import { workflowApi } from '../../../../services/api/workflow.api';
import { Customer, Loan, ActionType, ActionSubtype, ActionResult } from '../../types';
import { useTranslation } from '../../../../i18n/hooks/useTranslation';

export interface LoanActionData {
  loanAccountNumber: string;
  selected: boolean;
  actionResultId: string;
  fUpdate: string;
  promiseAmount: string;
  promiseDate: string;
  notes: string;
}

interface UseRecordActionModalProps {
  isOpen: boolean;
  customer: Customer;
  loans: Loan[];
}

export const useRecordActionModal = ({ isOpen, customer, loans }: UseRecordActionModalProps) => {
  const { t } = useTranslation();
  
  // State for dropdown options
  const [actionTypes, setActionTypes] = useState<ActionType[]>([]);
  const [actionSubtypes, setActionSubtypes] = useState<ActionSubtype[]>([]);
  const [actionResults, setActionResults] = useState<ActionResult[]>([]);

  // Customer-level action selections
  const [selectedActionTypeId, setSelectedActionTypeId] = useState('');
  const [selectedActionSubtypeId, setSelectedActionSubtypeId] = useState('');

  // State for loan actions
  const [loanActions, setLoanActions] = useState<{ [key: string]: LoanActionData }>({});
  
  // Global notes state
  const [globalNotes, setGlobalNotes] = useState('');
  const [applyGlobalNotes, setApplyGlobalNotes] = useState(false);

  // Loading and error states
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize loan actions when modal opens
  useEffect(() => {
    if (isOpen && loans.length > 0) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().split('T')[0];

      const initialActions: { [key: string]: LoanActionData } = {};
      loans.forEach(loan => {
        initialActions[loan.accountNumber] = {
          loanAccountNumber: loan.accountNumber,
          selected: false,
          actionResultId: '',
          fUpdate: tomorrowStr,
          promiseAmount: '',
          promiseDate: '',
          notes: ''
        };
      });
      setLoanActions(initialActions);
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

  const handleActionResultChange = useCallback((loanAccountNumber: string, actionResultId: string) => {
    const actionResult = actionResults.find(result => result.result_id === actionResultId);
    const isPromiseToPay = actionResult?.result_code === 'PROMISE_TO_PAY';
    const loan = loans.find(l => l.accountNumber === loanAccountNumber);
    
    setLoanActions(prev => ({
      ...prev,
      [loanAccountNumber]: {
        ...prev[loanAccountNumber],
        actionResultId,
        promiseAmount: isPromiseToPay && loan ? String(loan.dueAmount) : '',
        promiseDate: isPromiseToPay ? prev[loanAccountNumber].promiseDate : ''
      }
    }));
  }, [actionResults, loans]);

  const handleFieldChange = useCallback((loanAccountNumber: string, field: keyof LoanActionData, value: string | boolean) => {
    setLoanActions(prev => ({
      ...prev,
      [loanAccountNumber]: {
        ...prev[loanAccountNumber],
        [field]: value
      }
    }));
  }, []);

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
      
      if (actionResult?.result_code === 'PROMISE_TO_PAY') {
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
          fUpdate: action.fUpdate,
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
    return actionResult?.result_code === 'PROMISE_TO_PAY';
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
    globalNotes,
    applyGlobalNotes,
    loading,
    submitting,
    error,
    selectedCount,
    allSelected,
    someSelected,
    
    // Setters
    setGlobalNotes,
    setApplyGlobalNotes,
    setError,
    
    // Handlers
    handleActionTypeChange,
    handleActionSubtypeChange,
    handleActionResultChange,
    handleFieldChange,
    handleSelectAll,
    handleSubmit,
    
    // Utilities
    isPromiseToPayResult,
    validateForm
  };
};