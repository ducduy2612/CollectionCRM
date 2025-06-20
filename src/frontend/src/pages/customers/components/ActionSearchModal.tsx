import React, { useState, useEffect, useCallback } from 'react';
import { Modal, ModalFooter } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import { Select, SelectOption } from '../../../components/ui/Select';
import { Input } from '../../../components/ui/Input';
import { Spinner } from '../../../components/ui/Spinner';
import { Alert } from '../../../components/ui/Alert';
import { workflowApi } from '../../../services/api/workflow.api';
import { ActionType, ActionSubtype, ActionResult } from '../types';
import { useTranslation } from '../../../i18n/hooks/useTranslation';

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
  const { t } = useTranslation(['customers', 'forms', 'common']);
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
      setError(t('customers:messages.failed_to_load_action_types'));
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
      { value: '', label: t('customers:action_search.all_types') },
      ...actionTypes.map(type => ({
        value: type.code,
        label: type.name
      }))
    ];
  };

  const getActionSubtypeOptions = (): SelectOption[] => {
    return [
      { value: '', label: t('customers:action_search.all_subtypes') },
      ...actionSubtypes
        .filter(subtype => subtype.subtype_code && subtype.subtype_name)
        .map(subtype => ({
          value: subtype.subtype_code!,
          label: subtype.subtype_name!
        }))
    ];
  };

  const getActionResultOptions = (): SelectOption[] => {
    return [
      { value: '', label: t('customers:action_search.all_results') },
      ...actionResults
        .filter(result => result.result_code && result.result_name)
        .map(result => ({
          value: result.result_code!,
          label: result.result_name!
      }))
    ];
  };

  const hasActiveFilters = Object.values(filters).some(value => value && value.trim() !== '');

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('customers:action_search.title')}
      description={t('customers:action_search.description')}
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
                label={t('customers:action_search.loan_account_number')}
                type="text"
                value={filters.loanAccountNumber || ''}
                onChange={(e) => handleFilterChange('loanAccountNumber', e.target.value)}
                placeholder={t('customers:action_search.placeholders.loan_account_number')}
              />
              <Input
                label={t('customers:action_search.agent_name')}
                type="text"
                value={filters.agentName || ''}
                onChange={(e) => handleFilterChange('agentName', e.target.value)}
                placeholder={t('customers:action_search.placeholders.agent_name')}
              />
            </div>

            {/* Action Configuration */}
            <div className="bg-neutral-50 border rounded-lg p-4">
              <h4 className="font-medium text-neutral-900 mb-4">{t('customers:action_search.action_filters')}</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Select
                  label={t('customers:action_search.action_type')}
                  options={getActionTypeOptions()}
                  value={selectedActionTypeCode}
                  onChange={(e) => handleActionTypeChange(e.target.value)}
                  placeholder={t('customers:action_search.placeholders.select_action_type')}
                />
                <Select
                  label={t('customers:action_search.action_subtype')}
                  options={getActionSubtypeOptions()}
                  value={selectedActionSubtypeCode}
                  onChange={(e) => handleActionSubtypeChange(e.target.value)}
                  placeholder={t('customers:action_search.placeholders.select_action_subtype')}
                  disabled={!selectedActionTypeCode}
                />
                <Select
                  label={t('customers:action_search.action_result')}
                  options={getActionResultOptions()}
                  value={filters.actionResult || ''}
                  onChange={(e) => handleFilterChange('actionResult', e.target.value)}
                  placeholder={t('customers:action_search.placeholders.select_action_result')}
                  disabled={!selectedActionSubtypeCode}
                />
              </div>
            </div>

            {/* Date Range */}
            <div className="bg-neutral-50 border rounded-lg p-4">
              <h4 className="font-medium text-neutral-900 mb-4">{t('customers:action_search.date_range')}</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label={t('customers:action_search.start_date')}
                  type="date"
                  value={filters.startDate || ''}
                  onChange={(e) => handleFilterChange('startDate', e.target.value)}
                />
                <Input
                  label={t('customers:action_search.end_date')}
                  type="date"
                  value={filters.endDate || ''}
                  onChange={(e) => handleFilterChange('endDate', e.target.value)}
                />
              </div>
            </div>

            {/* Active Filters Summary */}
            {hasActiveFilters && (
              <div className="bg-primary-50 border border-primary-200 rounded-lg p-4">
                <h4 className="font-medium text-primary-900 mb-2">{t('customers:action_search.active_filters')}</h4>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(filters).map(([key, value]) => {
                    if (!value || value.trim() === '') return null;
                    
                    let displayKey = key;
                    switch (key) {
                      case 'loanAccountNumber': displayKey = t('customers:action_search.filter_labels.loan_account'); break;
                      case 'agentName': displayKey = t('customers:action_search.filter_labels.agent'); break;
                      case 'actionType': displayKey = t('customers:action_search.filter_labels.type'); break;
                      case 'actionSubtype': displayKey = t('customers:action_search.filter_labels.subtype'); break;
                      case 'actionResult': displayKey = t('customers:action_search.filter_labels.result'); break;
                      case 'startDate': displayKey = t('customers:action_search.filter_labels.from'); break;
                      case 'endDate': displayKey = t('customers:action_search.filter_labels.to'); break;
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
          {t('forms:buttons.cancel')}
        </Button>
        <Button
          variant="secondary"
          onClick={handleClearFilters}
          disabled={loading || !hasActiveFilters}
        >
          {t('forms:buttons.clear')}
        </Button>
        <Button
          variant="primary"
          onClick={handleSearch}
          disabled={loading}
        >
          {loading ? (
            <>
              <Spinner size="sm" className="mr-2" />
              {t('common:loading')}
            </>
          ) : (
            t('forms:buttons.apply')
          )}
        </Button>
      </ModalFooter>
    </Modal>
  );
};

export default ActionSearchModal;