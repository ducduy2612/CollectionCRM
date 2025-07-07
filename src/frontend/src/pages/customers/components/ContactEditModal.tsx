import React, { useState, useEffect } from 'react';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import { useTranslation } from '../../../i18n/hooks/useTranslation';
import { WorkflowPhone, WorkflowEmail, WorkflowAddress } from '../types';
import PhoneForm from './forms/PhoneForm';
import EmailForm from './forms/EmailForm';
import AddressForm from './forms/AddressForm';
import { usePhoneTypes, useAddressTypes } from '../hooks/useContactTypes';

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
  
  // Use custom hooks for type fetching
  const { phoneTypes, loading: phoneTypesLoading } = usePhoneTypes();
  const { addressTypes, loading: addressTypesLoading } = useAddressTypes();

  // Initialize form data when modal opens or data changes
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
        resetForm();
      }
      setErrors({});
    }
  }, [isOpen, isEditing, contactData, contactType, phoneTypes, addressTypes]);

  const resetForm = () => {
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
        type: addressTypes.length > 0 ? addressTypes[0].value : 'home1',
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
  };

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
      alert(error.message);
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

  const renderForm = () => {
    switch (contactType) {
      case 'phone':
        return (
          <PhoneForm
            formData={formData}
            errors={errors}
            phoneTypes={phoneTypes}
            phoneTypesLoading={phoneTypesLoading}
            onChange={handleInputChange}
            showCheckboxes={true}
          />
        );
      
      case 'email':
        return (
          <EmailForm
            formData={formData}
            errors={errors}
            onChange={handleInputChange}
            showCheckboxes={true}
          />
        );
      
      case 'address':
        return (
          <AddressForm
            formData={formData}
            errors={errors}
            addressTypes={addressTypes}
            addressTypesLoading={addressTypesLoading}
            onChange={handleInputChange}
            showCheckboxes={true}
          />
        );
      
      default:
        return null;
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={getModalTitle()}>
      <form onSubmit={handleSubmit}>
        {renderForm()}
        
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