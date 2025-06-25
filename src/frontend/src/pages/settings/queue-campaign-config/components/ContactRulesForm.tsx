import React from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '../../../../components/ui/Button';
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import type { 
  CreateContactSelectionRuleRequest,
  CreateContactRuleConditionRequest,
  CreateContactRuleOutputRequest,
  DataSource,
  Operator,
  ContactType,
  RelatedPartyType
} from '../../../../services/api/campaign';

interface ContactRulesFormProps {
  rules: CreateContactSelectionRuleRequest[];
  onChange: (rules: CreateContactSelectionRuleRequest[]) => void;
  dataSources: DataSource[];
  operators: Operator[];
  contactTypes: ContactType[];
  relatedPartyTypes: RelatedPartyType[];
}

const ContactRulesForm: React.FC<ContactRulesFormProps> = ({
  rules,
  onChange,
  dataSources,
  operators,
  contactTypes,
  relatedPartyTypes
}) => {
  const { t } = useTranslation('settings');

  const addRule = () => {
    const newRule: CreateContactSelectionRuleRequest = {
      rule_priority: rules.length + 1,
      conditions: [],
      outputs: []
    };
    onChange([...rules, newRule]);
  };

  const removeRule = (index: number) => {
    const newRules = rules.filter((_, i) => i !== index);
    // Adjust priorities
    const adjustedRules = newRules.map((rule, i) => ({
      ...rule,
      rule_priority: i + 1
    }));
    onChange(adjustedRules);
  };

  const updateRule = (index: number, field: keyof CreateContactSelectionRuleRequest, value: any) => {
    const newRules = rules.map((rule, i) => 
      i === index ? { ...rule, [field]: value } : rule
    );
    onChange(newRules);
  };

  const addCondition = (ruleIndex: number) => {
    const newCondition: CreateContactRuleConditionRequest = {
      field_name: '',
      operator: '',
      field_value: '',
      data_source: ''
    };
    const newRules = rules.map((rule, i) => 
      i === ruleIndex 
        ? { ...rule, conditions: [...rule.conditions, newCondition] }
        : rule
    );
    onChange(newRules);
  };

  const removeCondition = (ruleIndex: number, conditionIndex: number) => {
    const newRules = rules.map((rule, i) => 
      i === ruleIndex 
        ? { ...rule, conditions: rule.conditions.filter((_, ci) => ci !== conditionIndex) }
        : rule
    );
    onChange(newRules);
  };

  const updateCondition = (ruleIndex: number, conditionIndex: number, field: keyof CreateContactRuleConditionRequest, value: string) => {
    const newRules = rules.map((rule, i) => 
      i === ruleIndex 
        ? {
            ...rule, 
            conditions: rule.conditions.map((condition, ci) => {
              if (ci === conditionIndex) {
                const updated = { ...condition, [field]: value };
                // Clear field_name when data_source changes since available fields change
                if (field === 'data_source' && value !== condition.data_source) {
                  updated.field_name = '';
                }
                return updated;
              }
              return condition;
            })
          }
        : rule
    );
    onChange(newRules);
  };

  const addOutput = (ruleIndex: number) => {
    const newOutput: CreateContactRuleOutputRequest = {
      related_party_type: '',
      contact_type: '',
      relationship_patterns: []
    };
    const newRules = rules.map((rule, i) => 
      i === ruleIndex 
        ? { ...rule, outputs: [...rule.outputs, newOutput] }
        : rule
    );
    onChange(newRules);
  };

  const removeOutput = (ruleIndex: number, outputIndex: number) => {
    const newRules = rules.map((rule, i) => 
      i === ruleIndex 
        ? { ...rule, outputs: rule.outputs.filter((_, oi) => oi !== outputIndex) }
        : rule
    );
    onChange(newRules);
  };

  const updateOutput = (ruleIndex: number, outputIndex: number, field: keyof CreateContactRuleOutputRequest, value: string | string[]) => {
    const newRules = rules.map((rule, i) => 
      i === ruleIndex 
        ? {
            ...rule, 
            outputs: rule.outputs.map((output, oi) => 
              oi === outputIndex ? { ...output, [field]: value } : output
            )
          }
        : rule
    );
    onChange(newRules);
  };

  const updateRelationshipPatterns = (ruleIndex: number, outputIndex: number, patterns: string) => {
    // Convert comma-separated string to array, filtering out empty values
    const patternsArray = patterns
      .split(',')
      .map(p => p.trim())
      .filter(p => p.length > 0);
    
    updateOutput(ruleIndex, outputIndex, 'relationship_patterns', patternsArray);
  };

  return (
    <div className="space-y-6">
      <div>
        <h4 className="text-lg font-medium text-neutral-900 mb-2">
          {t('campaign_config.campaigns.form.contact_rules.title')}
        </h4>
        <p className="text-sm text-neutral-600 mb-4">
          {t('campaign_config.campaigns.form.contact_rules.description')}
        </p>
      </div>

      {rules.length === 0 ? (
        <div className="text-center py-8 border-2 border-dashed border-neutral-300 rounded-lg">
          <p className="text-sm text-neutral-500 mb-4">
            {t('campaign_config.campaigns.form.contact_rules.no_rules')}
          </p>
          <Button onClick={addRule} size="sm">
            <PlusIcon className="w-4 h-4 mr-2" />
            {t('campaign_config.campaigns.form.contact_rules.add_rule')}
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          {rules.map((rule, ruleIndex) => (
            <div key={ruleIndex} className="p-6 border border-neutral-200 rounded-lg space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h5 className="text-sm font-medium text-neutral-900">
                    {t('campaign_config.campaigns.form.contact_rules.exclusion_rule_title', { priority: rule.rule_priority })}
                  </h5>
                  <p className="text-xs text-neutral-500 mt-1">
                    {t('campaign_config.campaigns.form.contact_rules.exclusion_rule_description')}
                  </p>
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => removeRule(ruleIndex)}
                >
                  <TrashIcon className="w-4 h-4" />
                </Button>
              </div>

              {/* Rule Priority */}
              <div className="w-32">
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  {t('campaign_config.campaigns.form.contact_rules.rule_priority')}
                </label>
                <input
                  type="number"
                  min="1"
                  value={rule.rule_priority}
                  onChange={(e) => updateRule(ruleIndex, 'rule_priority', parseInt(e.target.value) || 1)}
                  placeholder={t('campaign_config.campaigns.form.contact_rules.rule_priority_placeholder')}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>

              {/* Rule Conditions */}
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h6 className="text-sm font-medium text-neutral-700">
                    {t('campaign_config.campaigns.form.contact_rules.rule_conditions')}
                  </h6>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => addCondition(ruleIndex)}
                  >
                    <PlusIcon className="w-4 h-4 mr-1" />
                    {t('campaign_config.campaigns.form.contact_rules.add_condition')}
                  </Button>
                </div>

                {rule.conditions.length === 0 ? (
                  <p className="text-sm text-neutral-500 text-center py-4 border border-dashed border-neutral-300 rounded">
                    {t('campaign_config.campaigns.form.contact_rules.no_conditions_rule')}
                  </p>
                ) : (
                  <div className="space-y-3">
                    {rule.conditions.map((condition, conditionIndex) => (
                      <div key={conditionIndex} className="p-3 bg-neutral-50 rounded border">
                        <div className="flex justify-between items-center mb-3">
                          <span className="text-xs font-medium text-neutral-600">
                            Condition {conditionIndex + 1}
                          </span>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => removeCondition(ruleIndex, conditionIndex)}
                          >
                            <TrashIcon className="w-3 h-3" />
                          </Button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <select
                              value={condition.data_source}
                              onChange={(e) => updateCondition(ruleIndex, conditionIndex, 'data_source', e.target.value)}
                              className="w-full px-2 py-1 text-sm border border-neutral-300 rounded focus:outline-none focus:ring-1 focus:ring-primary-500"
                            >
                              <option value="">Select data source...</option>
                              {dataSources.map((source) => (
                                <option key={source.value} value={source.value}>
                                  {source.label}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <select
                              value={condition.field_name}
                              onChange={(e) => updateCondition(ruleIndex, conditionIndex, 'field_name', e.target.value)}
                              className="w-full px-2 py-1 text-sm border border-neutral-300 rounded focus:outline-none focus:ring-1 focus:ring-primary-500"
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
                                return selectedSource?.fields?.map((field: string) => (
                                  <option key={field} value={field}>
                                    {field}
                                  </option>
                                )) || [];
                              })()}
                            </select>
                          </div>

                          <div>
                            <select
                              value={condition.operator}
                              onChange={(e) => updateCondition(ruleIndex, conditionIndex, 'operator', e.target.value)}
                              className="w-full px-2 py-1 text-sm border border-neutral-300 rounded focus:outline-none focus:ring-1 focus:ring-primary-500"
                            >
                              <option value="">Select operator...</option>
                              {operators.map((operator) => (
                                <option key={operator.value} value={operator.value}>
                                  {operator.label}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <input
                              type="text"
                              value={condition.field_value}
                              onChange={(e) => updateCondition(ruleIndex, conditionIndex, 'field_value', e.target.value)}
                              placeholder="Value..."
                              className="w-full px-2 py-1 text-sm border border-neutral-300 rounded focus:outline-none focus:ring-1 focus:ring-primary-500"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Rule Outputs */}
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h6 className="text-sm font-medium text-neutral-700">
                    {t('campaign_config.campaigns.form.contact_rules.rule_outputs')}
                  </h6>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => addOutput(ruleIndex)}
                  >
                    <PlusIcon className="w-4 h-4 mr-1" />
                    {t('campaign_config.campaigns.form.contact_rules.add_output')}
                  </Button>
                </div>

                {rule.outputs.length === 0 ? (
                  <p className="text-sm text-neutral-500 text-center py-4 border border-dashed border-neutral-300 rounded">
                    {t('campaign_config.campaigns.form.contact_rules.no_outputs_rule')}
                  </p>
                ) : (
                  <div className="space-y-3">
                    {rule.outputs.map((output, outputIndex) => (
                      <div key={outputIndex} className="p-3 bg-neutral-50 rounded border">
                        <div className="flex justify-between items-center mb-3">
                          <span className="text-xs font-medium text-neutral-600">
                            Output {outputIndex + 1}
                          </span>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => removeOutput(ruleIndex, outputIndex)}
                          >
                            <TrashIcon className="w-3 h-3" />
                          </Button>
                        </div>

                        <div className="space-y-3">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div>
                              <label className="block text-xs font-medium text-neutral-600 mb-1">
                                {t('campaign_config.campaigns.form.contact_rules.related_party_type')}
                              </label>
                              <select
                                value={output.related_party_type}
                                onChange={(e) => updateOutput(ruleIndex, outputIndex, 'related_party_type', e.target.value)}
                                className="w-full px-2 py-1 text-sm border border-neutral-300 rounded focus:outline-none focus:ring-1 focus:ring-primary-500"
                              >
                                <option value="">
                                  {t('campaign_config.campaigns.form.contact_rules.related_party_placeholder')}
                                </option>
                                {relatedPartyTypes.map((type) => (
                                  <option key={type.value} value={type.value}>
                                    {type.label}
                                  </option>
                                ))}
                              </select>
                            </div>

                            <div>
                              <label className="block text-xs font-medium text-neutral-600 mb-1">
                                {t('campaign_config.campaigns.form.contact_rules.contact_type')}
                              </label>
                              <select
                                value={output.contact_type}
                                onChange={(e) => updateOutput(ruleIndex, outputIndex, 'contact_type', e.target.value)}
                                className="w-full px-2 py-1 text-sm border border-neutral-300 rounded focus:outline-none focus:ring-1 focus:ring-primary-500"
                              >
                                <option value="">
                                  {t('campaign_config.campaigns.form.contact_rules.contact_type_placeholder')}
                                </option>
                                {contactTypes.map((type) => (
                                  <option key={type.value} value={type.value}>
                                    {type.label}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>

                          {/* Relationship Patterns - Only show when related_party_type is 'reference' */}
                          {output.related_party_type === 'reference' && (
                            <div>
                              <label className="block text-xs font-medium text-neutral-600 mb-1">
                                {t('campaign_config.campaigns.form.contact_rules.relationship_patterns')}
                              </label>
                              <input
                                type="text"
                                value={output.relationship_patterns?.join(', ') || ''}
                                onChange={(e) => updateRelationshipPatterns(ruleIndex, outputIndex, e.target.value)}
                                placeholder={t('campaign_config.campaigns.form.contact_rules.relationship_patterns_placeholder')}
                                className="w-full px-2 py-1 text-sm border border-neutral-300 rounded focus:outline-none focus:ring-1 focus:ring-primary-500"
                              />
                              <p className="text-xs text-neutral-500 mt-1">
                                {t('campaign_config.campaigns.form.contact_rules.relationship_patterns_help')}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}

          <div className="flex justify-center">
            <Button onClick={addRule} variant="secondary" size="sm">
              <PlusIcon className="w-4 h-4 mr-2" />
              {t('campaign_config.campaigns.form.contact_rules.add_rule')}
            </Button>
          </div>
        </div>
      )}

      {rules.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
          <p className="text-sm text-blue-700">
            {t('campaign_config.campaigns.form.contact_rules.rule_help')}
          </p>
        </div>
      )}
    </div>
  );
};

export default ContactRulesForm;