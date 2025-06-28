import React, { useState, useEffect } from 'react';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { Spinner } from '../../../components/ui/Spinner';
import { useTranslation } from '../../../i18n/hooks/useTranslation';
import { WorkflowPhone, WorkflowEmail, WorkflowAddress, PhoneFormData, EmailFormData, AddressFormData } from '../types';
import { bankApi, PhoneType } from '../../../services/api/bank.api';

interface ContactEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
  contactType: 'phone' | 'email' | 'address';
  contactData?: WorkflowPhone | WorkflowEmail | WorkflowAddress;
  isEditing: boolean;
}

const ContactEditModal: React.FC<ContactEditModalProps> = ({
  isOpen,
  onClose,
  onSave,
  contactType,
  contactData,
  isEditing
}) => {
  const { t } = useTranslation(['customers', 'forms', 'common']);
  const [formData, setFormData] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [phoneTypes, setPhoneTypes] = useState<PhoneType[]>([]);
  const [phoneTypesLoading, setPhoneTypesLoading] = useState(false);

  // Fetch phone types when modal opens for phone editing
  useEffect(() => {
    if (isOpen && contactType === 'phone') {
      const fetchPhoneTypes = async () => {
        setPhoneTypesLoading(true);
        try {
          const types = await bankApi.getPhoneTypes();
          setPhoneTypes(types);
        } catch (error) {
          console.error('Error fetching phone types:', error);
          // Fallback to basic phone types if API fails
          setPhoneTypes([
            { value: 'mobile1', label: 'Mobile Phone 1' },
            { value: 'home1', label: 'Home Phone 1' },
            { value: 'work1', label: 'Work Phone 1' },
            { value: 'other1', label: 'Other Phone 1' }
          ]);
        } finally {
          setPhoneTypesLoading(false);
        }
      };

      fetchPhoneTypes();
    }
  }, [isOpen, contactType]);

  useEffect(() => {
    if (isOpen) {
      if (isEditing && contactData) {
        // Pre-populate form with existing data
        if (contactType === 'phone') {
          const phone = contactData as WorkflowPhone;
          setFormData({
            type: phone.type,
            number: phone.number,
            isPrimary: phone.isPrimary,
            isVerified: phone.isVerified
          });
        } else if (contactType === 'email') {
          const email = contactData as WorkflowEmail;
          setFormData({
            address: email.address,
            isPrimary: email.isPrimary,
            isVerified: email.isVerified
          });
        } else if (contactType === 'address') {
          const address = contactData as WorkflowAddress;
          setFormData({
            type: address.type,
            addressLine1: address.addressLine1,
            addressLine2: address.addressLine2 || '',
            city: address.city,
            state: address.state || '',
            district: address.district || '',
            country: address.country,
            isPrimary: address.isPrimary,
            isVerified: address.isVerified
          });
        }
      } else {
        // Reset form for new contact
        if (contactType === 'phone') {
          setFormData({
            type: phoneTypes.length > 0 ? phoneTypes[0].value : 'mobile1',
            number: '',
            isPrimary: false,
            isVerified: false
          });
        } else if (contactType === 'email') {
          setFormData({
            address: '',
            isPrimary: false,
            isVerified: false
          });
        } else if (contactType === 'address') {
          setFormData({
            type: 'HOME',
            addressLine1: '',
            addressLine2: '',
            city: '',
            state: '',
            district: '',
            country: 'Vietnam',
            isPrimary: false,
            isVerified: false
          });
        }
      }
      setErrors({});
    }
  }, [isOpen, isEditing, contactData, contactType, phoneTypes]);

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev: any) => ({
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

    if (contactType === 'phone') {
      if (!formData.type) newErrors.type = t('forms:validation.required');
      if (!formData.number) newErrors.number = t('forms:validation.required');
      else if (!/^[\d\s\-\+\(\)]+$/.test(formData.number)) {
        newErrors.number = t('forms:validation.invalid_phone');
      }
    } else if (contactType === 'email') {
      if (!formData.address) newErrors.address = t('forms:validation.required');
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.address)) {
        newErrors.address = t('forms:validation.invalid_email');
      }
    } else if (contactType === 'address') {
      if (!formData.type) newErrors.type = t('forms:validation.required');
      if (!formData.addressLine1) newErrors.addressLine1 = t('forms:validation.required');
      if (!formData.city) newErrors.city = t('forms:validation.required');
      if (!formData.state) newErrors.state = t('forms:validation.required');
      if (!formData.district) newErrors.district = t('forms:validation.required');
      if (!formData.country) newErrors.country = t('forms:validation.required');
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
      console.error('Error saving contact:', error);
      // Show user-friendly error message
      alert(error.message || t('customers:messages.save_failed'));
    } finally {
      setLoading(false);
    }
  };

  const getModalTitle = () => {
    const action = isEditing ? t('common:buttons.edit') : t('common:buttons.add');
    if (contactType === 'phone') return `${action} ${t('customers:fields.phone')}`;
    if (contactType === 'email') return `${action} ${t('customers:fields.email')}`;
    if (contactType === 'address') return `${action} ${t('customers:fields.address')}`;
    return action;
  };

  const renderPhoneForm = () => (
    <>
      <div className="mb-4">
        <label className="block text-sm font-medium text-neutral-700 mb-2">
          {t('customers:fields.phone_type')} *
        </label>
        {phoneTypesLoading ? (
          <div className="flex items-center justify-center py-2">
            <Spinner size="sm" />
            <span className="ml-2 text-sm text-neutral-600">Loading phone types...</span>
          </div>
        ) : (
          <Select
            value={formData.type || ''}
            onChange={(e) => handleInputChange('type', e.target.value)}
            options={phoneTypes.map(type => ({
              value: type.value,
              label: type.label
            }))}
            error={errors.type}
            disabled={phoneTypesLoading || phoneTypes.length === 0}
          />
        )}
        {phoneTypes.length === 0 && !phoneTypesLoading && (
          <p className="text-xs text-red-600 mt-1">Failed to load phone types. Please try again.</p>
        )}
      </div>
      <div className="mb-4">
        <label className="block text-sm font-medium text-neutral-700 mb-2">
          {t('customers:fields.phone_number')} *
        </label>
        <Input
          type="tel"
          value={formData.number || ''}
          onChange={(e) => handleInputChange('number', e.target.value)}
          error={errors.number}
          placeholder={t('customers:placeholders.phone_number')}
        />
      </div>
      <div className="flex gap-4 mb-4">
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={formData.isPrimary || false}
            onChange={(e) => handleInputChange('isPrimary', e.target.checked)}
            className="mr-2"
          />
          {t('forms:options.primary')}
        </label>
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={formData.isVerified || false}
            onChange={(e) => handleInputChange('isVerified', e.target.checked)}
            className="mr-2"
          />
          {t('forms:options.verified')}
        </label>
      </div>
    </>
  );

  const renderEmailForm = () => (
    <>
      <div className="mb-4">
        <label className="block text-sm font-medium text-neutral-700 mb-2">
          {t('customers:fields.email_address')} *
        </label>
        <Input
          type="email"
          value={formData.address || ''}
          onChange={(e) => handleInputChange('address', e.target.value)}
          error={errors.address}
          placeholder={t('customers:placeholders.email_address')}
        />
      </div>
      <div className="flex gap-4 mb-4">
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={formData.isPrimary || false}
            onChange={(e) => handleInputChange('isPrimary', e.target.checked)}
            className="mr-2"
          />
          {t('forms:options.primary')}
        </label>
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={formData.isVerified || false}
            onChange={(e) => handleInputChange('isVerified', e.target.checked)}
            className="mr-2"
          />
          {t('forms:options.verified')}
        </label>
      </div>
    </>
  );

  const renderAddressForm = () => (
    <>
      <div className="mb-4">
        <label className="block text-sm font-medium text-neutral-700 mb-2">
          {t('customers:fields.address_type')} *
        </label>
        <Select
          value={formData.type || ''}
          onChange={(e) => handleInputChange('type', e.target.value)}
          options={[
            { value: 'HOME', label: t('customers:address_types.home') },
            { value: 'WORK', label: t('customers:address_types.work') },
            { value: 'OTHER', label: t('customers:address_types.other') }
          ]}
          error={errors.type}
        />
      </div>
      <div className="mb-4">
        <label className="block text-sm font-medium text-neutral-700 mb-2">
          {t('customers:fields.address_line1')} *
        </label>
        <Input
          value={formData.addressLine1 || ''}
          onChange={(e) => handleInputChange('addressLine1', e.target.value)}
          error={errors.addressLine1}
          placeholder={t('customers:placeholders.address_line1')}
        />
      </div>
      <div className="mb-4">
        <label className="block text-sm font-medium text-neutral-700 mb-2">
          {t('customers:fields.address_line2')}
        </label>
        <Input
          value={formData.addressLine2 || ''}
          onChange={(e) => handleInputChange('addressLine2', e.target.value)}
          placeholder={t('customers:placeholders.address_line2')}
        />
      </div>
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            {t('customers:fields.city')} *
          </label>
          <Input
            value={formData.city || ''}
            onChange={(e) => handleInputChange('city', e.target.value)}
            error={errors.city}
            placeholder={t('customers:placeholders.city')}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            {t('customers:fields.state')} *
          </label>
          <Input
            value={formData.state || ''}
            onChange={(e) => handleInputChange('state', e.target.value)}
            error={errors.state}
            placeholder={t('customers:placeholders.state')}
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            {t('customers:fields.district')} *
          </label>
          <Input
            value={formData.district || ''}
            onChange={(e) => handleInputChange('district', e.target.value)}
            error={errors.district}
            placeholder={t('customers:placeholders.district')}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            {t('customers:fields.country')} *
          </label>
          <Input
            value={formData.country || ''}
            onChange={(e) => handleInputChange('country', e.target.value)}
            error={errors.country}
            placeholder={t('customers:placeholders.country')}
          />
        </div>
      </div>
      <div className="flex gap-4 mb-4">
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={formData.isPrimary || false}
            onChange={(e) => handleInputChange('isPrimary', e.target.checked)}
            className="mr-2"
          />
          {t('forms:options.primary')}
        </label>
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={formData.isVerified || false}
            onChange={(e) => handleInputChange('isVerified', e.target.checked)}
            className="mr-2"
          />
          {t('forms:options.verified')}
        </label>
      </div>
    </>
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={getModalTitle()}>
      <form onSubmit={handleSubmit}>
        {contactType === 'phone' && renderPhoneForm()}
        {contactType === 'email' && renderEmailForm()}
        {contactType === 'address' && renderAddressForm()}
        
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

export default ContactEditModal;