import React from 'react';
import { useTranslation } from 'react-i18next';
import type { 
  CreateCampaignRequest,
  CreateBaseConditionRequest,
  CreateContactSelectionRuleRequest,
  CreateContactRuleOutputRequest,
  CampaignGroup
} from '../../../../services/api/campaign';

interface CampaignReviewSectionProps {
  formData: {
    name: string;
    campaign_group_id: string;
    priority: number;
    base_conditions: CreateBaseConditionRequest[];
    contact_selection_rules: CreateContactSelectionRuleRequest[];
  };
  campaignGroups: CampaignGroup[];
}

const CampaignReviewSection: React.FC<CampaignReviewSectionProps> = ({
  formData,
  campaignGroups
}) => {
  const { t } = useTranslation('settings');

  // Helper functions for converting technical config to human-readable text
  const getOperatorLabel = (operator: string): string => {
    const operatorMap: Record<string, string> = {
      '=': 'equals',
      '!=': 'does not equal',
      '>': 'is greater than',
      '>=': 'is greater than or equal to',
      '<': 'is less than',
      '<=': 'is less than or equal to',
      'LIKE': 'contains',
      'NOT_LIKE': 'does not contain',
      'IN': 'is one of',
      'NOT_IN': 'is not one of',
      'IS_NULL': 'is empty',
      'IS_NOT_NULL': 'is not empty'
    };
    return operatorMap[operator] || operator;
  };

  const getContactExclusionDescription = (output: CreateContactRuleOutputRequest): string => {
    const contactTypeMap: Record<string, string> = {
      'mobile': 'mobile phone',
      'home': 'home phone', 
      'work': 'work phone',
      'email': 'email',
      'all': 'all contact types'
    };

    const contactTypeLabel = (output.contact_type && contactTypeMap[output.contact_type]) || output.contact_type || 'all';

    if (output.related_party_type === 'customer') {
      return `Customer ${contactTypeLabel} contacts`;
    } else if (output.related_party_type === 'reference') {
      if (output.relationship_patterns && output.relationship_patterns.length > 0) {
        const patterns = output.relationship_patterns.join(', ');
        return `Reference ${contactTypeLabel} contacts (${patterns} relationships only)`;
      } else {
        return `All reference ${contactTypeLabel} contacts`;
      }
    } else {
      return `${output.related_party_type} ${contactTypeLabel} contacts`;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h4 className="text-lg font-medium text-neutral-900 mb-2">
          Review Campaign Configuration
        </h4>
        <p className="text-sm text-neutral-600">
          Please review your campaign configuration before saving.
        </p>
      </div>

      <div className="bg-neutral-50 rounded-lg p-4 space-y-6">
        {/* Basic Information */}
        <div>
          <h5 className="font-medium text-neutral-900 mb-3">Basic Information</h5>
          <dl className="grid grid-cols-1 gap-x-4 gap-y-2 sm:grid-cols-2">
            <div>
              <dt className="text-sm font-medium text-neutral-500">Campaign Name</dt>
              <dd className="text-sm text-neutral-900">{formData.name}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-neutral-500">Campaign Group</dt>
              <dd className="text-sm text-neutral-900">
                {campaignGroups.find(g => g.id === formData.campaign_group_id)?.name || 'Unknown'}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-neutral-500">Priority</dt>
              <dd className="text-sm text-neutral-900">
                {formData.priority} {formData.priority === 1 ? '(Highest)' : ''}
              </dd>
            </div>
          </dl>
        </div>

        {/* Customer Targeting Conditions */}
        <div>
          <h5 className="font-medium text-neutral-900 mb-3">Customer Targeting</h5>
          {formData.base_conditions.length === 0 ? (
            <p className="text-sm text-neutral-600 italic">
              All customers will be eligible for this campaign
            </p>
          ) : (
            <div className="space-y-2">
              <p className="text-sm text-neutral-600">
                Customers must meet ALL of the following conditions:
              </p>
              <ul className="space-y-1">
                {formData.base_conditions.map((condition, index) => (
                  <li key={index} className="text-sm text-neutral-700">
                    • <span className="font-medium">{condition.field_name}</span>{' '}
                    {getOperatorLabel(condition.operator)}{' '}
                    <span className="font-medium">{condition.field_value}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Contact Exclusion Rules */}
        <div>
          <h5 className="font-medium text-neutral-900 mb-3">Contact Selection Strategy</h5>
          {formData.contact_selection_rules.length === 0 ? (
            <p className="text-sm text-neutral-600 italic">
              All available customer and reference contacts will be included
            </p>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-neutral-600">
                Start with all contacts, then exclude contacts based on these rules:
              </p>
              {formData.contact_selection_rules.map((rule, ruleIndex) => (
                <div key={ruleIndex} className="bg-white rounded border p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="bg-neutral-100 text-neutral-700 px-2 py-1 rounded text-xs font-medium">
                      Rule {rule.rule_priority}
                    </span>
                  </div>
                  
                  {/* Rule Conditions */}
                  {rule.conditions.length > 0 && (
                    <div className="mb-2">
                      <p className="text-xs text-neutral-500 mb-1">When customer meets:</p>
                      <ul className="text-xs text-neutral-600 space-y-1">
                        {rule.conditions.map((condition, condIndex) => (
                          <li key={condIndex}>
                            → <span className="font-medium">{condition.field_name}</span>{' '}
                            {getOperatorLabel(condition.operator)}{' '}
                            <span className="font-medium">{condition.field_value}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Rule Outputs */}
                  <div>
                    <p className="text-xs text-neutral-500 mb-1">Then exclude these contacts:</p>
                    <ul className="text-xs text-neutral-600 space-y-1">
                      {rule.outputs.map((output, outputIndex) => (
                        <li key={outputIndex}>
                          → <span className="font-medium">{getContactExclusionDescription(output)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CampaignReviewSection;