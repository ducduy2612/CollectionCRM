import React, { useState } from 'react';
import { PaymentHistoryItem, PaymentHistoryFilters, Loan } from '../types';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { useTranslation } from '../../../i18n/hooks/useTranslation';
import { Spinner } from '../../../components/ui/Spinner';

interface PaymentHistoryProps {
  cif: string;
  loans?: Loan[];
  payments: PaymentHistoryItem[];
  loading: boolean;
  error: string | null;
  onFiltersChange: (filters?: PaymentHistoryFilters) => Promise<void>;
}

const PaymentHistory: React.FC<PaymentHistoryProps> = ({ 
  cif, 
  loans = [], 
  payments, 
  loading, 
  error, 
  onFiltersChange 
}) => {
  const { t } = useTranslation(['customers', 'tables', 'common']);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<PaymentHistoryFilters>({
    loan_account_number: '',
    start_date: '',
    end_date: ''
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleFilterChange = (field: keyof PaymentHistoryFilters, value: string) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleApplyFilters = () => {
    onFiltersChange(filters);
    setShowFilters(false);
  };

  const handleClearFilters = () => {
    const clearedFilters = {
      loan_account_number: '',
      start_date: '',
      end_date: ''
    };
    setFilters(clearedFilters);
    onFiltersChange();
  };

  const getPaymentChannelDisplay = (channel: string | null) => {
    return channel? channel : t('common:not_specified');
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>{t('customers:tabs.payments')}</CardTitle>
        <div className="flex gap-2">
          <Button 
            variant="secondary" 
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
          >
            <i className="bi bi-funnel mr-2"></i>
            {t('common:buttons:filter') || 'Filter'}
          </Button>
          <Button variant="secondary" size="sm">
            <i className="bi bi-download mr-2"></i>
            {t('tables:actions.export')}
          </Button>
        </div>
      </CardHeader>
      
      {showFilters && (
        <div className="border-t border-neutral-200 p-4 bg-neutral-50">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                {t('customers:action_search.filter_labels.loan_account') || 'Loan Account'}
              </label>
              <select
                value={filters.loan_account_number || ''}
                onChange={(e) => handleFilterChange('loan_account_number', e.target.value)}
                className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">{t('tables:filters.all') || 'All'}</option>
                {loans.map((loan) => (
                  <option key={loan.accountNumber} value={loan.accountNumber}>
                    {loan.accountNumber}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                {t('customers:action_search.start_date') || 'Start Date'}
              </label>
              <input
                type="date"
                value={filters.start_date || ''}
                onChange={(e) => handleFilterChange('start_date', e.target.value)}
                className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                {t('customers:action_search.end_date') || 'End Date'}
              </label>
              <input
                type="date"
                value={filters.end_date || ''}
                onChange={(e) => handleFilterChange('end_date', e.target.value)}
                className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <Button size="sm" onClick={handleApplyFilters}>
              {t('common:buttons.apply') || 'Apply'}
            </Button>
            <Button variant="secondary" size="sm" onClick={handleClearFilters}>
              {t('common:buttons.clear') || 'Clear'}
            </Button>
          </div>
        </div>
      )}
      
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-8">
            <Spinner size="md" />
          </div>
        ) : error ? (
          <div className="text-red-600 text-center py-4">{error}</div>
        ) : payments.length === 0 ? (
          <div className="text-neutral-500 text-center py-8">
            {t('customers:messages.no_payments') || 'No payments found'}
          </div>
        ) : (
          <div className="max-h-96 overflow-y-auto">
            <div className="space-y-2">
              {payments.map((payment) => (
                <div key={payment.id} className="payment-item border border-neutral-200 rounded-lg p-4 hover:bg-neutral-50">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-4 mb-2">
                        <div className="font-semibold text-neutral-800">
                          {payment.loan_account_number}
                        </div>
                        <div className="text-sm text-neutral-500">
                          {t('common:ref')} {payment.reference_number}
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-neutral-600">
                        <div>
                          <i className="bi bi-calendar mr-1"></i>
                          {formatDate(payment.payment_date)}
                        </div>
                        <div>
                          <i className="bi bi-credit-card mr-1"></i>
                          {getPaymentChannelDisplay(payment.payment_channel)}
                        </div>
                        <div className="px-2 py-1 bg-neutral-100 rounded text-xs">
                          {payment.source}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-success-600 text-lg">
                        {formatCurrency(payment.amount)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PaymentHistory;