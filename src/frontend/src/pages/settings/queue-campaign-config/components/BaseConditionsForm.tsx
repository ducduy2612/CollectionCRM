import React from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '../../../../components/ui/Button';
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import type { 
  CreateBaseConditionRequest,
  DataSource,
  CustomFieldInfo,
  Operator
} from '../../../../services/api/campaign';

interface BaseConditionsFormProps {
  conditions: CreateBaseConditionRequest[];
  onChange: (conditions: CreateBaseConditionRequest[]) => void;
  dataSources: DataSource[];
  operators: Operator[];
}

const BaseConditionsForm: React.FC<BaseConditionsFormProps> = ({
  conditions,
  onChange,
  dataSources,
  operators
}) => {
  const { t } = useTranslation('settings');

  const addCondition = () => {
    const newCondition: CreateBaseConditionRequest = {
      field_name: '',
      operator: '',
      field_value: '',
      data_source: ''
    };
    onChange([...conditions, newCondition]);
  };

  const removeCondition = (index: number) => {
    const newConditions = conditions.filter((_, i) => i !== index);
    onChange(newConditions);
  };

  const updateCondition = (index: number, field: keyof CreateBaseConditionRequest, value: string) => {
    const newConditions = conditions.map((condition, i) => {
      if (i === index) {
        const updated = { ...condition, [field]: value };
        // Clear field_name when data_source changes since available fields change
        if (field === 'data_source' && value !== condition.data_source) {
          updated.field_name = '';
        }
        return updated;
      }
      return condition;
    });
    onChange(newConditions);
  };

  return (
    <div className="space-y-6">
      <div>
        <h4 className="text-lg font-medium text-neutral-900 mb-2">
          {t('campaign_config.campaigns.form.conditions.title')}
        </h4>
        <p className="text-sm text-neutral-600 mb-4">
          {t('campaign_config.campaigns.form.conditions.description')}
        </p>
      </div>

      {conditions.length === 0 ? (
        <div className="text-center py-8 border-2 border-dashed border-neutral-300 rounded-lg">
          <p className="text-sm text-neutral-500 mb-4">
            {t('campaign_config.campaigns.form.conditions.no_conditions')}
          </p>
          <Button onClick={addCondition} size="sm">
            <PlusIcon className="w-4 h-4 mr-2" />
            {t('campaign_config.campaigns.form.conditions.add_condition')}
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {conditions.map((condition, index) => (
            <div key={index} className="p-4 border border-neutral-200 rounded-lg space-y-4">
              <div className="flex justify-between items-center">
                <h5 className="text-sm font-medium text-neutral-900">
                  Condition {index + 1}
                </h5>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => removeCondition(index)}
                >
                  <TrashIcon className="w-4 h-4" />
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    {t('campaign_config.campaigns.form.conditions.data_source')}
                  </label>
                  <select
                    value={condition.data_source}
                    onChange={(e) => updateCondition(index, 'data_source', e.target.value)}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="">
                      {t('campaign_config.campaigns.form.conditions.data_source_placeholder')}
                    </option>
                    {dataSources.map((source) => (
                      <option key={source.value} value={source.value}>
                        {source.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    {t('campaign_config.campaigns.form.conditions.field_name')}
                  </label>
                  <select
                    value={condition.field_name}
                    onChange={(e) => updateCondition(index, 'field_name', e.target.value)}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    disabled={!condition.data_source}
                  >
                    <option value="">
                      {condition.data_source 
                        ? t('campaign_config.campaigns.form.conditions.field_name_placeholder')
                        : t('campaign_config.campaigns.form.conditions.select_data_source_first')
                      }
                    </option>
                    {condition.data_source && (() => {
                      const selectedSource = dataSources.find(ds => ds.value === condition.data_source);
                      return selectedSource?.fields?.map((field: string | CustomFieldInfo) => {
                        // Handle both string fields (for regular sources) and object fields (for custom fields)
                        if (typeof field === 'string') {
                          return (
                            <option key={field} value={field}>
                              {field}
                            </option>
                          );
                        } else {
                          // Custom field object with name, column, data_type, description
                          return (
                            <option key={field.name} value={field.name}>
                              {field.name} ({field.data_type})
                            </option>
                          );
                        }
                      }) || [];
                    })()}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    {t('campaign_config.campaigns.form.conditions.operator')}
                  </label>
                  <select
                    value={condition.operator}
                    onChange={(e) => updateCondition(index, 'operator', e.target.value)}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="">
                      {t('campaign_config.campaigns.form.conditions.operator_placeholder')}
                    </option>
                    {operators.map((operator) => (
                      <option key={operator.value} value={operator.value}>
                        {operator.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    {t('campaign_config.campaigns.form.conditions.field_value')}
                  </label>
                  <input
                    type="text"
                    value={condition.field_value}
                    onChange={(e) => updateCondition(index, 'field_value', e.target.value)}
                    placeholder={t('campaign_config.campaigns.form.conditions.field_value_placeholder')}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
              </div>
            </div>
          ))}

          <div className="flex justify-center">
            <Button onClick={addCondition} variant="secondary" size="sm">
              <PlusIcon className="w-4 h-4 mr-2" />
              {t('campaign_config.campaigns.form.conditions.add_condition')}
            </Button>
          </div>
        </div>
      )}

      {conditions.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
          <p className="text-sm text-blue-700">
            {t('campaign_config.campaigns.form.conditions.condition_help')}
          </p>
        </div>
      )}
    </div>
  );
};

export default BaseConditionsForm;