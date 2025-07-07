import React, { useState, useEffect } from 'react';
import { Phone, Email, Address, WorkflowContactInfo, WorkflowPhone, WorkflowEmail, WorkflowAddress } from '../types';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { Spinner } from '../../../components/ui/Spinner';
import { useTranslation } from '../../../i18n/hooks/useTranslation';
import { workflowApi } from '../../../services/api/workflow.api';
import ContactEditModal from './ContactEditModal';

interface ContactInformationProps {
  cif: string;
  phones: Phone[];
  emails: Email[];
  addresses: Address[];
}

const ContactInformation: React.FC<ContactInformationProps> = ({ cif, phones, emails, addresses }) => {
  const { t } = useTranslation(['customers', 'forms', 'common']);
  const [workflowContacts, setWorkflowContacts] = useState<WorkflowContactInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editModal, setEditModal] = useState<{
    isOpen: boolean;
    type: 'phone' | 'email' | 'address';
    data?: WorkflowPhone | WorkflowEmail | WorkflowAddress;
    isEditing: boolean;
  }>({
    isOpen: false,
    type: 'phone',
    isEditing: false
  });

  // Fetch workflow contact data
  useEffect(() => {
    const fetchWorkflowContacts = async () => {
      if (!cif) return;
      
      setLoading(true);
      setError(null);
      
      try {
        // Get contacts for primary customer only (not reference customers)
        const contactData = await workflowApi.getAllContacts(cif);
        setWorkflowContacts(contactData);
      } catch (err) {
        console.error('Error fetching workflow contacts:', err);
        setError('Failed to load additional contact information');
      } finally {
        setLoading(false);
      }
    };

    fetchWorkflowContacts();
  }, [cif]);

  // Combine bank and workflow data, prioritizing workflow data
  const getCombinedPhones = (): (Phone & { id?: string; source: 'bank' | 'workflow' })[] => {
    const combined: (Phone & { id?: string; source: 'bank' | 'workflow' })[] = [];
    
    // Add bank phones
    phones.forEach(phone => {
      combined.push({ ...phone, source: 'bank' });
    });
    
    // Add workflow phones (these can be edited)
    if (workflowContacts?.phones) {
      workflowContacts.phones.forEach(phone => {
        combined.push({
          id: phone.id,
          type: phone.type as any,
          number: phone.number,
          isPrimary: phone.isPrimary,
          isVerified: phone.isVerified,
          source: 'workflow'
        });
      });
    }
    
    return combined;
  };

  const getCombinedEmails = (): (Email & { id?: string; source: 'bank' | 'workflow' })[] => {
    const combined: (Email & { id?: string; source: 'bank' | 'workflow' })[] = [];
    
    // Add bank emails
    emails.forEach(email => {
      combined.push({ ...email, source: 'bank' });
    });
    
    // Add workflow emails (these can be edited)
    if (workflowContacts?.emails) {
      workflowContacts.emails.forEach(email => {
        combined.push({
          id: email.id,
          address: email.address,
          isPrimary: email.isPrimary,
          isVerified: email.isVerified,
          source: 'workflow'
        });
      });
    }
    
    return combined;
  };

  const getCombinedAddresses = (): (Address & { id?: string; source: 'bank' | 'workflow' })[] => {
    const combined: (Address & { id?: string; source: 'bank' | 'workflow' })[] = [];
    
    // Add bank addresses
    addresses.forEach(address => {
      combined.push({ ...address, source: 'bank' });
    });
    
    // Add workflow addresses (these can be edited)
    if (workflowContacts?.addresses) {
      workflowContacts.addresses.forEach(address => {
        combined.push({
          id: address.id,
          type: address.type as any,
          addressLine1: address.addressLine1,
          addressLine2: address.addressLine2,
          city: address.city,
          state: address.state,
          district: address.district,
          country: address.country,
          isPrimary: address.isPrimary,
          isVerified: address.isVerified,
          source: 'workflow'
        });
      });
    }
    
    return combined;
  };

  const handleAddContact = (type: 'phone' | 'email' | 'address') => {
    setEditModal({
      isOpen: true,
      type,
      isEditing: false
    });
  };

  const handleEditContact = (type: 'phone' | 'email' | 'address', data: WorkflowPhone | WorkflowEmail | WorkflowAddress) => {
    setEditModal({
      isOpen: true,
      type,
      data,
      isEditing: true
    });
  };

  const handleDeleteContact = async (type: 'phone' | 'email' | 'address', id: string) => {
    if (!confirm(t('common:messages.confirm_delete'))) return;
    
    try {
      if (type === 'phone') {
        await workflowApi.deletePhone(cif, id);
      } else if (type === 'email') {
        await workflowApi.deleteEmail(cif, id);
      } else if (type === 'address') {
        await workflowApi.deleteAddress(cif, id);
      }
      
      // Refresh data
      const contactData = await workflowApi.getAllContacts(cif);
      setWorkflowContacts(contactData);
    } catch (err: any) {
      console.error('Error deleting contact:', err);
      
      // Handle specific error cases
      if (err.response?.status === 403) {
        alert(t('common:messages.permission_denied') + ' - ' + t('customers:messages.delete_requires_admin_role'));
      } else if (err.response?.status === 401) {
        alert(t('common:messages.session_expired'));
      } else if (err.response?.status === 404) {
        alert(t('customers:messages.contact_not_found'));
      } else {
        alert(t('customers:messages.delete_failed') + ': ' + (err.response?.data?.message || err.message || t('common:messages.server_error')));
      }
    }
  };

  const handleSaveContact = async (formData: any) => {
    try {
      if (editModal.isEditing && editModal.data) {
        // Update existing contact
        if (editModal.type === 'phone') {
          await workflowApi.updatePhone(cif, editModal.data.id, formData);
        } else if (editModal.type === 'email') {
          await workflowApi.updateEmail(cif, editModal.data.id, formData);
        } else if (editModal.type === 'address') {
          await workflowApi.updateAddress(cif, editModal.data.id, formData);
        }
      } else {
        // Create new contact
        if (editModal.type === 'phone') {
          await workflowApi.createPhone(cif, formData);
        } else if (editModal.type === 'email') {
          await workflowApi.createEmail(cif, formData);
        } else if (editModal.type === 'address') {
          await workflowApi.createAddress(cif, formData);
        }
      }
      
      // Refresh data
      const contactData = await workflowApi.getAllContacts(cif);
      setWorkflowContacts(contactData);
    } catch (err: any) {
      console.error('Error saving contact:', err);
      
      // Provide user-friendly error messages
      let errorMessage = t('customers:messages.save_failed');
      
      if (err.response?.status === 400) {
        const backendMessage = err.response?.data?.message;
        if (backendMessage?.includes('required fields')) {
          errorMessage = t('customers:messages.required_fields_missing');
        } else if (backendMessage?.includes('Invalid email')) {
          errorMessage = t('forms:validation.email_invalid');
        } else {
          errorMessage = backendMessage || t('forms:validation.invalid_format');
        }
      } else if (err.response?.status === 401) {
        errorMessage = t('common:messages.session_expired');
      } else if (err.response?.status === 403) {
        errorMessage = t('common:messages.permission_denied');
      } else if (err.response?.status === 404) {
        errorMessage = t('customers:messages.contact_not_found');
      } else if (err.response?.status === 409) {
        errorMessage = t('customers:messages.duplicate_contact_type');
      } else if (err.response?.status >= 500) {
        errorMessage = t('common:messages.server_error');
      }
      
      
      // Create a new error with user-friendly message
      const userError = new Error(errorMessage);
      throw userError;
    }
  };

  const combinedPhones = getCombinedPhones();
  const combinedEmails = getCombinedEmails();
  const combinedAddresses = getCombinedAddresses();
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t('customers:tabs.contact_info')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center items-center h-32">
            <Spinner size="lg" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="h-full">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>{t('customers:tabs.contact_info')}</CardTitle>
          {error && (
            <div className="text-sm text-red-600">
              {error}
            </div>
          )}
        </CardHeader>
        
        <CardContent>
          {/* Phone Numbers */}
          <div className="contact-section mb-4">
            <div className="text-sm font-semibold text-neutral-600 mb-2 flex items-center justify-between">
              <div className="flex items-center">
                <i className="bi bi-telephone text-primary-500 mr-2"></i>
                {t('customers:fields.phone')}
              </div>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => handleAddContact('phone')}
              >
                <i className="bi bi-plus mr-1"></i>
                {t('common:buttons.add')}
              </Button>
            </div>
            
            {combinedPhones.map((phone, index) => (
              <div key={phone.id || index} className="flex items-center p-2 rounded-md mb-2 bg-neutral-50 border border-neutral-200">
                <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center mr-2 text-sm">
                  <i className={`bi ${phone.type === 'MOBILE' ? 'bi-phone' : phone.type === 'WORK' ? 'bi-building' : 'bi-telephone'}`}></i>
                </div>
                <div className="flex-1">
                  <div className="text-xs text-neutral-500 mb-0.5 flex items-center gap-2">
                    <span>{phone.type}</span>
                    {phone.isPrimary && <Badge variant="primary" size="sm">{t('forms:options.primary')}</Badge>}
                    {phone.isVerified && <Badge variant="success" size="sm">{t('forms:options.verified')}</Badge>}
                    {phone.source === 'bank' && <Badge variant="neutral" size="sm">Bank</Badge>}
                    {phone.source === 'workflow' && <Badge variant="info" size="sm">Editable</Badge>}
                  </div>
                  <div className="font-semibold text-neutral-800">
                    {phone.number}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="primary">
                    <i className="bi bi-telephone mr-1"></i>
                    {t('customers:actions.make_call')}
                  </Button>
                  {phone.source === 'workflow' && phone.id && (
                    <>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleEditContact('phone', workflowContacts!.phones.find(p => p.id === phone.id)!)}
                      >
                        <i className="bi bi-pencil"></i>
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => phone.id && handleDeleteContact('phone', phone.id)}
                      >
                        <i className="bi bi-trash"></i>
                      </Button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
          
          {/* Email Addresses */}
          <div className="contact-section mb-4">
            <div className="text-sm font-semibold text-neutral-600 mb-2 flex items-center justify-between">
              <div className="flex items-center">
                <i className="bi bi-envelope text-primary-500 mr-2"></i>
                {t('customers:fields.email')}
              </div>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => handleAddContact('email')}
              >
                <i className="bi bi-plus mr-1"></i>
                {t('common:buttons.add')}
              </Button>
            </div>
            
            {combinedEmails.map((email, index) => (
              <div key={email.id || index} className="flex items-center p-2 rounded-md mb-2 bg-neutral-50 border border-neutral-200">
                <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center mr-2 text-sm">
                  <i className="bi bi-envelope"></i>
                </div>
                <div className="flex-1">
                  <div className="text-xs text-neutral-500 mb-0.5 flex items-center gap-2">
                    <span>{t('customers:contact_methods.email')}</span>
                    {email.isPrimary && <Badge variant="primary" size="sm">{t('forms:options.primary')}</Badge>}
                    {email.isVerified && <Badge variant="success" size="sm">{t('forms:options.verified')}</Badge>}
                    {email.source === 'bank' && <Badge variant="neutral" size="sm">Bank</Badge>}
                    {email.source === 'workflow' && <Badge variant="info" size="sm">Editable</Badge>}
                  </div>
                  <div className="font-semibold text-neutral-800">
                    {email.address}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="primary">
                    <i className="bi bi-envelope mr-1"></i>
                    {t('customers:contact_methods.email')}
                  </Button>
                  {email.source === 'workflow' && email.id && (
                    <>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleEditContact('email', workflowContacts!.emails.find(e => e.id === email.id)!)}
                      >
                        <i className="bi bi-pencil"></i>
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => email.id && handleDeleteContact('email', email.id)}
                      >
                        <i className="bi bi-trash"></i>
                      </Button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
          
          {/* Physical Addresses */}
          <div className="contact-section">
            <div className="text-sm font-semibold text-neutral-600 mb-2 flex items-center justify-between">
              <div className="flex items-center">
                <i className="bi bi-geo-alt text-primary-500 mr-2"></i>
                {t('customers:fields.address')}
              </div>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => handleAddContact('address')}
              >
                <i className="bi bi-plus mr-1"></i>
                {t('common:buttons.add')}
              </Button>
            </div>
            
            {combinedAddresses.map((address, index) => (
              <div key={address.id || index} className="flex items-center p-2 rounded-md mb-2 bg-neutral-50 border border-neutral-200">
                <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center mr-2 text-sm">
                  <i className={`bi ${address.type === 'HOME' ? 'bi-house' : 'bi-building'}`}></i>
                </div>
                <div className="flex-1">
                  <div className="text-xs text-neutral-500 mb-0.5 flex items-center gap-2">
                    <span>{address.type} {t('customers:fields.address')}</span>
                    {address.isPrimary && <Badge variant="primary" size="sm">{t('forms:options.primary')}</Badge>}
                    {address.isVerified && <Badge variant="success" size="sm">{t('forms:options.verified')}</Badge>}
                    {address.source === 'bank' && <Badge variant="neutral" size="sm">Bank</Badge>}
                    {address.source === 'workflow' && <Badge variant="info" size="sm">Editable</Badge>}
                  </div>
                  <div className="font-semibold text-neutral-800">
                    {address.addressLine1}
                    {address.addressLine2 && `, ${address.addressLine2}`}
                    {`, ${address.city}, ${address.state || address.district || ''}, ${address.country}`}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="secondary">
                    <i className="bi bi-map mr-1"></i>
                    {t('common:buttons.view')}
                  </Button>
                  {address.source === 'workflow' && address.id && (
                    <>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleEditContact('address', workflowContacts!.addresses.find(a => a.id === address.id)!)}
                      >
                        <i className="bi bi-pencil"></i>
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => address.id && handleDeleteContact('address', address.id)}
                      >
                        <i className="bi bi-trash"></i>
                      </Button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Edit Modal */}
      <ContactEditModal
        isOpen={editModal.isOpen}
        onClose={() => setEditModal(prev => ({ ...prev, isOpen: false }))}
        onSave={handleSaveContact}
        contactType={editModal.type}
        contactData={editModal.data}
        isEditing={editModal.isEditing}
      />
    </>
  );
};

export default ContactInformation;