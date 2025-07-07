import React, { useState, useEffect } from 'react';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import { useTranslation } from '../../../i18n/hooks/useTranslation';
import { contactsApi } from '../../../services/api/workflow/contacts.api';
import { ReferenceCustomer } from '../types';
import ContactListItem from './ContactListItem';
import PhoneForm from './forms/PhoneForm';
import EmailForm from './forms/EmailForm';
import AddressForm from './forms/AddressForm';
import { usePhoneTypes, useAddressTypes } from '../hooks/useContactTypes';

interface ContactItem {
  id: string;
  [key: string]: any;
}

interface ReferenceContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRefresh: () => void;
  contactType: 'phones' | 'emails' | 'addresses';
  reference: ReferenceCustomer;
  primaryCif: string;
  canEdit: boolean;
}

const ReferenceContactModal: React.FC<ReferenceContactModalProps> = ({
  isOpen,
  onClose,
  onRefresh,
  contactType,
  reference,
  primaryCif,
  canEdit
}) => {
  const { t } = useTranslation(['customers', 'forms', 'common']);
  const [contacts, setContacts] = useState<ContactItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingContact, setEditingContact] = useState<ContactItem | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState<any>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Use custom hooks for fetching types
  const { phoneTypes, loading: phoneTypesLoading } = usePhoneTypes();
  const { addressTypes, loading: addressTypesLoading } = useAddressTypes();

  // Load contacts when modal opens
  useEffect(() => {
    if (isOpen) {
      loadContacts();
    }
  }, [isOpen, reference, contactType]);

  const loadContacts = () => {
    const contactItems = reference[contactType] || [];
    console.log(`Loading ${contactType} for reference:`, reference);
    console.log(`Contact items:`, contactItems);
    setContacts(contactItems);
  };

  const getModalTitle = () => {
    const refName = reference.type === 'INDIVIDUAL' ? reference.name : reference.companyName;
    const typeLabel = contactType === 'phones' ? t('customers:fields.phones') :
                     contactType === 'emails' ? t('customers:fields.emails') :
                     t('customers:fields.addresses');
    return `${typeLabel} - ${refName}`;
  };

  const resetForm = () => {
    if (contactType === 'phones') {
      setFormData({ 
        number: '', 
        type: phoneTypes.length > 0 ? phoneTypes[0].value : 'mobile1', 
        isPrimary: false, 
        isVerified: false 
      });
    } else if (contactType === 'emails') {
      setFormData({ address: '', isPrimary: false, isVerified: false });
    } else if (contactType === 'addresses') {
      setFormData({
        type: addressTypes.length > 0 ? addressTypes[0].value : 'home1',
        addressLine1: '',
        addressLine2: '',
        city: '',
        state: '',
        district: '',
        country: 'VN',
        isPrimary: false,
        isVerified: false
      });
    }
    setErrors({});
  };

  const handleAdd = () => {
    resetForm();
    setEditingContact(null);
    setShowAddForm(true);
  };

  const handleEdit = (contact: ContactItem) => {
    console.log('Editing contact:', contact);
    setEditingContact(contact);
    
    // Map the contact data to form fields
    if (contactType === 'phones') {
      setFormData({
        number: contact.number || '',
        type: contact.type || phoneTypes[0]?.value || 'mobile1',
        isPrimary: contact.isPrimary || false,
        isVerified: contact.isVerified || false
      });
    } else if (contactType === 'emails') {
      setFormData({
        address: contact.address || '',
        isPrimary: contact.isPrimary || false,
        isVerified: contact.isVerified || false
      });
    } else if (contactType === 'addresses') {
      setFormData({
        type: contact.type || addressTypes[0]?.value || 'home1',
        addressLine1: contact.line1 || contact.addressLine1 || '',
        addressLine2: contact.line2 || contact.addressLine2 || '',
        city: contact.city || '',
        state: contact.state || '',
        district: contact.district || '',
        country: contact.country || 'VN',
        isPrimary: contact.isPrimary || false,
        isVerified: contact.isVerified || false
      });
    }
    
    setShowAddForm(true);
  };

  const handleDelete = async (contact: ContactItem) => {
    const contactInfo = contactType === 'phones' ? contact.number :
                       contactType === 'emails' ? contact.address :
                       contact.line1 || contact.addressLine1;
    
    if (!confirm(`Are you sure you want to delete this ${contactType.slice(0, -1)}?\n\n${contactInfo}`)) return;
    
    try {
      setLoading(true);
      
      if (contactType === 'phones') {
        await contactsApi.deletePhone(primaryCif, contact.id);
      } else if (contactType === 'emails') {
        await contactsApi.deleteEmail(primaryCif, contact.id);
      } else if (contactType === 'addresses') {
        await contactsApi.deleteAddress(primaryCif, contact.id);
      }
      
      onRefresh();
      loadContacts();
      
    } catch (error: any) {
      console.error('Error deleting contact:', error);
      
      // Extract error message from the response
      let errorMessage = t('customers:messages.delete_failed');
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (contactType === 'phones') {
      if (!formData.number) {
        newErrors.number = t('forms:validation.required');
      } else {
        // More lenient phone validation - allows digits, spaces, hyphens, plus, parentheses
        const phoneRegex = /^[\d\s\-\+\(\)]+$/;
        if (!phoneRegex.test(formData.number)) {
          newErrors.number = t('forms:validation.invalid_phone');
        }
      }
    } else if (contactType === 'emails') {
      if (!formData.address) {
        newErrors.address = t('forms:validation.required');
      } else {
        // Standard email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.address)) {
          newErrors.address = t('forms:validation.invalid_email');
        }
      }
    } else if (contactType === 'addresses') {
      if (!formData.addressLine1) newErrors.addressLine1 = t('forms:validation.required');
      if (!formData.city) newErrors.city = t('forms:validation.required');
      if (!formData.state) newErrors.state = t('forms:validation.required');
      if (!formData.district) newErrors.district = t('forms:validation.required');
      if (!formData.country) newErrors.country = t('forms:validation.required');
    }

    console.log('Validation results:', { formData, newErrors });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;
    
    try {
      setLoading(true);
      
      // Use refCif for reference customer contacts
      const refCif = reference.refCif;
      const data = { ...formData, refCif };
      
      console.log('Saving contact with data:', { data, primaryCif, refCif, contactType });
      
      if (editingContact) {
        // Update existing contact (only possible for workflow contacts with IDs)
        if (contactType === 'phones') {
          await contactsApi.updatePhone(primaryCif, editingContact.id, data);
        } else if (contactType === 'emails') {
          await contactsApi.updateEmail(primaryCif, editingContact.id, data);
        } else if (contactType === 'addresses') {
          await contactsApi.updateAddress(primaryCif, editingContact.id, data);
        }
      } else {
        // Create new contact (works for both bank and workflow reference customers)
        if (contactType === 'phones') {
          await contactsApi.createPhone(primaryCif, data);
        } else if (contactType === 'emails') {
          await contactsApi.createEmail(primaryCif, data);
        } else if (contactType === 'addresses') {
          await contactsApi.createAddress(primaryCif, data);
        }
      }
      
      setShowAddForm(false);
      onRefresh();
      loadContacts();
      
    } catch (error: any) {
      console.error('Error saving contact:', error);
      
      // Extract error message from the response
      let errorMessage = t('customers:messages.save_failed');
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    console.log('Input change:', { field, value, currentFormData: formData });
    setFormData((prev: any) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const renderContactList = () => (
    <div className="space-y-3">
      {contacts.map((contact, idx) => (
        <ContactListItem
          key={idx}
          contact={contact}
          contactType={contactType}
          canEdit={canEdit}
          loading={loading}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      ))}
      
      {contacts.length === 0 && (
        <div className="text-center py-8 text-neutral-500">
          No {contactType} found
        </div>
      )}
    </div>
  );

  const renderForm = () => {
    switch (contactType) {
      case 'phones':
        return (
          <PhoneForm
            formData={formData}
            errors={errors}
            phoneTypes={phoneTypes}
            phoneTypesLoading={phoneTypesLoading}
            onChange={handleInputChange}
          />
        );
      
      case 'emails':
        return (
          <EmailForm
            formData={formData}
            errors={errors}
            onChange={handleInputChange}
          />
        );
      
      case 'addresses':
        return (
          <AddressForm
            formData={formData}
            errors={errors}
            addressTypes={addressTypes}
            addressTypesLoading={addressTypesLoading}
            onChange={handleInputChange}
          />
        );
      
      default:
        return null;
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={getModalTitle()}>
      <div className="space-y-4">
        {/* Header with Add button */}
        <div className="flex justify-between items-center">
          <div className="text-sm text-neutral-600">
            Reference Source: {reference.source === 'workflow' ? 'Workflow Service' : 'Bank Sync Service'}
            <br />
            <span className="text-xs text-neutral-500">
              New contacts will be saved to Workflow Service
            </span>
          </div>
          {canEdit && (
            <Button
              size="sm"
              variant="primary"
              onClick={handleAdd}
              disabled={loading}
            >
              <i className="bi bi-plus mr-1"></i>
              Add {contactType.slice(0, -1)}
            </Button>
          )}
        </div>

        {/* Contact List */}
        {!showAddForm && renderContactList()}

        {/* Add/Edit Form */}
        {showAddForm && (
          <div className="border-t pt-4">
            <h3 className="text-lg font-medium mb-4">
              {editingContact ? 'Edit' : 'Add'} {contactType.slice(0, -1)}
            </h3>
            
            {renderForm()}
            
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

            <div className="flex justify-end gap-3">
              <Button
                variant="secondary"
                onClick={() => setShowAddForm(false)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleSave}
                loading={loading}
              >
                {editingContact ? 'Update' : 'Create'}
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default ReferenceContactModal;