import React from 'react';
import { Loan } from '../types';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';

interface LoanSummaryProps {
  loans: Loan[];
}

const LoanSummary: React.FC<LoanSummaryProps> = ({ loans }) => {
  // Helper function to format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Helper function to get status badge variant
  const getStatusVariant = (dpd: number) => {
    if (dpd === 0) return 'success';
    if (dpd <= 30) return 'warning';
    return 'danger';
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Loan Summary</CardTitle>
        <Button variant="secondary" size="sm">
          <i className="bi bi-graph-up mr-2"></i>
          Analytics
        </Button>
      </CardHeader>
      
      <CardContent>
        {loans.map((loan, index) => (
          <div key={index} className="mb-4 border rounded-md overflow-hidden">
            <div className="flex justify-between items-center p-3 bg-neutral-50 border-b border-neutral-200">
              <div className="font-semibold">{loan.productType} #{loan.accountNumber}</div>
              <Badge variant={getStatusVariant(loan.dpd)}>
                {loan.dpd === 0 ? 'Current' : `${loan.dpd} DPD`}
              </Badge>
            </div>
            <div className="grid grid-cols-4 p-3">
              <div>
                <div className="text-xs text-neutral-500 mb-1">Outstanding</div>
                <div className="font-semibold">{formatCurrency(loan.outstanding)}</div>
              </div>
              <div>
                <div className="text-xs text-neutral-500 mb-1">Due Amount</div>
                <div className="font-semibold">{formatCurrency(loan.dueAmount)}</div>
              </div>
              <div>
                <div className="text-xs text-neutral-500 mb-1">Next Payment</div>
                <div className="font-semibold">{new Date(loan.nextPaymentDate).toLocaleDateString()}</div>
              </div>
              <div>
                <div className="text-xs text-neutral-500 mb-1">Product Type</div>
                <div className="font-semibold">{loan.productType}</div>
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default LoanSummary;