import React, { useState, useEffect } from 'react';
import { ReferenceCustomer } from '../types';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { Spinner } from '../../../components/ui/Spinner';
import { useTranslation } from '../../../i18n/hooks/useTranslation';
import { referenceCustomersApi } from '../../../services/api/workflow/reference-customers.api';
import { bankApi } from '../../../services/api/bank.api';
import { workflowApi } from '../../../services/api/workflow.api';
import ReferenceCustomerEditModal from './ReferenceCustomerEditModal';
import ContactDisplaySection from './ContactDisplaySection';
import ReferenceContactModal from './ReferenceContactModal';
import { useAuth } from '../../../hooks/useAuth';

interface ReferenceCustomersProps {
  primaryCif: string;
  referenceCustomers: ReferenceCustomer[];
  onRefresh: () => void;
}

const ReferenceCustomers: React.FC<ReferenceCustomersProps> = ({ 
  primaryCif, 
  referenceCustomers,
  onRefresh 
}) => {
  const { t } = useTranslation(['customers', 'forms', 'common']);
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [combinedReferences, setCombinedReferences] = useState<ReferenceCustomer[]>([]);
  const [editModal, setEditModal] = useState<{
    isOpen: boolean;
    data?: ReferenceCustomer;
    isEditing: boolean;
  }>({
    isOpen: false,
    isEditing: false
  });

  const [contactModal, setContactModal] = useState<{
    isOpen: boolean;
    contactType: 'phones' | 'emails' | 'addresses';
    reference?: ReferenceCustomer;
  }>({
    isOpen: false,
    contactType: 'phones'
  });

  const canDelete = user?.role === 'ADMIN' || user?.role === 'SUPERVISOR';

  // Reusable function to fetch and combine reference customers from both sources
  const fetchCombinedReferences = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      
      // Fetch from both sources in parallel
      const [bankReferencesResponse, workflowReferences] = await Promise.allSettled([
        bankApi.getCustomerReferencesWithContacts(primaryCif),
        referenceCustomersApi.getReferenceCustomersByPrimaryCifWithContacts(primaryCif)
      ]);

      const combined: ReferenceCustomer[] = [];

      // Add bank references with source marker and fetch their contacts from workflow-service
      if (bankReferencesResponse.status === 'fulfilled') {
        const bankReferences = bankReferencesResponse.value.references;
        
        // For each bank reference customer, combine their bank contacts with workflow contacts
        const bankReferencesWithContacts = await Promise.all(
          bankReferences.map(async (ref: any) => {
            try {
              // Fetch additional contacts for this reference customer from workflow-service
              const workflowContactData = await workflowApi.getAllContacts(primaryCif, ref.refCif);
              
              // Combine bank contacts with workflow contacts
              const combinedPhones = [
                ...(ref.phones || []).map((phone: any) => ({ ...phone, source: 'bank' })),
                ...(workflowContactData.phones || []).map((phone: any) => ({ ...phone, source: 'workflow' }))
              ];
              
              const combinedEmails = [
                ...(ref.emails || []).map((email: any) => ({ ...email, source: 'bank' })),
                ...(workflowContactData.emails || []).map((email: any) => ({ ...email, source: 'workflow' }))
              ];
              
              const combinedAddresses = [
                ...(ref.addresses || []).map((address: any) => ({ ...address, source: 'bank' })),
                ...(workflowContactData.addresses || []).map((address: any) => ({ ...address, source: 'workflow' }))
              ];
              
              return {
                ...ref,
                phones: combinedPhones,
                emails: combinedEmails,
                addresses: combinedAddresses,
                source: 'bank' as const
              };
            } catch (error) {
              console.warn(`Failed to fetch workflow contacts for reference customer ${ref.refCif}:`, error);
              // Return reference with only bank contacts if workflow fetch fails
              return {
                ...ref,
                phones: (ref.phones || []).map((phone: any) => ({ ...phone, source: 'bank' })),
                emails: (ref.emails || []).map((email: any) => ({ ...email, source: 'bank' })),
                addresses: (ref.addresses || []).map((address: any) => ({ ...address, source: 'bank' })),
                source: 'bank' as const
              };
            }
          })
        );
        
        combined.push(...bankReferencesWithContacts);
      }

      // Add workflow references with source marker
      if (workflowReferences.status === 'fulfilled') {
        const workflowRefs = workflowReferences.value.map((ref: any) => ({
          ...ref,
          phones: (ref.phones || []).map((phone: any) => ({ ...phone, source: 'workflow' })),
          emails: (ref.emails || []).map((email: any) => ({ ...email, source: 'workflow' })),
          addresses: (ref.addresses || []).map((address: any) => ({ ...address, source: 'workflow' })),
          source: 'workflow' as const
        }));
        combined.push(...workflowRefs);
      }

      setCombinedReferences(combined);
      return combined;
    } catch (error) {
      console.error('Error fetching combined references:', error);
      // Fall back to the passed-in reference customers from main customer data
      const fallback = referenceCustomers.map(ref => ({ ...ref, source: 'bank' as const }));
      setCombinedReferences(fallback);
      return fallback;
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  // Fetch and combine reference customers from both sources on mount
  useEffect(() => {
    if (primaryCif) {
      fetchCombinedReferences();
    } else {
      // If no primary CIF, use the passed-in reference customers
      setCombinedReferences(referenceCustomers.map(ref => ({ ...ref, source: 'bank' as const })));
    }
  }, [primaryCif, referenceCustomers]);

  const handleAddReference = () => {
    setEditModal({
      isOpen: true,
      isEditing: false
    });
  };

  const handleEditReference = async (reference: ReferenceCustomer) => {
    // Only allow editing workflow reference customers
    if (reference.source !== 'workflow' || !reference.id) {
      alert(t('customers:messages.can_only_edit_workflow_references'));
      return;
    }
    
    setLoading(true);
    try {
      // Fetch full reference customer data
      const fullData = await referenceCustomersApi.getReferenceCustomerById(reference.id);
      setEditModal({
        isOpen: true,
        data: fullData,
        isEditing: true
      });
    } catch (err) {
      console.error('Error fetching reference customer:', err);
      alert(t('customers:messages.load_failed'));
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteReference = async (reference: ReferenceCustomer) => {
    // Only allow deleting workflow reference customers
    if (reference.source !== 'workflow' || !reference.id) {
      alert(t('customers:messages.can_only_delete_workflow_references'));
      return;
    }
    
    if (!confirm(t('common:messages.confirm_delete'))) return;
    
    setLoading(true);
    try {
      await referenceCustomersApi.deleteReferenceCustomer(reference.id);
      // Refresh combined data and parent data
      await fetchCombinedReferences(false);
      onRefresh();
    } catch (err: any) {
      console.error('Error deleting reference customer:', err);
      
      // Handle specific error cases
      if (err.response?.status === 403) {
        alert(t('common:messages.permission_denied') + ' - ' + t('customers:messages.delete_requires_admin_role'));
      } else if (err.response?.status === 401) {
        alert(t('common:messages.session_expired'));
      } else if (err.response?.status === 404) {
        alert(t('customers:messages.reference_not_found'));
      } else {
        alert(t('customers:messages.delete_failed') + ': ' + (err.response?.data?.message || err.message || t('common:messages.server_error')));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSaveReference = async (formData: any) => {
    try {
      if (editModal.isEditing && editModal.data?.id) {
        // Update existing reference customer
        await referenceCustomersApi.updateReferenceCustomer(editModal.data.id, formData);
      } else {
        // Create new reference customer
        await referenceCustomersApi.createReferenceCustomer({
          ...formData,
          primaryCif
        });
      }
      
      // Refresh combined data and parent data
      await fetchCombinedReferences(false);
      onRefresh();
      
      // Close modal
      setEditModal({
        isOpen: false,
        isEditing: false
      });
    } catch (err: any) {
      console.error('Error saving reference customer:', err);
      
      // Provide user-friendly error messages
      let errorMessage = t('customers:messages.save_failed');
      
      if (err.response?.status === 400) {
        const backendMessage = err.response?.data?.message;
        if (backendMessage?.includes('required fields')) {
          errorMessage = t('customers:messages.required_fields_missing');
        } else if (backendMessage?.includes('already exists')) {
          errorMessage = t('customers:messages.reference_already_exists');
        } else {
          errorMessage = backendMessage || t('forms:validation.invalid_format');
        }
      } else if (err.response?.status === 401) {
        errorMessage = t('common:messages.session_expired');
      } else if (err.response?.status === 403) {
        errorMessage = t('common:messages.permission_denied');
      } else if (err.response?.status === 404) {
        errorMessage = t('customers:messages.reference_not_found');
      } else if (err.response?.status >= 500) {
        errorMessage = t('common:messages.server_error');
      }
      
      // Create a new error with user-friendly message
      const userError = new Error(errorMessage);
      throw userError;
    }
  };

  // Contact editing helper - now allows editing for both bank and workflow reference customers
  const canEditContact = () => {
    return (user?.role === 'ADMIN' || user?.role === 'SUPERVISOR');
  };

  // Contact modal handlers
  const handleContactClick = (reference: ReferenceCustomer, contactType: 'phones' | 'emails' | 'addresses') => {
    setContactModal({
      isOpen: true,
      contactType,
      reference
    });
  };


  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t('customers:tabs.references')}</CardTitle>
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
          <CardTitle>{t('customers:tabs.references')}</CardTitle>
          <Button
            size="sm"
            variant="primary"
            onClick={handleAddReference}
          >
            <i className="bi bi-plus mr-1"></i>
            {t('common:buttons.add')} {t('customers:titles.references')}
          </Button>
        </CardHeader>
        
        <CardContent>
          {combinedReferences && combinedReferences.length > 0 ? (
            <div className="grid grid-cols-1 gap-4">
              {combinedReferences.map((reference) => (
                <div 
                  key={reference.id || reference.refCif} 
                  className="p-4 rounded-lg border border-neutral-200 bg-neutral-50 hover:bg-neutral-100 transition-colors"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-semibold text-neutral-900">
                          {reference.type === 'INDIVIDUAL' ? reference.name : reference.companyName}
                        </h3>
                        <Badge 
                          variant="primary"
                          size="sm"
                        >
                          {reference.relationshipType}
                        </Badge>
                        <Badge variant="neutral" size="sm">
                          {reference.type}
                        </Badge>
                        <Badge variant={reference.source === 'workflow' ? 'success' : 'neutral'} size="sm">
                          {reference.source === 'workflow' ? 'Editable' : 'Bank Data'}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 text-sm">
                        {/* Column 1: Basic Customer Reference Data */}
                        <div>
                          <div className="flex items-center mb-2">
                            <i className="bi bi-person text-neutral-500 mr-2"></i>
                            <span className="text-neutral-600 font-medium text-xs uppercase">{t('customers:fields.basic_info')}</span>
                          </div>
                          <div className="space-y-1">
                            <div>
                              <span className="text-neutral-600">CIF:</span>
                              <span className="ml-2 font-medium">{reference.refCif || '-'}</span>
                            </div>
                            
                            {reference.type === 'INDIVIDUAL' && (
                              <>
                                {reference.nationalId && (
                                  <div>
                                    <span className="text-neutral-600">{t('forms:labels.national_id')}:</span>
                                    <span className="ml-2 font-medium">{reference.nationalId}</span>
                                  </div>
                                )}
                                {reference.dateOfBirth && (
                                  <div>
                                    <span className="text-neutral-600">{t('customers:fields.date_of_birth')}:</span>
                                    <span className="ml-2 font-medium">{reference.dateOfBirth}</span>
                                  </div>
                                )}
                                {reference.gender && (
                                  <div>
                                    <span className="text-neutral-600">{t('customers:fields.gender')}:</span>
                                    <span className="ml-2 font-medium">{reference.gender}</span>
                                  </div>
                                )}
                              </>
                            )}
                            
                            {reference.type === 'ORGANIZATION' && (
                              <>
                                {reference.registrationNumber && (
                                  <div>
                                    <span className="text-neutral-600">{t('customers:fields.registration_number')}:</span>
                                    <span className="ml-2 font-medium">{reference.registrationNumber}</span>
                                  </div>
                                )}
                                {reference.taxId && (
                                  <div>
                                    <span className="text-neutral-600">{t('forms:labels.tax_id')}:</span>
                                    <span className="ml-2 font-medium">{reference.taxId}</span>
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                        </div>

                        {/* Column 2: Phone Numbers */}
                        <ContactDisplaySection
                          title={t('customers:fields.phones')}
                          icon="bi-telephone"
                          items={reference.phones || []}
                          canEdit={canEditContact()}
                          maxDisplay={3}
                          onClick={() => handleContactClick(reference, 'phones')}
                        />

                        {/* Column 3: Addresses */}
                        <ContactDisplaySection
                          title={t('customers:fields.addresses')}
                          icon="bi-geo-alt"
                          items={reference.addresses || []}
                          canEdit={canEditContact()}
                          maxDisplay={2}
                          onClick={() => handleContactClick(reference, 'addresses')}
                        />

                        {/* Column 4: Email Addresses */}
                        <ContactDisplaySection
                          title={t('customers:fields.emails')}
                          icon="bi-envelope"
                          items={reference.emails || []}
                          canEdit={canEditContact()}
                          maxDisplay={3}
                          onClick={() => handleContactClick(reference, 'emails')}
                        />
                      </div>
                    </div>
                    
                    <div className="flex gap-2 ml-4">
                      {reference.source === 'workflow' && (
                        <>
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => handleEditReference(reference)}
                          >
                            <i className="bi bi-pencil"></i>
                          </Button>
                          {canDelete && (
                            <Button
                              size="sm"
                              variant="danger"
                              onClick={() => handleDeleteReference(reference)}
                            >
                              <i className="bi bi-trash"></i>
                            </Button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="text-neutral-500 mb-4">
                <i className="bi bi-people text-4xl"></i>
              </div>
              <p className="text-neutral-600 mb-4">{t('customers:messages.no_references')}</p>
              <Button
                variant="primary"
                onClick={handleAddReference}
              >
                <i className="bi bi-plus mr-1"></i>
                {t('customers:actions.add_first_reference')}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Modal */}
      <ReferenceCustomerEditModal
        isOpen={editModal.isOpen}
        onClose={() => setEditModal(prev => ({ ...prev, isOpen: false }))}
        onSave={handleSaveReference}
        referenceData={editModal.data}
        isEditing={editModal.isEditing}
        primaryCif={primaryCif}
      />

      {/* Contact Management Modal */}
      {contactModal.reference && (
        <ReferenceContactModal
          isOpen={contactModal.isOpen}
          onClose={() => setContactModal(prev => ({ ...prev, isOpen: false }))}
          onRefresh={() => fetchCombinedReferences(false)}
          contactType={contactModal.contactType}
          reference={contactModal.reference}
          primaryCif={primaryCif}
          canEdit={canEditContact()}
        />
      )}
    </>
  );
};

export default ReferenceCustomers;