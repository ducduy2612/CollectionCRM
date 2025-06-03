import React, { useState, useEffect, useCallback } from 'react';
import { Modal, ModalFooter } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import { Select, SelectOption } from '../../../components/ui/Select';
import { Input } from '../../../components/ui/Input';
import { Spinner } from '../../../components/ui/Spinner';
import { Alert } from '../../../components/ui/Alert';
import { workflowApi, ActionType, ActionSubtype, ActionResult } from '../../../services/api/workflow.api';

export interface ActionSearchFilters {
  loanAccountNumber?: string;
  agentName?: string;
  actionType?: string;
  actionSubtype?: string;
  actionResult?: string;
  startDate?: string;
  endDate?: string;
}

interface ActionSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSearch: (filters: ActionSearchFilters) => void;
  currentFilters?: ActionSearchFilters;
}

const ActionSearchModal: React.FC<ActionSearchModalProps> = ({
  isOpen,
  onClose,
  onSearch,
  currentFilters = {}
}) => {
  // State for dropdown options
  const [actionTypes, setActionTypes] = useState<ActionType[]>([]);
  const [actionSubtypes, setActionSubtypes] = useState<ActionSubtype[]>([]);
  const [actionResults, setActionResults] = useState<ActionResult[]>([]);

  // Form state
  const [filters, setFilters] = useState<ActionSearchFilters>(currentFilters);
  const [selectedActionTypeCode, setSelectedActionTypeCode] = useState('');
  const [selectedActionSubtypeCode, setSelectedActionSubtypeCode] = useState('');

  // Loading and error states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize form when modal opens
  useEffect(() => {
    if (isOpen) {
      setFilters(currentFilters);
      loadActionTypes();
      
      // Find and set the selected type/subtype codes for cascading dropdowns
      if (currentFilters.actionType) {
        const actionType = actionTypes.find(type => type.code === currentFilters.actionType);
        if (actionType) {
          setSelectedActionTypeCode(actionType.code);
          loadActionSubtypes(actionType.code);
        }
      }
      
      if (currentFilters.actionSubtype) {
        setSelectedActionSubtypeCode(currentFilters.actionSubtype);
        loadActionResults(currentFilters.actionSubtype);
      }
    }
  }, [isOpen, currentFilters]);

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSelectedActionTypeCode('');
      setSelectedActionSubtypeCode('');
      setActionSubtypes([]);
      setActionResults([]);
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

  const handleActionTypeChange = useCallback(async (actionTypeCode: string) => {
    setSelectedActionTypeCode(actionTypeCode);
    setSelectedActionSubtypeCode(''); // Reset subtype
    setActionResults([]); // Reset results
    
    // Update filters
    setFilters(prev => ({
      ...prev,
      actionType: actionTypeCode || undefined,
      actionSubtype: undefined,
      actionResult: undefined
    }));

    // Load subtypes for this action type
    if (actionTypeCode) {
      await loadActionSubtypes(actionTypeCode);
    } else {
      setActionSubtypes([]);
    }
  }, []);

  const handleActionSubtypeChange = useCallback(async (actionSubtypeCode: string) => {
    setSelectedActionSubtypeCode(actionSubtypeCode);
    
    // Update filters
    setFilters(prev => ({
      ...prev,
      actionSubtype: actionSubtypeCode || undefined,
      actionResult: undefined
    }));

    // Load results for this subtype
    if (actionSubtypeCode) {
      await loadActionResults(actionSubtypeCode);
    } else {
      setActionResults([]);
    }
  }, []);

  const handleFilterChange = (field: keyof ActionSearchFilters, value: string) => {
    setFilters(prev => ({
      ...prev,
      [field]: value || undefined
    }));
  };

  const handleSearch = () => {
    // Remove empty values
    const cleanFilters = Object.entries(filters).reduce((acc, [key, value]) => {
      if (value && value.trim() !== '') {
        acc[key as keyof ActionSearchFilters] = value.trim();
      }
      return acc;
    }, {} as ActionSearchFilters);

    onSearch(cleanFilters);
    onClose();
  };

  const handleClearFilters = () => {
    setFilters({});
    setSelectedActionTypeCode('');
    setSelectedActionSubtypeCode('');
    setActionSubtypes([]);
    setActionResults([]);
  };

  const getActionTypeOptions = (): SelectOption[] => {
    return [
      { value: '', label: 'All Types' },
      ...actionTypes.map(type => ({
        value: type.code,
        label: type.name
      }))
    ];
  };

  const getActionSubtypeOptions = (): SelectOption[] => {
    return [
      { value: '', label: 'All Subtypes' },
      ...actionSubtypes.map(subtype => ({
        value: subtype.subtype_code,
        label: subtype.subtype_name
      }))
    ];
  };

  const getActionResultOptions = (): SelectOption[] => {
    return [
      { value: '', label: 'All Results' },
      ...actionResults.map(result => ({
        value: result.result_code,
        label: result.result_name
      }))
    ];
  };

  const hasActiveFilters = Object.values(filters).some(value => value && value.trim() !== '');

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Search Action History"
      description="Filter actions by various criteria"
      size="lg"
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
            {/* Basic Filters */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Loan Account Number"
                type="text"
                value={filters.loanAccountNumber || ''}
                onChange={(e) => handleFilterChange('loanAccountNumber', e.target.value)}
                placeholder="Enter loan account number"
              />
              <Input
                label="Agent Name"
                type="text"
                value={filters.agentName || ''}
                onChange={(e) => handleFilterChange('agentName', e.target.value)}
                placeholder="Enter agent name"
              />
            </div>

            {/* Action Configuration */}
            <div className="bg-neutral-50 border rounded-lg p-4">
              <h4 className="font-medium text-neutral-900 mb-4">Action Filters</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Select
                  label="Action Type"
                  options={getActionTypeOptions()}
                  value={selectedActionTypeCode}
                  onChange={(e) => handleActionTypeChange(e.target.value)}
                  placeholder="Select Action Type"
                />
                <Select
                  label="Action Subtype"
                  options={getActionSubtypeOptions()}
                  value={selectedActionSubtypeCode}
                  onChange={(e) => handleActionSubtypeChange(e.target.value)}
                  placeholder="Select Action Subtype"
                  disabled={!selectedActionTypeCode}
                />
                <Select
                  label="Action Result"
                  options={getActionResultOptions()}
                  value={filters.actionResult || ''}
                  onChange={(e) => handleFilterChange('actionResult', e.target.value)}
                  placeholder="Select Action Result"
                  disabled={!selectedActionSubtypeCode}
                />
              </div>
            </div>

            {/* Date Range */}
            <div className="bg-neutral-50 border rounded-lg p-4">
              <h4 className="font-medium text-neutral-900 mb-4">Date Range</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Start Date"
                  type="date"
                  value={filters.startDate || ''}
                  onChange={(e) => handleFilterChange('startDate', e.target.value)}
                />
                <Input
                  label="End Date"
                  type="date"
                  value={filters.endDate || ''}
                  onChange={(e) => handleFilterChange('endDate', e.target.value)}
                />
              </div>
            </div>

            {/* Active Filters Summary */}
            {hasActiveFilters && (
              <div className="bg-primary-50 border border-primary-200 rounded-lg p-4">
                <h4 className="font-medium text-primary-900 mb-2">Active Filters</h4>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(filters).map(([key, value]) => {
                    if (!value || value.trim() === '') return null;
                    
                    let displayKey = key;
                    switch (key) {
                      case 'loanAccountNumber': displayKey = 'Loan Account'; break;
                      case 'agentName': displayKey = 'Agent'; break;
                      case 'actionType': displayKey = 'Type'; break;
                      case 'actionSubtype': displayKey = 'Subtype'; break;
                      case 'actionResult': displayKey = 'Result'; break;
                      case 'startDate': displayKey = 'From'; break;
                      case 'endDate': displayKey = 'To'; break;
                    }
                    
                    return (
                      <span key={key} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                        {displayKey}: {value}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <ModalFooter>
        <Button variant="secondary" onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button 
          variant="secondary" 
          onClick={handleClearFilters} 
          disabled={loading || !hasActiveFilters}
        >
          Clear Filters
        </Button>
        <Button 
          variant="primary" 
          onClick={handleSearch} 
          disabled={loading}
        >
          {loading ? (
            <>
              <Spinner size="sm" className="mr-2" />
              Loading...
            </>
          ) : (
            'Apply Filters'
          )}
        </Button>
      </ModalFooter>
    </Modal>
  );
};

export default ActionSearchModal;