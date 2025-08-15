import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { Avatar } from '../../../components/ui/Avatar';
import { Spinner } from '../../../components/ui/Spinner';
import { Alert } from '../../../components/ui/Alert';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../../components/ui/Table';
import { CustomerAction } from '../../../pages/customers/types';
import { useTranslation, useLocalization } from '../../../i18n/hooks/useTranslation';

interface RecentActivitiesProps {
  activities: CustomerAction[];
  loading: boolean;
  error: string | null;
  pagination: {
    page: number;
    pageSize: number;
    totalPages: number;
    totalItems: number;
  };
  onRefresh: () => void;
  onPageChange: (page: number) => void;
}

const RecentActivities: React.FC<RecentActivitiesProps> = ({
  activities,
  loading,
  error,
  pagination,
  onRefresh,
  onPageChange
}) => {
  const { t } = useTranslation(['dashboard', 'common']);
  const { formatDate: formatLocalizedDate } = useLocalization();

  // Helper function to format date with localization
  const formatDateTime = (dateString: string) => {
    return formatLocalizedDate(dateString, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  // Helper function to get action type icon
  const getActionTypeIcon = (type: string) => {
    switch (type) {
      case 'CALL': return 'bi-telephone';
      case 'SMS': return 'bi-chat';
      case 'EMAIL': return 'bi-envelope';
      case 'VISIT': return 'bi-geo-alt';
      case 'PAYMENT': return 'bi-cash-coin';
      case 'NOTE': return 'bi-journal-text';
      default: return 'bi-info-circle';
    }
  };

  // Helper function to get badge variant for action type
  const getActionBadgeVariant = (type: string): 'primary' | 'secondary' | 'info' | 'warning' | 'success' | 'danger' | 'neutral' => {
    switch (type) {
      case 'CALL': return 'primary';
      case 'SMS': return 'secondary';
      case 'EMAIL': return 'info';
      case 'VISIT': return 'warning';
      case 'PAYMENT': return 'success';
      case 'NOTE': return 'neutral';
      default: return 'neutral';
    }
  };

  // Helper function to get badge variant for result
  const getResultBadgeVariant = (result: string | undefined): 'primary' | 'secondary' | 'info' | 'warning' | 'success' | 'danger' | 'neutral' => {
    if (!result) {
      return 'neutral';
    }
    if (result.includes('SUCCESS') || result.includes('PROMISE') || result.includes('COMPLETED')) {
      return 'success';
    }
    if (result.includes('FAIL') || result.includes('NO ANSWER') || result.includes('REJECTED')) {
      return 'danger';
    }
    return 'secondary';
  };

  // Helper function to generate customer initials
  const getCustomerInitials = (cif: string) => {
    return cif.slice(-2).toUpperCase();
  };

  // Helper function to format currency with localization
  const formatCurrency = (amount: number | string) => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(numAmount || 0).replace('₫', '₫');
  };

  // Helper function to get DPD badge variant
  const getDpdBadgeVariant = (dpd: number): 'primary' | 'secondary' | 'info' | 'warning' | 'success' | 'danger' | 'neutral' => {
    if (dpd === 0) return 'success';
    if (dpd <= 30) return 'warning';
    return 'danger';
  };

  // Generate page numbers for pagination
  const generatePageNumbers = () => {
    const totalPages = pagination.totalPages || 1;
    const currentPage = pagination.page || 1;
    const pages = [];
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      const startPage = Math.max(1, currentPage - 2);
      const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
      
      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }
    }
    
    return pages;
  };

  const totalPages = pagination.totalPages || 1;
  const totalItems = pagination.totalItems || 0;
  const currentPage = pagination.page || 1;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>{t('dashboard:messages.recent_activities')}</CardTitle>
        <Button variant="secondary" size="sm" onClick={onRefresh}>
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          {t('common:buttons.refresh')}
        </Button>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="danger" className="mb-4">
            {error}
          </Alert>
        )}

        {loading ? (
          <div className="flex justify-center py-8">
            <Spinner size="md" />
          </div>
        ) : (
          <>
            {activities.length === 0 ? (
              <div className="text-center py-8 text-neutral-500">
                {t('dashboard:messages.no_recent_activities')}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="max-h-96 overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>
                          <span className="text-xs font-medium text-neutral-700">
                            {t('tables:headers.action_type')}
                          </span>
                        </TableHead>
                        <TableHead>
                          <span className="text-xs font-medium text-neutral-700">
                            {t('tables:headers.date')}
                          </span>
                        </TableHead>
                        <TableHead>
                          <span className="text-xs font-medium text-neutral-700">
                            {t('tables:headers.customer')}
                          </span>
                        </TableHead>
                        <TableHead>
                          <span className="text-xs font-medium text-neutral-700">
                            {t('tables:headers.loan_account_number')}
                          </span>
                        </TableHead>
                        <TableHead>
                          <span className="text-xs font-medium text-neutral-700">
                            {t('tables:headers.amount')}
                          </span>
                        </TableHead>
                        <TableHead>
                          <span className="text-xs font-medium text-neutral-700">
                            {t('tables:headers.delinquency_days')}
                          </span>
                        </TableHead>
                        <TableHead>
                          <span className="text-xs font-medium text-neutral-700">
                            {t('tables:headers.result')}
                          </span>
                        </TableHead>
                        <TableHead>{t('tables:headers.notes')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {activities.map((activity, index) => (
                        <TableRow key={activity.id || index}>
                          <TableCell className="whitespace-nowrap">
                            <div className="flex items-center">
                              <i className={`bi ${getActionTypeIcon(activity.actionType?.code || '')} mr-2 text-primary-600`}></i>
                              <div>
                                <Badge variant={getActionBadgeVariant(activity.actionType?.code || '')}>
                                  {activity.actionType?.name || activity.actionType?.code || t('common:status.unknown')}
                                </Badge>
                                {activity.actionSubtype && (
                                  <div className="text-xs text-neutral-600 mt-1">
                                    {activity.actionSubtype.name || activity.actionSubtype.code}
                                  </div>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="whitespace-nowrap text-sm text-neutral-900">
                            {formatDateTime(activity.actionDate || activity.createdAt)}
                          </TableCell>
                          <TableCell className="whitespace-nowrap text-sm">
                            <div className="flex items-center">
                              <Avatar initials={getCustomerInitials(activity.cif)} size="sm" className="mr-2" />
                              <span className="font-semibold text-primary-700">{activity.cif}</span>
                            </div>
                          </TableCell>
                          <TableCell className="whitespace-nowrap text-sm">
                            {activity.loanAccountNumber ? (
                              <span className="font-semibold text-primary-700">{activity.loanAccountNumber}</span>
                            ) : (
                              <span className="text-neutral-400">-</span>
                            )}
                          </TableCell>
                          <TableCell className="whitespace-nowrap text-sm">
                            {activity.dueAmount !== undefined && activity.dueAmount !== null ? (
                              <span className="font-semibold text-danger-600">
                                {formatCurrency(activity.dueAmount)}
                              </span>
                            ) : (
                              <span className="text-neutral-400">-</span>
                            )}
                          </TableCell>
                          <TableCell className="whitespace-nowrap">
                            {activity.dpd !== undefined && activity.dpd !== null ? (
                              <Badge variant={getDpdBadgeVariant(activity.dpd)}>
                                {activity.dpd} {t('common:time.days')}
                              </Badge>
                            ) : (
                              <span className="text-neutral-400">-</span>
                            )}
                          </TableCell>
                          <TableCell className="whitespace-nowrap">
                            {activity.actionResult ? (
                              <Badge variant={getResultBadgeVariant(activity.actionResult.code)}>
                                {activity.actionResult.name || activity.actionResult.code}
                              </Badge>
                            ) : (
                              <span className="text-neutral-400">-</span>
                            )}
                          </TableCell>
                          <TableCell className="text-sm text-neutral-700 max-w-xs">
                            <div className="truncate" title={activity.notes || t('customers:messages.no_notes')}>
                              {activity.notes || t('customers:messages.no_notes')}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                
                {totalPages > 1 && (
                  <div className="flex flex-col items-center space-y-2 pt-4 border-t">
                    <div className="text-sm text-neutral-600">
                      {t('tables:pagination.showing')} {activities.length} {t('customers:titles.actions')}
                      {totalItems > 0 && ` (${totalItems} ${t('tables:pagination.total')})`}
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => onPageChange(currentPage - 1)}
                        disabled={currentPage === 1 || loading}
                      >
                        <i className="bi bi-chevron-left mr-1"></i>
                        {t('tables:pagination.previous')}
                      </Button>
                      
                      {generatePageNumbers().map((pageNum) => (
                        <Button
                          key={pageNum}
                          variant={pageNum === currentPage ? "primary" : "secondary"}
                          size="sm"
                          onClick={() => onPageChange(pageNum)}
                          disabled={loading}
                          className="min-w-[2rem]"
                        >
                          {pageNum}
                        </Button>
                      ))}
                      
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => onPageChange(currentPage + 1)}
                        disabled={currentPage === totalPages || loading}
                      >
                        {t('tables:pagination.next')}
                        <i className="bi bi-chevron-right ml-1"></i>
                      </Button>
                    </div>
                    <div className="text-xs text-neutral-500">
                      {t('tables:pagination.page')} {currentPage} {t('tables:pagination.of')} {totalPages}
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default RecentActivities;