import React, { useState, useEffect } from 'react';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { useTranslation } from '../../../i18n/hooks/useTranslation';
import { ReferenceCustomer, ReferenceCustomerFormData } from '../types';
import { bankApi, RelationshipType } from '../../../services/api/bank.api';

interface ReferenceCustomerEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: ReferenceCustomerFormData) => Promise<void>;
  referenceData?: ReferenceCustomer;
  isEditing: boolean;
  primaryCif: string;
}

const ReferenceCustomerEditModal: React.FC<ReferenceCustomerEditModalProps> = ({
  isOpen,
  onClose,
  onSave,
  referenceData,
  isEditing,
  primaryCif
}) => {
  const { t } = useTranslation(['customers', 'forms', 'common']);
  const [formData, setFormData] = useState<ReferenceCustomerFormData>({
    refCif: '',
    primaryCif: primaryCif,
    relationshipType: '',
    type: 'INDIVIDUAL',
    name: '',
    dateOfBirth: '',
    nationalId: '',
    gender: '',
    companyName: '',
    registrationNumber: '',
    taxId: ''
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [relationshipTypes, setRelationshipTypes] = useState<RelationshipType[]>([]);
  const [relationshipTypesLoading, setRelationshipTypesLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      if (isEditing && referenceData) {
        // Pre-populate form with existing data
        setFormData({
          refCif: referenceData.refCif || '',
          primaryCif: primaryCif,
          relationshipType: referenceData.relationshipType || '',
          type: referenceData.type === 'ORGANIZATION' ? 'ORGANIZATION' : 'INDIVIDUAL',
          name: referenceData.name || '',
          dateOfBirth: referenceData.dateOfBirth || '',
          nationalId: referenceData.nationalId || '',
          gender: referenceData.gender || '',
          companyName: referenceData.companyName || '',
          registrationNumber: referenceData.registrationNumber || '',
          taxId: referenceData.taxId || ''
        });
      } else {
        // Reset form for new reference customer (refCif auto-generated)
        setFormData({
          refCif: '',
          primaryCif: primaryCif,
          relationshipType: '',
          type: 'INDIVIDUAL',
          name: '',
          dateOfBirth: '',
          nationalId: '',
          gender: '',
          companyName: '',
          registrationNumber: '',
          taxId: ''
        });
      }
      setErrors({});
    }
  }, [isOpen, isEditing, referenceData, primaryCif]);

  // Fetch relationship types on component mount
  useEffect(() => {
    const fetchRelationshipTypes = async () => {
      try {
        setRelationshipTypesLoading(true);
        const types = await bankApi.getRelationshipTypes();
        setRelationshipTypes(types);
      } catch (error) {
        console.error('Error fetching relationship types:', error);
        // Set fallback types if API fails
        setRelationshipTypes([
          { value: 'spouse', label: 'Spouse' },
          { value: 'parent', label: 'Parent' },
          { value: 'child', label: 'Child' },
          { value: 'sibling', label: 'Sibling' },
          { value: 'other', label: 'Other' }
        ]);
      } finally {
        setRelationshipTypesLoading(false);
      }
    };

    fetchRelationshipTypes();
  }, []);

  const handleInputChange = (field: keyof ReferenceCustomerFormData, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value
    }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.relationshipType) {
      newErrors.relationshipType = t('forms:validation.required');
    }

    // Type-specific validation
    if (formData.type === 'INDIVIDUAL') {
      if (!formData.name) {
        newErrors.name = t('forms:validation.required');
      }
    } else if (formData.type === 'ORGANIZATION') {
      if (!formData.companyName) {
        newErrors.companyName = t('forms:validation.required');
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      await onSave(formData);
      onClose();
    } catch (error: any) {
      console.error('Error saving reference customer:', error);
      // Show user-friendly error message
      alert(error.message || t('customers:messages.save_failed'));
    } finally {
      setLoading(false);
    }
  };

  const getModalTitle = () => {
    const action = isEditing ? t('common:buttons.edit') : t('common:buttons.add');
    return `${action} ${t('customers:titles.references')}`;
  };

  const relationshipOptions = relationshipTypes.map(type => ({
    value: type.value,
    label: type.label
  }));

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={getModalTitle()} size="lg">
      <form onSubmit={handleSubmit}>

        {/* Relationship Type */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            {t('customers:fields.relationship_type')} *
          </label>
          <Select
            value={formData.relationshipType}
            onChange={(e) => handleInputChange('relationshipType', e.target.value)}
            options={[
              { value: '', label: t('forms:buttons.select') },
              ...relationshipOptions
            ]}
            error={errors.relationshipType}
            disabled={relationshipTypesLoading}
          />
        </div>

        {/* Customer Type Toggle */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            {t('customers:fields.customer_type')} *
          </label>
          <div className="flex gap-4">
            <label className="flex items-center">
              <input
                type="radio"
                name="customerType"
                value="INDIVIDUAL"
                checked={formData.type === 'INDIVIDUAL'}
                onChange={(e) => handleInputChange('type', e.target.value)}
                className="mr-2"
              />
              {'INDIVIDUAL'}
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="customerType"
                value="ORGANIZATION"
                checked={formData.type === 'ORGANIZATION'}
                onChange={(e) => handleInputChange('type', e.target.value)}
                className="mr-2"
              />
              ORGANIZATION
            </label>
          </div>
        </div>

        {/* Individual Fields */}
        {formData.type === 'INDIVIDUAL' && (
          <>
            <div className="mb-4">
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                {t('customers:fields.name')} *
              </label>
              <Input
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                error={errors.name}
                placeholder={t('customers:placeholders.full_name')}
              />
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  {t('customers:fields.date_of_birth')}
                </label>
                <Input
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                  max={new Date().toISOString().split('T')[0]}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  {t('forms:labels.national_id')}
                </label>
                <Input
                  value={formData.nationalId}
                  onChange={(e) => handleInputChange('nationalId', e.target.value)}
                  placeholder={t('customers:placeholders.national_id')}
                />
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                {t('customers:fields.gender')}
              </label>
              <Select
                value={formData.gender}
                onChange={(e) => handleInputChange('gender', e.target.value)}
                options={[
                  { value: '', label: t('forms:buttons.select') },
                  { value: 'MALE', label: 'MALE' },
                  { value: 'FEMALE', label: 'FEMALE' },
                  { value: 'OTHER', label: 'OTHER' }
                ]}
              />
            </div>
          </>
        )}

        {/* Organization Fields */}
        {formData.type === 'ORGANIZATION' && (
          <>
            <div className="mb-4">
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                {t('customers:fields.company_name')} *
              </label>
              <Input
                value={formData.companyName}
                onChange={(e) => handleInputChange('companyName', e.target.value)}
                error={errors.companyName}
                placeholder={t('customers:placeholders.company_name')}
              />
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  {t('customers:fields.registration_number')}
                </label>
                <Input
                  value={formData.registrationNumber}
                  onChange={(e) => handleInputChange('registrationNumber', e.target.value)}
                  placeholder={t('customers:placeholders.registration_number')}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  {t('forms:labels.tax_id')}
                </label>
                <Input
                  value={formData.taxId}
                  onChange={(e) => handleInputChange('taxId', e.target.value)}
                  placeholder={t('customers:placeholders.tax_id')}
                />
              </div>
            </div>
          </>
        )}
        
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={loading}
          >
            {t('common:buttons.cancel')}
          </Button>
          <Button
            type="submit"
            variant="primary"
            loading={loading}
          >
            {isEditing ? t('common:buttons.update') : t('common:buttons.create')}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default ReferenceCustomerEditModal;