import React, { useState, useEffect } from 'react';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { useTranslation } from '../../../i18n/hooks/useTranslation';
import { contactsApi } from '../../../services/api/workflow/contacts.api';
import { ReferenceCustomer } from '../types';

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
      setFormData({ number: '', type: 'MOBILE', isPrimary: false, isVerified: false });
    } else if (contactType === 'emails') {
      setFormData({ address: '', isPrimary: false, isVerified: false });
    } else if (contactType === 'addresses') {
      setFormData({
        type: 'HOME',
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
        type: contact.type || 'MOBILE',
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
        type: contact.type || 'HOME',
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
      
    } catch (error) {
      console.error('Error deleting contact:', error);
      alert(t('customers:messages.delete_failed'));
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
      // For bank reference customers, this will be their refCif field (contains their CIF)
      // For workflow reference customers, this will also be their refCif field
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
      
    } catch (error) {
      console.error('Error saving contact:', error);
      alert(t('customers:messages.save_failed'));
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
        <div key={idx} className="p-4 border rounded-lg bg-white shadow-sm hover:shadow-md transition-shadow flex justify-between items-start">
          <div className="flex-1">
            {contactType === 'phones' && (
              <div>
                <div className="font-medium">{contact.number}</div>
                <div className="text-sm text-neutral-600">
                  Type: {contact.type} {contact.isPrimary && '(Primary)'} {contact.isVerified && '(Verified)'}
                </div>
              </div>
            )}
            {contactType === 'emails' && (
              <div>
                <div className="font-medium">{contact.address}</div>
                <div className="text-sm text-neutral-600">
                  {contact.isPrimary && '(Primary)'} {contact.isVerified && '(Verified)'}
                </div>
              </div>
            )}
            {contactType === 'addresses' && (
              <div>
                <div className="font-medium">{contact.line1 || contact.addressLine1}</div>
                {(contact.line2 || contact.addressLine2) && <div className="text-sm">{contact.line2 || contact.addressLine2}</div>}
                <div className="text-sm text-neutral-600">
                  {contact.city}, {contact.state}, {contact.country}
                </div>
                <div className="text-xs text-neutral-500">
                  Type: {contact.type} {contact.isPrimary && '(Primary)'} {contact.isVerified && '(Verified)'}
                </div>
              </div>
            )}
          </div>
          
          {canEdit && (
            <div className="flex gap-2 ml-4">
              {/* Only show edit/delete for workflow contacts that have IDs */}
              {contact.source === 'workflow' && contact.id && (
                <>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => handleEdit(contact)}
                    disabled={loading}
                    title="Edit contact"
                  >
                    <i className="bi bi-pencil-square mr-1"></i>
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() => handleDelete(contact)}
                    disabled={loading}
                    title="Delete contact"
                  >
                    <i className="bi bi-trash mr-1"></i>
                    Delete
                  </Button>
                </>
              )}
              
              {/* Show source indicator */}
              <span className="text-xs px-2 py-1 rounded bg-neutral-100 text-neutral-600">
                {contact.source === 'workflow' ? 'Workflow Data' : 'Bank Data'}
              </span>
            </div>
          )}
        </div>
      ))}
      
      {contacts.length === 0 && (
        <div className="text-center py-8 text-neutral-500">
          No {contactType} found
        </div>
      )}
    </div>
  );

  const renderForm = () => {
    if (contactType === 'phones') {
      return (
        <>
          <div className="mb-4">
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Phone Number *
            </label>
            <Input
              type="tel"
              value={formData.number || ''}
              onChange={(e) => handleInputChange('number', e.target.value)}
              error={errors.number}
              placeholder="Enter phone number"
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Type
            </label>
            <Select
              value={formData.type || 'MOBILE'}
              onChange={(e) => handleInputChange('type', e.target.value)}
              options={[
                { value: 'MOBILE', label: 'Mobile' },
                { value: 'HOME', label: 'Home' },
                { value: 'WORK', label: 'Work' },
                { value: 'OTHER', label: 'Other' }
              ]}
            />
          </div>
        </>
      );
    }
    
    if (contactType === 'emails') {
      return (
        <div className="mb-4">
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            Email Address *
          </label>
          <Input
            type="email"
            value={formData.address || ''}
            onChange={(e) => handleInputChange('address', e.target.value)}
            error={errors.address}
            placeholder="Enter email address"
          />
        </div>
      );
    }
    
    if (contactType === 'addresses') {
      return (
        <>
          <div className="mb-4">
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Type
            </label>
            <Select
              value={formData.type || 'HOME'}
              onChange={(e) => handleInputChange('type', e.target.value)}
              options={[
                { value: 'HOME', label: 'Home' },
                { value: 'WORK', label: 'Work' },
                { value: 'OTHER', label: 'Other' }
              ]}
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Address Line 1 *
            </label>
            <Input
              value={formData.addressLine1 || ''}
              onChange={(e) => handleInputChange('addressLine1', e.target.value)}
              error={errors.addressLine1}
              placeholder="Enter address line 1"
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Address Line 2
            </label>
            <Input
              value={formData.addressLine2 || ''}
              onChange={(e) => handleInputChange('addressLine2', e.target.value)}
              placeholder="Enter address line 2"
            />
          </div>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                City *
              </label>
              <Input
                value={formData.city || ''}
                onChange={(e) => handleInputChange('city', e.target.value)}
                error={errors.city}
                placeholder="Enter city"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                State *
              </label>
              <Input
                value={formData.state || ''}
                onChange={(e) => handleInputChange('state', e.target.value)}
                error={errors.state}
                placeholder="Enter state"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                District *
              </label>
              <Input
                value={formData.district || ''}
                onChange={(e) => handleInputChange('district', e.target.value)}
                error={errors.district}
                placeholder="Enter district"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Country *
              </label>
              <Input
                value={formData.country || ''}
                onChange={(e) => handleInputChange('country', e.target.value)}
                error={errors.country}
                placeholder="Enter country"
              />
            </div>
          </div>
        </>
      );
    }
    
    return null;
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