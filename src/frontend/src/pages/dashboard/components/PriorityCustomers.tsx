import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Avatar } from '../../../components/ui/Avatar';
import { Spinner } from '../../../components/ui/Spinner';
import { Alert } from '../../../components/ui/Alert';
import { Assignment } from '../../../services/api/workflow.api';
import { useTranslation } from '../../../i18n/hooks/useTranslation';

interface PriorityCustomersProps {
  customers: Assignment[];
  loading: boolean;
  error: string | null;
  searchValue: string;
  searchLoading: boolean;
  onRefresh: () => void;
  onSearchChange: (value: string) => void;
  onSearch: () => void;
  onSearchKeyPress: (e: React.KeyboardEvent) => void;
}

const PriorityCustomers: React.FC<PriorityCustomersProps> = ({
  customers,
  loading,
  error,
  searchValue,
  searchLoading,
  onRefresh,
  onSearchChange,
  onSearch,
  onSearchKeyPress
}) => {
  const { t } = useTranslation(['dashboard', 'common', 'tables']);
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>{t('dashboard:messages.assigned_customers')}</CardTitle>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={onRefresh}>
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {t('common:buttons.refresh')}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex mb-4">
          <Input
            placeholder={t('dashboard:search.customers_placeholder')}
            className="flex-1 rounded-r-none"
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            onKeyDown={onSearchKeyPress}
            disabled={searchLoading}
          />
          <Button 
            className="rounded-l-none" 
            onClick={onSearch}
            disabled={searchLoading}
          >
            {searchLoading ? (
              <Spinner size="sm" />
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            )}
          </Button>
        </div>
        
        {error && (
          <Alert variant="danger" className="mb-4">
            {error}
          </Alert>
        )}

        <div className="max-h-96 overflow-y-auto overflow-x-auto">
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <Spinner size="lg" />
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-neutral-200">
                  <th className="text-left py-3 px-4 font-medium text-neutral-900">{t('tables:headers.cif')}</th>
                  <th className="text-left py-3 px-4 font-medium text-neutral-900">{t('tables:headers.name')}</th>
                  <th className="text-left py-3 px-4 font-medium text-neutral-900">{t('tables:headers.category')}</th>
                  <th className="text-left py-3 px-4 font-medium text-neutral-900">{t('tables:headers.status')}</th>
                  <th className="text-left py-3 px-4 font-medium text-neutral-900">{t('tables:headers.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {customers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-8 text-neutral-500">
                      {searchValue ? t('dashboard:messages.no_customers_found') : t('dashboard:messages.no_assigned_customers')}
                    </td>
                  </tr>
                ) : (
                  customers.map((assignment) => {
                    const customer = assignment.customer;
                    if (!customer) return null;
                    
                    // Helper function to get status badge variant
                    const getStatusBadgeVariant = (status: string) => {
                      const statusLower = status.toLowerCase();
                      if (statusLower === 'inactive') return 'danger';
                      if (statusLower === 'active') return 'success';
                      return 'neutral';
                    };
                    
                    return (
                      <tr key={assignment.id} className="border-b border-neutral-100 hover:bg-neutral-50">
                        <td className="py-3 px-4">{customer.cif}</td>
                        <td className="py-3 px-4">
                          <div className="flex items-center">
                            <Avatar
                              initials={(customer.name || customer.companyName || 'UK')
                                .split(' ')
                                .map((name: string) => name[0])
                                .join('')
                                .toUpperCase()
                                .slice(0, 2)}
                              size="sm"
                              className="mr-3"
                            />
                            {customer.name || customer.companyName || t('common:status.unknown')}
                          </div>
                        </td>
                        <td className="py-3 px-4">{customer.segment}</td>
                        <td className="py-3 px-4">
                          <Badge variant={getStatusBadgeVariant(customer.status)}>
                            {customer.status}
                          </Badge>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex gap-2">
                            <Link to={`/customers/${customer.cif}`}>
                              <Button size="sm" variant="primary">
                                {t('common:buttons.view')}
                              </Button>
                            </Link>
                          </div>
                        </td>
                      </tr>
                    );
                  }).filter(Boolean)
                )}
              </tbody>
            </table>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default PriorityCustomers;