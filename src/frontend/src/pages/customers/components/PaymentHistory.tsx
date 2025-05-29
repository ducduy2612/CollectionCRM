import React from 'react';
import { Payment } from '../types';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';

interface PaymentHistoryProps {
  payments: Payment[];
}

const PaymentHistory: React.FC<PaymentHistoryProps> = ({ payments }) => {
  // Helper function to format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Payment History</CardTitle>
        <Button variant="secondary" size="sm">
          <i className="bi bi-download mr-2"></i>
          Export
        </Button>
      </CardHeader>
      <CardContent>
        {payments.map((payment, index) => (
          <div key={index} className="payment-item flex justify-between py-3 px-4 border-b border-neutral-200 last:border-b-0">
            <div>
              <div className="payment-date font-semibold text-neutral-800">{payment.date}</div>
              <div className="payment-method text-xs text-neutral-500 mt-1">{payment.method}</div>
            </div>
            <div className="payment-amount font-bold text-success-600">
              {formatCurrency(payment.amount)}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default PaymentHistory;