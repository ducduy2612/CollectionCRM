import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { useTranslation, useLocalization } from '../../../i18n/hooks/useTranslation';
import { Collateral } from '../types';

interface CustomerCollateralsProps {
  collaterals: Collateral[];
}

const CustomerCollaterals: React.FC<CustomerCollateralsProps> = ({ collaterals }) => {
  const { t } = useTranslation(['customers', 'common']);
  const { formatCurrency: formatLocalizedCurrency } = useLocalization();

  // Helper function to format currency with localization
  const formatCurrency = (amount: number | string) => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    return formatLocalizedCurrency(numAmount || 0, 'VND');
  };

  const getCollateralTypeColor = (type: string) => {
    switch (type) {
      case 'PROPERTY':
        return 'bg-blue-100 text-blue-800';
      case 'VEHICLE':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };


  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (!collaterals || collaterals.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t('customers:tabs.collaterals')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <p>No collaterals found for this customer.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('customers:tabs.collaterals')} ({collaterals.length})</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {collaterals.map((collateral) => (
            <div key={collateral.collateralNumber} className="border rounded-lg p-4">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-medium text-lg">
                    {collateral.collateralNumber}
                  </h3>
                  <Badge className={getCollateralTypeColor(collateral.type)}>
                    {collateral.type}
                  </Badge>
                </div>
                <div className="text-right">
                  <p className="text-lg font-semibold text-green-600">
                    {formatCurrency(collateral.value)}
                  </p>
                  <p className="text-sm text-gray-500">
                    Valued on {formatDate(collateral.valuationDate)}
                  </p>
                </div>
              </div>

              {collateral.description && (
                <p className="text-gray-700 mb-3">{collateral.description}</p>
              )}

              {/* Vehicle specific details */}
              {collateral.type === 'VEHICLE' && (
                <div className="grid grid-cols-2 gap-4 mb-3">
                  {collateral.make && (
                    <div>
                      <span className="text-sm font-medium text-gray-500">Make:</span>
                      <span className="ml-2">{collateral.make}</span>
                    </div>
                  )}
                  {collateral.model && (
                    <div>
                      <span className="text-sm font-medium text-gray-500">Model:</span>
                      <span className="ml-2">{collateral.model}</span>
                    </div>
                  )}
                  {collateral.year && (
                    <div>
                      <span className="text-sm font-medium text-gray-500">Year:</span>
                      <span className="ml-2">{collateral.year}</span>
                    </div>
                  )}
                  {collateral.vin && (
                    <div>
                      <span className="text-sm font-medium text-gray-500">VIN:</span>
                      <span className="ml-2">{collateral.vin}</span>
                    </div>
                  )}
                  {collateral.licensePlate && (
                    <div>
                      <span className="text-sm font-medium text-gray-500">License Plate:</span>
                      <span className="ml-2">{collateral.licensePlate}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Real estate specific details */}
              {collateral.type === 'PROPERTY' && (
                <div className="grid grid-cols-2 gap-4 mb-3">
                  {collateral.propertyType && (
                    <div>
                      <span className="text-sm font-medium text-gray-500">Property Type:</span>
                      <span className="ml-2">{collateral.propertyType}</span>
                    </div>
                  )}
                  {collateral.address && (
                    <div>
                      <span className="text-sm font-medium text-gray-500">Address:</span>
                      <span className="ml-2">{collateral.address}</span>
                    </div>
                  )}
                  {collateral.size && (
                    <div>
                      <span className="text-sm font-medium text-gray-500">Size:</span>
                      <span className="ml-2">{collateral.size} sq ft</span>
                    </div>
                  )}
                  {collateral.titleNumber && (
                    <div>
                      <span className="text-sm font-medium text-gray-500">Title Number:</span>
                      <span className="ml-2">{collateral.titleNumber}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Associated loans */}
              {collateral.associatedLoans && collateral.associatedLoans.length > 0 && (
                <div>
                  <span className="text-sm font-medium text-gray-500">Associated Loans:</span>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {collateral.associatedLoans.map((loan) => (
                      <Badge key={loan.accountNumber} variant="secondary">
                        {loan.accountNumber} ({loan.productType})
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default CustomerCollaterals;