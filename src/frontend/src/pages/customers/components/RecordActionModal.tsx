import React, { useState, useEffect, useCallback } from 'react';
import { Modal, ModalFooter } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../../components/ui/Table';
import { Select, SelectOption } from '../../../components/ui/Select';
import { Input } from '../../../components/ui/Input';
import { Spinner } from '../../../components/ui/Spinner';
import { Alert } from '../../../components/ui/Alert';
import { workflowApi, ActionType, ActionSubtype, ActionResult } from '../../../services/api/workflow.api';
import { Customer, Loan } from '../types';

interface RecordActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: Customer;
  loans: Loan[];
  onSuccess?: () => void;
}

interface LoanActionData {
  loanAccountNumber: string;
  selected: boolean;
  actionResultId: string;
  fUpdate: string;
  promiseAmount: string;
  promiseDate: string;
  notes: string;
}

const RecordActionModal: React.FC<RecordActionModalProps> = ({
  isOpen,
  onClose,
  customer,
  loans,
  onSuccess
}) => {
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
      setError('Failed to load action types');
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
  }, [actionSubtypes, loans]);

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
      return 'Please select at least one loan to record actions for.';
    }

    if (!selectedActionTypeId) {
      return 'Please select an Action Type.';
    }

    if (!selectedActionSubtypeId) {
      return 'Please select an Action SubType.';
    }

    for (const action of selectedActions) {
      if (!action.actionResultId) {
        return 'Please select an Action Result for all selected loans.';
      }

      // Validate promise fields if result is PROMISE_TO_PAY
      const actionResult = actionResults.find(result => result.result_id === action.actionResultId);
      
      if (actionResult?.result_code === 'PROMISE_TO_PAY') {
        if (!action.promiseAmount || parseFloat(action.promiseAmount) <= 0) {
          return 'Promise Amount is required and must be greater than 0 for Promise to Pay actions.';
        }
        if (!action.promiseDate) {
          return 'Promise Date is required for Promise to Pay actions.';
        }
      }
    }

    return null;
  };

  const handleSubmit = async () => {
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
        setError(`${result.summary.successful} actions recorded successfully, ${result.summary.failed} failed.`);
      } else {
        onSuccess?.();
        onClose();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to record actions');
      console.error('Error recording actions:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const getActionTypeOptions = (): SelectOption[] => {
    return actionTypes.map(type => ({
      value: type.id,
      label: type.name
    }));
  };

  const getActionSubtypeOptions = (): SelectOption[] => {
    return actionSubtypes.map(subtype => ({
      value: subtype.subtype_id,
      label: subtype.subtype_name
    }));
  };

  const getActionResultOptions = (): SelectOption[] => {
    return actionResults.map(result => ({
      value: result.result_id,
      label: result.result_name
    }));
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

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Record Action"
      description={`Record actions for ${customer.name} (${customer.cif})`}
      size="full"
    >
      <div className="space-y-6">
        {error && (
          <Alert variant="danger">
            {error}
          </Alert>
        )}

        {loading ? (
          <div className="flex justify-center py-8">
            <Spinner size="lg" />
          </div>
        ) : (
          <>
            {/* Customer-level Action Type and SubType Selection */}
            <div className="bg-neutral-50 border rounded-lg p-4">
              <h4 className="font-medium text-neutral-900 mb-4">Action Configuration</h4>
              <div className="grid grid-cols-2 gap-4">
                <Select
                  label="Action Type"
                  options={getActionTypeOptions()}
                  value={selectedActionTypeId}
                  onChange={(e) => handleActionTypeChange(e.target.value)}
                  placeholder="Select Action Type"
                />
                <Select
                  label="Action SubType"
                  options={getActionSubtypeOptions()}
                  value={selectedActionSubtypeId}
                  onChange={(e) => handleActionSubtypeChange(e.target.value)}
                  placeholder="Select Action SubType"
                  disabled={!selectedActionTypeId}
                />
              </div>
            </div>

            {/* Loans Table */}
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <input
                        type="checkbox"
                        checked={allSelected}
                        ref={input => {
                          if (input) input.indeterminate = someSelected;
                        }}
                        onChange={(e) => handleSelectAll(e.target.checked)}
                        className="rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
                      />
                    </TableHead>
                    <TableHead>Loan Account</TableHead>
                    <TableHead>Due Amount</TableHead>
                    <TableHead>DPD</TableHead>
                    <TableHead>Action Result</TableHead>
                    <TableHead>Follow Up Date</TableHead>
                    <TableHead>Promise Amount</TableHead>
                    <TableHead>Promise Date</TableHead>
                    <TableHead>Notes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loans.map((loan) => {
                    const action = loanActions[loan.accountNumber];
                    const isPromiseToPay = isPromiseToPayResult(loan.accountNumber);
                    
                    return (
                      <TableRow key={loan.accountNumber}>
                        <TableCell>
                          <input
                            type="checkbox"
                            checked={action?.selected || false}
                            onChange={(e) => handleFieldChange(loan.accountNumber, 'selected', e.target.checked)}
                            className="rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
                          />
                        </TableCell>
                        <TableCell className="font-medium">{loan.accountNumber}</TableCell>
                        <TableCell>${typeof loan.dueAmount === 'string' ? parseFloat(loan.dueAmount).toLocaleString() : loan.dueAmount.toLocaleString()}</TableCell>
                        <TableCell>{loan.dpd}</TableCell>
                        <TableCell>
                          <Select
                            options={getActionResultOptions()}
                            value={action?.actionResultId || ''}
                            onChange={(e) => handleActionResultChange(loan.accountNumber, e.target.value)}
                            placeholder="Select Result"
                            disabled={!selectedActionSubtypeId}
                            className="min-w-[150px]"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="date"
                            value={action?.fUpdate || ''}
                            onChange={(e) => handleFieldChange(loan.accountNumber, 'fUpdate', e.target.value)}
                            className="min-w-[140px]"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            step="0.01"
                            value={action?.promiseAmount || ''}
                            onChange={(e) => handleFieldChange(loan.accountNumber, 'promiseAmount', e.target.value)}
                            disabled={!isPromiseToPay}
                            placeholder={isPromiseToPay ? 'Required' : 'N/A'}
                            className="min-w-[120px]"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="date"
                            value={action?.promiseDate || ''}
                            onChange={(e) => handleFieldChange(loan.accountNumber, 'promiseDate', e.target.value)}
                            disabled={!isPromiseToPay}
                            placeholder={isPromiseToPay ? 'Required' : 'N/A'}
                            className="min-w-[140px]"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="text"
                            value={action?.notes || ''}
                            onChange={(e) => handleFieldChange(loan.accountNumber, 'notes', e.target.value)}
                            placeholder="Enter notes"
                            className="min-w-[200px]"
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            {/* Global Notes Section */}
            <div className="border rounded-lg p-4 bg-neutral-50">
              <h4 className="font-medium text-neutral-900 mb-3">Global Notes</h4>
              <div className="space-y-3">
                <Input
                  type="text"
                  value={globalNotes}
                  onChange={(e) => setGlobalNotes(e.target.value)}
                  placeholder="Enter notes to apply to all selected loans"
                />
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={applyGlobalNotes}
                    onChange={(e) => setApplyGlobalNotes(e.target.checked)}
                    className="rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="text-sm text-neutral-700">
                    Apply these notes to all selected loans
                  </span>
                </label>
              </div>
            </div>
          </>
        )}
      </div>

      <ModalFooter>
        <Button variant="secondary" onClick={onClose} disabled={submitting}>
          Cancel
        </Button>
        <Button 
          variant="primary" 
          onClick={handleSubmit} 
          disabled={loading || submitting || selectedCount === 0}
        >
          {submitting ? (
            <>
              <Spinner size="sm" className="mr-2" />
              Recording Actions...
            </>
          ) : (
            `Record Actions (${selectedCount})`
          )}
        </Button>
      </ModalFooter>
    </Modal>
  );
};

export default RecordActionModal;