import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation, useQueryClient, useQuery } from 'react-query';
import { Modal } from '../../../../components/ui/Modal';
import { Button } from '../../../../components/ui/Button';
import { Spinner } from '../../../../components/ui/Spinner';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { useToast } from '../../../../components/ui/ToastProvider';
import { campaignsApi, configApi } from '../../../../services/api/campaign';
import type { 
  Campaign, 
  CampaignGroup, 
  CreateCampaignRequest,
  CreateBaseConditionRequest,
  CreateContactSelectionRuleRequest
} from '../../../../services/api/campaign';
import BaseConditionsForm from './BaseConditionsForm';
import ContactRulesForm from './ContactRulesForm';
import CampaignReviewSection from './CampaignReviewSection';

interface CampaignDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  campaign?: Campaign;
  campaignGroups: CampaignGroup[];
}

type Step = 'basic' | 'conditions' | 'contact_rules' | 'review';

interface FormData {
  name: string;
  campaign_group_id: string;
  priority: number;
  base_conditions: CreateBaseConditionRequest[];
  contact_selection_rules: CreateContactSelectionRuleRequest[];
}

const CampaignDetailsModal: React.FC<CampaignDetailsModalProps> = ({
  isOpen,
  onClose,
  campaign,
  campaignGroups
}) => {
  const { t } = useTranslation('settings');
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [currentStep, setCurrentStep] = useState<Step>('basic');
  const [formData, setFormData] = useState<FormData>({
    name: '',
    campaign_group_id: '',
    priority: 1,
    base_conditions: [],
    contact_selection_rules: []
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isEditing = Boolean(campaign);

  // Fetch configuration data
  const { data: dataSources } = useQuery(
    ['campaign-data-sources'],
    () => configApi.getDataSources(),
    { enabled: isOpen }
  );

  const { data: operators } = useQuery(
    ['campaign-operators'],
    () => configApi.getOperators(),
    { enabled: isOpen }
  );

  const { data: contactTypes } = useQuery(
    ['campaign-contact-types'],
    () => configApi.getContactTypes(),
    { enabled: isOpen }
  );

  const { data: relatedPartyTypes } = useQuery(
    ['campaign-related-party-types'],
    () => configApi.getRelatedPartyTypes(),
    { enabled: isOpen }
  );

  // Fetch campaign details for editing
  const { data: campaignConditions } = useQuery(
    ['campaign-conditions', campaign?.id],
    () => campaignsApi.getCampaignConditions(campaign!.id),
    { enabled: isOpen && isEditing && !!campaign?.id }
  );

  const { data: campaignContactRules } = useQuery(
    ['campaign-contact-rules', campaign?.id],
    () => campaignsApi.getCampaignContactRules(campaign!.id),
    { enabled: isOpen && isEditing && !!campaign?.id }
  );

  useEffect(() => {
    if (campaign) {
      setFormData({
        name: campaign.name,
        campaign_group_id: campaign.campaign_group_id,
        priority: campaign.priority,
        base_conditions: campaignConditions?.map(bc => ({
          field_name: bc.field_name,
          operator: bc.operator,
          field_value: bc.field_value,
          data_source: bc.data_source
        })) || [],
        contact_selection_rules: campaignContactRules?.map(rule => ({
          rule_priority: rule.rule_priority,
          conditions: rule.conditions?.map(cond => ({
            field_name: cond.field_name,
            operator: cond.operator,
            field_value: cond.field_value,
            data_source: cond.data_source
          })) || [],
          outputs: rule.outputs?.map(output => ({
            related_party_type: output.related_party_type,
            contact_type: output.contact_type,
            relationship_patterns: output.relationship_patterns || []
          })) || []
        })) || []
      });
    } else {
      setFormData({
        name: '',
        campaign_group_id: campaignGroups[0]?.id || '',
        priority: 1,
        base_conditions: [],
        contact_selection_rules: []
      });
    }
    setCurrentStep('basic');
    setErrors({});
  }, [campaign, campaignGroups, campaignConditions, campaignContactRules, isOpen]);

  const createMutation = useMutation({
    mutationFn: (data: CreateCampaignRequest) => campaignsApi.createCampaign(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['campaigns']);
      showToast(t('campaign_config.campaigns.messages.created'), 'success');
      onClose();
    },
    onError: (error: Error) => {
      showToast(error.message, 'error');
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: CreateCampaignRequest }) => 
      campaignsApi.updateCampaign(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['campaigns']);
      queryClient.invalidateQueries(['campaign-conditions', campaign?.id]);
      queryClient.invalidateQueries(['campaign-contact-rules', campaign?.id]);
      showToast(t('campaign_config.campaigns.messages.updated'), 'success');
      onClose();
    },
    onError: (error: Error) => {
      showToast(error.message, 'error');
    }
  });

  const validateBasic = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = t('campaign_config.campaigns.validation.name_required');
    }

    if (!formData.campaign_group_id) {
      newErrors.campaign_group_id = t('campaign_config.campaigns.validation.group_required');
    }

    if (!formData.priority || formData.priority < 1) {
      newErrors.priority = t('campaign_config.campaigns.validation.priority_positive');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateConditions = () => {
    // Validation is handled in BaseConditionsForm
    return true;
  };

  const validateContactRules = () => {
    // Validation is handled in ContactRulesForm
    return true;
  };

  const handleNext = () => {
    let isValid = false;

    switch (currentStep) {
      case 'basic':
        isValid = validateBasic();
        if (isValid) setCurrentStep('conditions');
        break;
      case 'conditions':
        isValid = validateConditions();
        if (isValid) setCurrentStep('contact_rules');
        break;
      case 'contact_rules':
        isValid = validateContactRules();
        if (isValid) setCurrentStep('review');
        break;
    }
  };

  const handlePrevious = () => {
    switch (currentStep) {
      case 'conditions':
        setCurrentStep('basic');
        break;
      case 'contact_rules':
        setCurrentStep('conditions');
        break;
      case 'review':
        setCurrentStep('contact_rules');
        break;
    }
  };

  const handleSubmit = () => {
    const submitData: CreateCampaignRequest = {
      name: formData.name.trim(),
      campaign_group_id: formData.campaign_group_id,
      priority: formData.priority,
      base_conditions: formData.base_conditions,
      contact_selection_rules: formData.contact_selection_rules
    };

    if (isEditing && campaign) {
      updateMutation.mutate({ id: campaign.id, data: submitData });
    } else {
      createMutation.mutate(submitData);
    }
  };

  const steps = [
    { id: 'basic', label: t('campaign_config.campaigns.modal.steps.basic') },
    { id: 'conditions', label: t('campaign_config.campaigns.modal.steps.conditions') },
    { id: 'contact_rules', label: t('campaign_config.campaigns.modal.steps.contact_rules') },
    { id: 'review', label: t('campaign_config.campaigns.modal.steps.review') }
  ];

  const currentStepIndex = steps.findIndex(step => step.id === currentStep);
  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === steps.length - 1;
  const isLoading = createMutation.isLoading || updateMutation.isLoading;

  const renderStepContent = () => {
    switch (currentStep) {
      case 'basic':
        return (
          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-neutral-700 mb-1">
                {t('campaign_config.campaigns.form.basic.name')}
              </label>
              <input
                type="text"
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder={t('campaign_config.campaigns.form.basic.name_placeholder')}
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                  errors.name ? 'border-red-300' : 'border-neutral-300'
                }`}
              />
              {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
              <p className="mt-1 text-sm text-neutral-500">
                {t('campaign_config.campaigns.form.basic.name_help')}
              </p>
            </div>

            <div>
              <label htmlFor="campaign_group_id" className="block text-sm font-medium text-neutral-700 mb-1">
                {t('campaign_config.campaigns.form.basic.group')}
              </label>
              <select
                id="campaign_group_id"
                value={formData.campaign_group_id}
                onChange={(e) => setFormData(prev => ({ ...prev, campaign_group_id: e.target.value }))}
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                  errors.campaign_group_id ? 'border-red-300' : 'border-neutral-300'
                }`}
              >
                <option value="">{t('campaign_config.campaigns.form.basic.group_placeholder')}</option>
                {campaignGroups.map((group) => (
                  <option key={group.id} value={group.id}>
                    {group.name}
                  </option>
                ))}
              </select>
              {errors.campaign_group_id && <p className="mt-1 text-sm text-red-600">{errors.campaign_group_id}</p>}
            </div>

            <div>
              <label htmlFor="priority" className="block text-sm font-medium text-neutral-700 mb-1">
                {t('campaign_config.campaigns.form.basic.priority')}
              </label>
              <input
                type="number"
                id="priority"
                min="1"
                max="1000"
                value={formData.priority}
                onChange={(e) => setFormData(prev => ({ ...prev, priority: parseInt(e.target.value) || 1 }))}
                placeholder={t('campaign_config.campaigns.form.basic.priority_placeholder')}
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                  errors.priority ? 'border-red-300' : 'border-neutral-300'
                }`}
              />
              {errors.priority && <p className="mt-1 text-sm text-red-600">{errors.priority}</p>}
              <p className="mt-1 text-sm text-neutral-500">
                {t('campaign_config.campaigns.form.basic.priority_help')}
              </p>
            </div>
          </div>
        );

      case 'conditions':
        return (
          <BaseConditionsForm
            conditions={formData.base_conditions}
            onChange={(conditions) => setFormData(prev => ({ ...prev, base_conditions: conditions }))}
            dataSources={dataSources || []}
            operators={operators || []}
          />
        );

      case 'contact_rules':
        return (
          <ContactRulesForm
            rules={formData.contact_selection_rules}
            onChange={(rules) => setFormData(prev => ({ ...prev, contact_selection_rules: rules }))}
            dataSources={dataSources || []}
            operators={operators || []}
            contactTypes={contactTypes || []}
            relatedPartyTypes={relatedPartyTypes || []}
          />
        );

      case 'review':
        return (
          <CampaignReviewSection
            formData={formData}
            campaignGroups={campaignGroups}
          />
        );

      default:
        return null;
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t(isEditing ? 'campaign_config.campaigns.modal.edit_title' : 'campaign_config.campaigns.modal.create_title')}
      size="lg"
    >
      <div className="space-y-6">
        {/* Step Indicator */}
        <div className="border-b border-neutral-200 pb-4">
          <nav aria-label="Progress" className="flex justify-center">
            <ol className="flex items-center space-x-4">
              {steps.map((step, index) => (
                <li key={step.id} className="flex items-center">
                  <div
                    className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${
                      index <= currentStepIndex
                        ? 'border-primary-600 bg-primary-600 text-white'
                        : 'border-neutral-300 bg-white text-neutral-500'
                    }`}
                  >
                    <span className="text-sm font-medium">{index + 1}</span>
                  </div>
                  <span
                    className={`ml-2 text-sm font-medium ${
                      index <= currentStepIndex ? 'text-primary-600' : 'text-neutral-500'
                    }`}
                  >
                    {step.label}
                  </span>
                  {index < steps.length - 1 && (
                    <div className="ml-4 w-5 h-0.5 bg-neutral-300" />
                  )}
                </li>
              ))}
            </ol>
          </nav>
        </div>

        {/* Step Content */}
        <div className="min-h-[400px]">
          {renderStepContent()}
        </div>

        {/* Navigation */}
        <div className="flex justify-between pt-4 border-t border-neutral-200">
          <Button
            type="button"
            variant="secondary"
            onClick={handlePrevious}
            disabled={isFirstStep || isLoading}
            className="flex items-center"
          >
            <ChevronLeftIcon className="w-4 h-4 mr-1" />
            {t('campaign_config.common.actions.previous')}
          </Button>

          <div className="flex space-x-3">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              disabled={isLoading}
            >
              {t('campaign_config.common.actions.cancel')}
            </Button>

            {isLastStep ? (
              <Button
                type="button"
                onClick={handleSubmit}
                disabled={isLoading}
                className="flex items-center"
              >
                {isLoading && <Spinner size="sm" className="mr-2" />}
                {t('campaign_config.common.actions.finish')}
              </Button>
            ) : (
              <Button
                type="button"
                onClick={handleNext}
                disabled={isLoading}
                className="flex items-center"
              >
                {t('campaign_config.common.actions.next')}
                <ChevronRightIcon className="w-4 h-4 ml-1" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default CampaignDetailsModal;