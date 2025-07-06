import React, { useState, useEffect } from 'react';
import { Customer, ReferenceCustomer } from '../types';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Avatar } from '../../../components/ui/Avatar';
import { Badge } from '../../../components/ui/Badge';
import { getCustomerInitials, getCustomerDisplayName } from '../../../utils/customer.utils';
import { useTranslation } from '../../../i18n/hooks/useTranslation';
import { referenceCustomersApi } from '../../../services/api/workflow/reference-customers.api';

interface CustomerHeaderProps {
  customer: Customer;
  onReferenceClick?: () => void;
}

const CustomerHeader: React.FC<CustomerHeaderProps> = ({ customer, onReferenceClick }) => {
  const { t } = useTranslation(['customers', 'common']);
  const [allReferences, setAllReferences] = useState<ReferenceCustomer[]>(customer.referenceCustomers || []);
  
  // Fetch workflow reference customers and merge with bank references
  useEffect(() => {
    const fetchWorkflowReferences = async () => {
      try {
        // Get workflow reference customers
        const workflowReferences = await referenceCustomersApi.getReferenceCustomersByPrimaryCifWithContacts(customer.cif);
        
        // Combine bank references (from customer prop) with workflow references
        const bankReferences = customer.referenceCustomers?.map(ref => ({ ...ref, source: 'bank' as const })) || [];
        const workflowRefs = workflowReferences.map((ref: any) => ({ ...ref, source: 'workflow' as const }));
        
        const combined = [...bankReferences, ...workflowRefs];
        setAllReferences(combined);
      } catch (error) {
        console.error('Error fetching workflow references:', error);
        // Fall back to bank references only
        setAllReferences(customer.referenceCustomers?.map(ref => ({ ...ref, source: 'bank' as const })) || []);
      }
    };

    if (customer.cif) {
      fetchWorkflowReferences();
    }
  }, [customer.cif, customer.referenceCustomers]);
  
  // Handle click on reference customer
  const handleReferenceClick = () => {
    if (onReferenceClick) {
      onReferenceClick();
    }
  };

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Customer Overview</CardTitle>
        <Button variant="secondary" size="sm" onClick={onReferenceClick}>
          <i className="bi bi-people mr-2"></i>
          View References
        </Button>
      </CardHeader>
      <CardContent>
        <div className="flex">
          {/* Left side - All customer information */}
          <div className="w-1/2 pr-4">
            <div className="flex items-start mb-3">
              <Avatar initials={getCustomerInitials(customer.name, customer.companyName)} size="sm" className="mr-3" />
              <div>
                <h1 className="text-lg font-bold text-neutral-900">{getCustomerDisplayName(customer)}</h1>
                <p className="text-sm text-neutral-600">
                  {t('customers:fields.customer_id')}: {customer.cif} | {customer.type} | {t('forms:labels.category')}: {customer.segment}
                </p>
                {/* Display different fields based on customer type */}
                {customer.type === 'INDIVIDUAL' && (
                  <div className="text-sm text-neutral-600 mt-1">
                    {customer.dateOfBirth && <p>{t('customers:fields.date_of_birth')}: {customer.dateOfBirth}</p>}
                    {customer.nationalId && <p>{t('forms:labels.national_id')}: {customer.nationalId}</p>}
                    {customer.gender && <p>{t('customers:fields.gender')}: {customer.gender}</p>}
                  </div>
                )}
                
                {customer.type === 'ORGANIZATION' && (
                  <div className="text-sm text-neutral-600 mt-1">
                    {customer.registrationNumber && <p>{t('forms:labels.reference')}: {customer.registrationNumber}</p>}
                    {customer.taxId && <p>{t('forms:labels.tax_id')}: {customer.taxId}</p>}
                  </div>
                )}
                <div className="flex gap-2 mt-1">
                  <Badge variant={customer.status === 'ACTIVE' ? 'success' : 'danger'}>
                    {t(`customers:status.${customer.status.toLowerCase()}`)}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
          
          {/* Right side - Reference Customers Section */}
          <div className="w-1/2 pl-4 border-l border-neutral-200">
            <h3 className="text-sm font-semibold mb-2">{t('customers:titles.references')}</h3>
            
            {allReferences && allReferences.length > 0 ? (
              <div className="grid grid-cols-1 gap-2">
                {allReferences.map((ref, index) => (
                  <div
                    key={index}
                    className="p-2 cursor-pointer hover:bg-neutral-100 rounded border border-neutral-100 transition-colors"
                    onClick={handleReferenceClick}
                  >
                    <div className="flex justify-between items-start">
                      <div className="font-medium text-sm">
                        {ref.type === 'INDIVIDUAL' ? ref.name : ref.companyName}
                      </div>
                      <div className="flex gap-1">
                        <Badge variant="neutral" className="text-xs">{ref.relationshipType}</Badge>
                        <Badge variant={ref.source === 'workflow' ? 'success' : 'neutral'} className="text-xs">
                          {ref.source === 'workflow' ? 'User' : 'Bank'}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="text-neutral-500 text-xs mt-1">
                      {ref.type === 'INDIVIDUAL' && (
                        <>
                          {ref.nationalId && <div>{t('forms:labels.national_id')}: {ref.nationalId}</div>}
                          {ref.gender && <div>{t('customers:fields.gender')}: {ref.gender}</div>}
                        </>
                      )}
                      {ref.type === 'ORGANIZATION' && (
                        <>
                          {ref.registrationNumber && <div>{t('forms:labels.reference')}: {ref.registrationNumber}</div>}
                          {ref.taxId && <div>{t('forms:labels.tax_id')}: {ref.taxId}</div>}
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-neutral-500 italic p-4 text-center border border-dashed border-neutral-200 rounded">
                {t('customers:messages.no_customers')}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CustomerHeader;