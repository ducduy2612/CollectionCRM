import React, { useState, useEffect } from 'react';
import { Modal, Input, Button, Alert, Select } from '../../../../components/ui';
import { 
  fudAutoConfigApi, 
  FudAutoConfig, 
  CreateFudConfigRequest, 
  UpdateFudConfigRequest 
} from '../../../../services/api/workflow/fud-auto-config.api';
import { workflowApi } from '../../../../services/api/workflow';
import { ActionResult } from '../../../customers/types';
import { useTranslation } from '../../../../i18n/hooks/useTranslation';

interface FudRuleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  config?: FudAutoConfig | null;
  mode: 'create' | 'edit';
  existingConfigs?: FudAutoConfig[];
}

interface FormData {
  action_result_id: string;
  calculation_type: 'PROMISE_DATE' | 'ACTION_DATE';
  days_offset: number;
  is_active: boolean;
  priority: number;
}

interface FormErrors {
  action_result_id?: string;
  calculation_type?: string;
  days_offset?: string;
  priority?: string;
  general?: string;
}

const FudRuleModal: React.FC<FudRuleModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  config,
  mode,
  existingConfigs = []
}) => {
  const { t } = useTranslation();
  const [state, setState] = useState({
    formData: {
      action_result_id: '',
      calculation_type: 'ACTION_DATE' as 'PROMISE_DATE' | 'ACTION_DATE',
      days_offset: 1,
      is_active: true,
      priority: 0
    },
    errors: {} as FormErrors,
    loading: false,
    actionResults: [] as ActionResult[],
    loadingActionResults: false
  });

  // Initialize form data when config changes
  useEffect(() => {
    if (isOpen) {
      if (config && mode === 'edit') {
        setState(prev => ({
          ...prev,
          formData: {
            action_result_id: config.action_result_id,
            calculation_type: config.calculation_type,
            days_offset: config.days_offset,
            is_active: config.is_active,
            priority: config.priority
          },
          errors: {}
        }));
      } else {
        setState(prev => ({
          ...prev,
          formData: {
            action_result_id: '',
            calculation_type: 'ACTION_DATE',
            days_offset: 1,
            is_active: true,
            priority: 0
          },
          errors: {}
        }));
      }
    }
  }, [config, mode, isOpen]);

  // Load action results
  useEffect(() => {
    if (isOpen) {
      loadActionResults();
    }
  }, [isOpen]);

  const loadActionResults = async () => {
    try {
      setState(prev => ({ ...prev, loadingActionResults: true }));
      const results = await workflowApi.getAllActionResults();
      setState(prev => ({ ...prev, actionResults: results }));
    } catch (err) {
      console.error('Error loading action results:', err);
      setState(prev => ({ 
        ...prev, 
        errors: { ...prev.errors, general: 'Failed to load action results' }
      }));
    } finally {
      setState(prev => ({ ...prev, loadingActionResults: false }));
    }
  };

  // Validation
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!state.formData.action_result_id) {
      newErrors.action_result_id = t('settings:fud_auto_config.validation.action_result_required');
    }

    if (!state.formData.calculation_type) {
      newErrors.calculation_type = t('settings:fud_auto_config.validation.calculation_type_required');
    }

    if (state.formData.days_offset < -365 || state.formData.days_offset > 365) {
      newErrors.days_offset = t('settings:fud_auto_config.validation.days_offset_range');
    }

    if (state.formData.priority < 0 || state.formData.priority > 1000) {
      newErrors.priority = t('settings:fud_auto_config.validation.priority_range');
    }

    setState(prev => ({ ...prev, errors: newErrors }));
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setState(prev => ({ ...prev, loading: true, errors: {} }));

    try {
      if (mode === 'create') {
        const createData: CreateFudConfigRequest = {
          action_result_id: state.formData.action_result_id,
          calculation_type: state.formData.calculation_type,
          days_offset: state.formData.days_offset,
          is_active: state.formData.is_active,
          priority: state.formData.priority
        };
        await fudAutoConfigApi.createConfig(createData);
      } else if (config) {
        const updateData: UpdateFudConfigRequest = {
          calculation_type: state.formData.calculation_type,
          days_offset: state.formData.days_offset,
          is_active: state.formData.is_active,
          priority: state.formData.priority
        };
        await fudAutoConfigApi.updateConfig(config.id, updateData);
      }

      onSuccess();
    } catch (err) {
      setState(prev => ({
        ...prev,
        loading: false,
        errors: {
          general: err instanceof Error ? err.message : 'An error occurred'
        }
      }));
    } finally {
      setState(prev => ({ ...prev, loading: false }));
    }
  };

  // Handle input changes
  const handleInputChange = (field: keyof FormData) => (
    e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>
  ) => {
    const value = field === 'days_offset' || field === 'priority' 
      ? parseInt(e.target.value) || 0 
      : field === 'is_active'
      ? (e.target as HTMLInputElement).checked
      : e.target.value;

    setState(prev => ({
      ...prev,
      formData: { ...prev.formData, [field]: value },
      errors: { ...prev.errors, [field]: undefined, general: undefined }
    }));
  };

  const calculationTypeOptions = [
    { value: 'ACTION_DATE', label: t('settings:fud_auto_config.calculation_types.action_date') },
    { value: 'PROMISE_DATE', label: t('settings:fud_auto_config.calculation_types.promise_date') }
  ];

  // Filter out action results that already have active configurations
  // In edit mode, allow the current config's action result to be available
  const getAvailableActionResults = () => {
    const activeConfigActionResultIds = existingConfigs
      .filter(cfg => cfg.is_active && cfg.id !== config?.id) // Exclude current config in edit mode
      .map(cfg => cfg.action_result_id);

    return state.actionResults.filter(result => {
      const resultId = result.result_id || result.id;
      return !activeConfigActionResultIds.includes(resultId);
    });
  };

  const actionResultOptions = getAvailableActionResults().map(result => ({
    value: result.result_id || result.id,
    label: `${result.result_name || result.name} (${result.result_code || result.code})`
  }));

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={mode === 'create' 
        ? t('settings:fud_auto_config.modal.create_title')
        : t('settings:fud_auto_config.modal.edit_title')
      }
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* General Error */}
        {state.errors.general && (
          <Alert
            variant="danger"
            title={t('common:error')}
            onClose={() => setState(prev => ({ ...prev, errors: { ...prev.errors, general: undefined } }))}
          >
            {state.errors.general}
          </Alert>
        )}

        {/* Action Result Selection */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">
            {t('settings:fud_auto_config.form.action_result')}
          </label>
          <Select
            value={state.formData.action_result_id}
            onChange={handleInputChange('action_result_id')}
            options={actionResultOptions}
            placeholder={t('settings:fud_auto_config.form.select_action_result')}
            disabled={mode === 'edit' || state.loadingActionResults}
            error={state.errors.action_result_id}
          />
        </div>

        {/* Calculation Type */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">
            {t('settings:fud_auto_config.form.calculation_type')}
          </label>
          <Select
            value={state.formData.calculation_type}
            onChange={handleInputChange('calculation_type')}
            options={calculationTypeOptions}
            error={state.errors.calculation_type}
          />
          <p className="text-xs text-neutral-500 mt-1">
            {state.formData.calculation_type === 'PROMISE_DATE' 
              ? t('settings:fud_auto_config.form.calculation_type_promise_help')
              : t('settings:fud_auto_config.form.calculation_type_action_help')
            }
          </p>
        </div>

        {/* Days Offset */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">
            {t('settings:fud_auto_config.form.days_offset')}
          </label>
          <Input
            type="number"
            value={state.formData.days_offset}
            onChange={handleInputChange('days_offset')}
            min={-365}
            max={365}
            error={state.errors.days_offset}
            placeholder="1"
          />
          <p className="text-xs text-neutral-500 mt-1">
            {t('settings:fud_auto_config.form.days_offset_help')}
          </p>
        </div>

        {/* Priority */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">
            {t('settings:fud_auto_config.form.priority')}
          </label>
          <Input
            type="number"
            value={state.formData.priority}
            onChange={handleInputChange('priority')}
            min={0}
            max={1000}
            error={state.errors.priority}
            placeholder="0"
          />
          <p className="text-xs text-neutral-500 mt-1">
            {t('settings:fud_auto_config.form.priority_help')}
          </p>
        </div>

        {/* Active Status */}
        <div className="flex items-center">
          <input
            type="checkbox"
            id="is_active"
            checked={state.formData.is_active}
            onChange={handleInputChange('is_active')}
            className="rounded border-neutral-300 text-primary-600 shadow-sm focus:border-primary-500 focus:ring-primary-500"
          />
          <label htmlFor="is_active" className="ml-2 block text-sm text-neutral-700">
            {t('settings:fud_auto_config.form.is_active')}
          </label>
        </div>

        {/* Modal Actions */}
        <div className="flex justify-end space-x-3 pt-4 border-t border-neutral-200">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={state.loading}
          >
            {t('common:cancel')}
          </Button>
          <Button
            type="submit"
            variant="primary"
            loading={state.loading}
          >
            {mode === 'create' ? t('common:create') : t('common:update')}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export { FudRuleModal };