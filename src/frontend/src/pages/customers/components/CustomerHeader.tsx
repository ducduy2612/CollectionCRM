import React from 'react';
import { Customer, ReferenceCustomer } from '../types';
import { Avatar } from '../../../components/ui/Avatar';
import { Badge } from '../../../components/ui/Badge';
import { getCustomerInitials, getCustomerDisplayName } from '../../../utils/customer.utils';
import { useNavigate } from 'react-router-dom';

interface CustomerHeaderProps {
  customer: Customer;
  onReferenceClick?: () => void;
}

const CustomerHeader: React.FC<CustomerHeaderProps> = ({ customer, onReferenceClick }) => {
  // Handle click on reference customer
  const handleReferenceClick = () => {
    if (onReferenceClick) {
      onReferenceClick();
    }
  };

  return (
    <div className="bg-white rounded-lg border border-neutral-200 p-4 mb-6">
      <div className="flex">
        {/* Left side - All customer information */}
        <div className="w-1/2 pr-4">
          <div className="flex items-start mb-4">
            <Avatar initials={getCustomerInitials(customer.name, customer.companyName)} size="md" className="mr-4" />
            <div>
              <h1 className="text-xl font-bold text-neutral-900">{getCustomerDisplayName(customer)}</h1>
              <p className="text-sm text-neutral-600">
                CIF: {customer.cif} | {customer.type} | Segment: {customer.segment}
              </p>
              <p className="text-sm text-neutral-600">Case Status: Active Collection</p>
              {/* Display different fields based on customer type */}
              {customer.type === 'INDIVIDUAL' && (
                <div className="text-sm text-neutral-600 mt-2">
                  {customer.dateOfBirth && <p>Date of Birth: {customer.dateOfBirth}</p>}
                  {customer.nationalId && <p>National ID: {customer.nationalId}</p>}
                  {customer.gender && <p>Gender: {customer.gender}</p>}
                </div>
              )}
              
              {customer.type === 'ORGANIZATION' && (
                <div className="text-sm text-neutral-600 mt-2">
                  {customer.registrationNumber && <p>Registration Number: {customer.registrationNumber}</p>}
                  {customer.taxId && <p>Tax ID: {customer.taxId}</p>}
                </div>
              )}
              <div className="flex gap-2 mt-2">
                <Badge variant="success">ACTIVE</Badge>
                <Badge variant="danger">HIGH RISK</Badge>
              </div>
            </div>
          </div>
        </div>
        
        {/* Right side - Reference Customers Section */}
        <div className="w-1/2 pl-4 border-l border-neutral-200">
          <h3 className="text-base font-semibold mb-3">Reference Customers</h3>
          
          {customer.referenceCustomers && customer.referenceCustomers.length > 0 ? (
            <div className="grid grid-cols-1 gap-3">
              {customer.referenceCustomers.map((ref, index) => (
                <div
                  key={index}
                  className="p-3 cursor-pointer hover:bg-neutral-100 rounded border border-neutral-100 transition-colors"
                  onClick={handleReferenceClick}
                >
                  <div className="flex justify-between items-start">
                    <div className="font-medium text-sm">
                      {ref.type === 'INDIVIDUAL' ? ref.name : ref.companyName}
                    </div>
                    <Badge variant="neutral" className="text-xs">{ref.relationshipType}</Badge>
                  </div>
                  
                  <div className="text-neutral-500 text-xs mt-1">
                    {ref.type === 'INDIVIDUAL' && (
                      <>
                        {ref.nationalId && <div>ID: {ref.nationalId}</div>}
                        {ref.gender && <div>Gender: {ref.gender}</div>}
                      </>
                    )}
                    {ref.type === 'ORGANIZATION' && (
                      <>
                        {ref.registrationNumber && <div>Reg: {ref.registrationNumber}</div>}
                        {ref.taxId && <div>Tax ID: {ref.taxId}</div>}
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-sm text-neutral-500 italic p-4 text-center border border-dashed border-neutral-200 rounded">
              No reference customers available
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CustomerHeader;