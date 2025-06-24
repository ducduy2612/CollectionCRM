import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { Button } from '../../../../components/ui/Button';
import { Modal } from '../../../../components/ui/Modal';
import { Spinner } from '../../../../components/ui/Spinner';
import { Alert } from '../../../../components/ui/Alert';
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { useToast } from '../../../../components/ui/ToastProvider';
import { customFieldsApi } from '../../../../services/api/campaign';
import type { CustomField, CreateCustomFieldRequest } from '../../../../services/api/campaign';

interface CustomFieldModalProps {
  isOpen: boolean;
  onClose: () => void;
  field?: CustomField;
}

const CustomFieldModal: React.FC<CustomFieldModalProps> = ({ isOpen, onClose, field }) => {
  const { t } = useTranslation('settings');
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [formData, setFormData] = useState({
    field_name: '',
    data_type: 'string' as const,
    description: ''
  });
  const [errors, setErrors] = useState<{ field_name?: string; data_type?: string }>({});

  const isEditing = Boolean(field);

  useEffect(() => {
    if (field) {
      setFormData({
        field_name: field.field_name,
        data_type: field.data_type,
        description: field.description || ''
      });
    } else {
      setFormData({
        field_name: '',
        data_type: 'string',
        description: ''
      });
    }
    setErrors({});
  }, [field, isOpen]);

  const createMutation = useMutation({
    mutationFn: (data: CreateCustomFieldRequest) => customFieldsApi.createCustomField(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['custom-fields']);
      queryClient.invalidateQueries(['campaign-data-sources']); // Refresh data sources so custom fields appear
      showToast(t('campaign_config.custom_fields.messages.created'), 'success');
      onClose();
    },
    onError: (error: Error) => {
      showToast(error.message, 'error');
    }
  });

  const validateForm = () => {
    const newErrors: { field_name?: string; data_type?: string } = {};
    
    if (!formData.field_name.trim()) {
      newErrors.field_name = t('campaign_config.custom_fields.validation.field_name_required');
    }
    
    if (!formData.data_type) {
      newErrors.data_type = t('campaign_config.custom_fields.validation.data_type_required');
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    const submitData: CreateCustomFieldRequest = {
      field_name: formData.field_name.trim(),
      data_type: formData.data_type,
      description: formData.description.trim() || undefined
    };

    createMutation.mutate(submitData);
  };

  const dataTypeOptions = [
    { value: 'string', label: t('campaign_config.custom_fields.data_types.string') },
    { value: 'number', label: t('campaign_config.custom_fields.data_types.number') },
    { value: 'date', label: t('campaign_config.custom_fields.data_types.date') },
    { value: 'boolean', label: t('campaign_config.custom_fields.data_types.boolean') }
  ];

  const isLoading = createMutation.isLoading;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t(isEditing ? 'campaign_config.custom_fields.modal.edit_title' : 'campaign_config.custom_fields.modal.create_title')}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="field_name" className="block text-sm font-medium text-neutral-700 mb-1">
            {t('campaign_config.custom_fields.form.field_name')}
          </label>
          <input
            type="text"
            id="field_name"
            value={formData.field_name}
            onChange={(e) => setFormData(prev => ({ ...prev, field_name: e.target.value }))}
            placeholder={t('campaign_config.custom_fields.form.field_name_placeholder')}
            disabled={isEditing}
            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
              errors.field_name ? 'border-red-300' : 'border-neutral-300'
            } ${isEditing ? 'bg-neutral-100' : ''}`}
          />
          {errors.field_name && <p className="mt-1 text-sm text-red-600">{errors.field_name}</p>}
          <p className="mt-1 text-sm text-neutral-500">
            {t('campaign_config.custom_fields.form.field_name_help')}
          </p>
        </div>

        <div>
          <label htmlFor="data_type" className="block text-sm font-medium text-neutral-700 mb-1">
            {t('campaign_config.custom_fields.form.data_type')}
          </label>
          <select
            id="data_type"
            value={formData.data_type}
            onChange={(e) => setFormData(prev => ({ ...prev, data_type: e.target.value as any }))}
            disabled={isEditing}
            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
              errors.data_type ? 'border-red-300' : 'border-neutral-300'
            } ${isEditing ? 'bg-neutral-100' : ''}`}
          >
            <option value="">
              {t('campaign_config.custom_fields.form.data_type_placeholder')}
            </option>
            {dataTypeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {errors.data_type && <p className="mt-1 text-sm text-red-600">{errors.data_type}</p>}
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-neutral-700 mb-1">
            {t('campaign_config.custom_fields.form.description')}
          </label>
          <textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            placeholder={t('campaign_config.custom_fields.form.description_placeholder')}
            rows={3}
            className="w-full px-3 py-2 border border-neutral-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
          <p className="mt-1 text-sm text-neutral-500">
            {t('campaign_config.custom_fields.form.description_help')}
          </p>
        </div>

        <div className="flex justify-end space-x-3 pt-4">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={isLoading}
          >
            {t('campaign_config.common.actions.cancel')}
          </Button>
          <Button
            type="submit"
            disabled={isLoading || isEditing}
          >
            {isLoading && <Spinner size="sm" className="mr-2" />}
            {t(isEditing ? 'campaign_config.common.actions.save' : 'campaign_config.common.actions.create')}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

const CustomFieldsSection: React.FC = () => {
  const { t } = useTranslation('settings');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedField, setSelectedField] = useState<CustomField | undefined>();

  const { data: fields, isLoading, error } = useQuery(
    ['custom-fields'],
    () => customFieldsApi.getCustomFields()
  );

  const handleEdit = (field: CustomField) => {
    setSelectedField(field);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedField(undefined);
  };

  if (error) {
    return <Alert variant="danger">{error instanceof Error ? error.message : 'An error occurred'}</Alert>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium text-neutral-900">
            {t('campaign_config.custom_fields.title')}
          </h3>
          <p className="mt-1 text-sm text-neutral-500">
            {t('campaign_config.custom_fields.description')}
          </p>
        </div>
        <Button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center"
        >
          <PlusIcon className="w-4 h-4 mr-2" />
          {t('campaign_config.custom_fields.add_field')}
        </Button>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex justify-center py-8">
          <Spinner size="lg" />
        </div>
      ) : !fields || fields.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-neutral-500 mb-4">
            {t('campaign_config.custom_fields.empty.no_fields')}
          </div>
          <p className="text-sm text-neutral-400">
            {t('campaign_config.custom_fields.empty.create_first')}
          </p>
        </div>
      ) : (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-neutral-200">
            {fields.map((field) => (
              <li key={field.id}>
                <div className="px-4 py-4 flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-neutral-900">
                          {field.field_name}
                        </p>
                        <div className="mt-1 flex items-center space-x-4 text-sm text-neutral-500">
                          <span>
                            {t('campaign_config.custom_fields.table.data_type')}: {t(`campaign_config.custom_fields.data_types.${field.data_type}`)}
                          </span>
                          <span>
                            {t('campaign_config.custom_fields.table.created_at')}: {new Date(field.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        {field.description && (
                          <p className="mt-1 text-sm text-neutral-400">
                            {field.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleEdit(field)}
                    >
                      <PencilIcon className="w-4 h-4 mr-1" />
                      {t('campaign_config.common.actions.edit')}
                    </Button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Modal */}
      <CustomFieldModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        field={selectedField}
      />
    </div>
  );
};

export default CustomFieldsSection;