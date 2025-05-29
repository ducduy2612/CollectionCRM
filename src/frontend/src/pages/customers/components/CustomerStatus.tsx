import React from 'react';
import { CustomerStatus as CustomerStatusType } from '../types';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';

interface CustomerStatusProps {
  status: CustomerStatusType;
}

const CustomerStatus: React.FC<CustomerStatusProps> = ({ status }) => {
  // Helper function to get status color class
  const getStatusColorClass = (statusType: string) => {
    switch (statusType) {
      case 'UNCOOPERATIVE': return 'text-danger-600';
      case 'SECURED': return 'text-success-600';
      case 'FOLLOW_UP': return 'text-warning-600';
      case 'NONE': return 'text-primary-600';
      case 'PARTIAL': return 'text-warning-600';
      default: return 'text-neutral-600';
    }
  };

  return (
    <Card className="col-span-2">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Customer Status</CardTitle>
        <Button variant="secondary" size="sm">
          <i className="bi bi-pencil mr-2"></i>
          Update
        </Button>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-5 gap-4">
          <div className="bg-neutral-50 rounded-md p-4 text-center border border-neutral-200">
            <div className="text-xs text-neutral-600 mb-2 font-medium">Customer Status</div>
            <div className={`font-bold text-sm ${getStatusColorClass(status.customerStatus)}`}>
              {status.customerStatus}
            </div>
          </div>
          
          <div className="bg-neutral-50 rounded-md p-4 text-center border border-neutral-200">
            <div className="text-xs text-neutral-600 mb-2 font-medium">Collateral Status</div>
            <div className={`font-bold text-sm ${getStatusColorClass(status.collateralStatus)}`}>
              {status.collateralStatus}
            </div>
          </div>
          
          <div className="bg-neutral-50 rounded-md p-4 text-center border border-neutral-200">
            <div className="text-xs text-neutral-600 mb-2 font-medium">Processing State</div>
            <div className={`font-bold text-sm ${getStatusColorClass(status.processingState)}`}>
              {status.processingState}
            </div>
          </div>
          
          <div className="bg-neutral-50 rounded-md p-4 text-center border border-neutral-200">
            <div className="text-xs text-neutral-600 mb-2 font-medium">Lending Violation</div>
            <div className={`font-bold text-sm ${getStatusColorClass(status.lendingViolation)}`}>
              {status.lendingViolation}
            </div>
          </div>
          
          <div className="bg-neutral-50 rounded-md p-4 text-center border border-neutral-200">
            <div className="text-xs text-neutral-600 mb-2 font-medium">Recovery Ability</div>
            <div className={`font-bold text-sm ${getStatusColorClass(status.recoveryAbility)}`}>
              {status.recoveryAbility}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CustomerStatus;