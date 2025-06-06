import React, { useState, useMemo } from 'react';
import { Loan } from '../types';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../../components/ui/Table';
import LoanDetails from './LoanDetails';
import { useTranslation, useLocalization } from '../../../i18n/hooks/useTranslation';

interface LoanSummaryProps {
  loans: Loan[];
}

type SortField = 'outstanding' | 'dueAmount' | 'dpd' | 'nextPaymentDate' | 'productType';
type SortDirection = 'asc' | 'desc';

const LoanSummary: React.FC<LoanSummaryProps> = ({ loans }) => {
  const { t } = useTranslation(['customers']);
  const { formatDate: formatLocalizedDate, formatCurrency: formatLocalizedCurrency } = useLocalization();
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [selectedLoanAccount, setSelectedLoanAccount] = useState<string | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  
  // Helper function to format currency with localization
  const formatCurrency = (amount: number | string) => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    return formatLocalizedCurrency(numAmount || 0, 'VND');
  };

  // Helper function to format date with localization
  const formatDate = (dateString: string) => {
    return formatLocalizedDate(dateString, {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  // Helper function to get status badge variant
  const getStatusVariant = (dpd: number) => {
    if (dpd === 0) return 'success';
    if (dpd <= 30) return 'warning';
    return 'danger';
  };

  // Sorting function
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Sort loans based on current sort field and direction
  const sortedLoans = useMemo(() => {
    if (!sortField) return loans;

    return [...loans].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortField) {
        case 'outstanding':
          aValue = typeof a.outstanding === 'string' ? parseFloat(a.outstanding) || 0 : Number(a.outstanding) || 0;
          bValue = typeof b.outstanding === 'string' ? parseFloat(b.outstanding) || 0 : Number(b.outstanding) || 0;
          break;
        case 'dueAmount':
          aValue = typeof a.dueAmount === 'string' ? parseFloat(a.dueAmount) || 0 : Number(a.dueAmount) || 0;
          bValue = typeof b.dueAmount === 'string' ? parseFloat(b.dueAmount) || 0 : Number(b.dueAmount) || 0;
          break;
        case 'dpd':
          aValue = a.dpd;
          bValue = b.dpd;
          break;
        case 'nextPaymentDate':
          aValue = new Date(a.nextPaymentDate).getTime();
          bValue = new Date(b.nextPaymentDate).getTime();
          break;
        case 'productType':
          aValue = a.productType.toLowerCase();
          bValue = b.productType.toLowerCase();
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [loans, sortField, sortDirection]);

  // Calculate totals with proper null/undefined handling
  const totalOutstanding = loans.reduce((sum, loan) => {
    const outstanding = typeof loan.outstanding === 'string'
      ? parseFloat(loan.outstanding) || 0
      : Number(loan.outstanding) || 0;
    return sum + outstanding;
  }, 0);
  
  const totalDueAmount = loans.reduce((sum, loan) => {
    const dueAmount = typeof loan.dueAmount === 'string'
      ? parseFloat(loan.dueAmount) || 0
      : Number(loan.dueAmount) || 0;
    return sum + dueAmount;
  }, 0);

  // Helper function to render sort icon
  const renderSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <i className="bi bi-arrow-down-up text-neutral-400 ml-1"></i>;
    }
    return sortDirection === 'asc'
      ? <i className="bi bi-arrow-up text-blue-600 ml-1"></i>
      : <i className="bi bi-arrow-down text-blue-600 ml-1"></i>;
  };

  // Handle loan card click
  const handleLoanClick = (accountNumber: string) => {
    setSelectedLoanAccount(accountNumber);
    setIsDetailsModalOpen(true);
  };

  const handleCloseDetails = () => {
    setIsDetailsModalOpen(false);
    setSelectedLoanAccount(null);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>{t('customers:loan_summary.title')} ({t('customers:loan_summary.loans_count', { count: loans.length })})</CardTitle>
        <Button variant="secondary" size="sm">
          <i className="bi bi-graph-up mr-2"></i>
          {t('customers:loan_summary.analytics')}
        </Button>
      </CardHeader>
      
      <CardContent>
        <div className="max-h-96 overflow-y-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <button
                    onClick={() => handleSort('productType')}
                    className="text-left text-xs font-medium text-neutral-700 hover:text-blue-600 flex items-center"
                  >
                    {t('customers:loan_summary.product_type')}
                    {renderSortIcon('productType')}
                  </button>
                </TableHead>
                <TableHead>
                  <button
                    onClick={() => handleSort('outstanding')}
                    className="text-left text-xs font-medium text-neutral-700 hover:text-blue-600 flex items-center"
                  >
                    {t('customers:loan_summary.outstanding')}
                    {renderSortIcon('outstanding')}
                  </button>
                </TableHead>
                <TableHead>
                  <button
                    onClick={() => handleSort('dueAmount')}
                    className="text-left text-xs font-medium text-neutral-700 hover:text-blue-600 flex items-center"
                  >
                    {t('customers:loan_summary.due_amount')}
                    {renderSortIcon('dueAmount')}
                  </button>
                </TableHead>
                <TableHead>
                  <button
                    onClick={() => handleSort('dpd')}
                    className="text-left text-xs font-medium text-neutral-700 hover:text-blue-600 flex items-center"
                  >
                    {t('customers:loan_summary.dpd')}
                    {renderSortIcon('dpd')}
                  </button>
                </TableHead>
                <TableHead>
                  <button
                    onClick={() => handleSort('nextPaymentDate')}
                    className="text-left text-xs font-medium text-neutral-700 hover:text-blue-600 flex items-center"
                  >
                    {t('customers:loan_summary.next_payment')}
                    {renderSortIcon('nextPaymentDate')}
                  </button>
                </TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedLoans.map((loan, index) => (
                <TableRow
                  key={index}
                  clickable={true}
                  onClick={() => handleLoanClick(loan.accountNumber)}
                >
                  <TableCell className="whitespace-nowrap">
                    <div className="font-semibold text-primary-700">
                      {loan.productType}
                    </div>
                    <div className="text-sm text-neutral-600">
                      #{loan.accountNumber}
                    </div>
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-sm font-semibold">
                    {formatCurrency(loan.outstanding)}
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-sm font-semibold text-danger-600">
                    {formatCurrency(loan.dueAmount)}
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    <Badge variant={getStatusVariant(loan.dpd)}>
                      {loan.dpd === 0 ? t('customers:loan_summary.current') : `${loan.dpd} ${t('customers:loan_summary.dpd')}`}
                    </Badge>
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-sm font-semibold">
                    {formatDate(loan.nextPaymentDate)}
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    <i className="bi bi-chevron-right text-neutral-400"></i>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        
        {/* Totals Section */}
        {loans.length > 0 && (
          <div className="mt-4 pt-4 border-t border-neutral-200">
            <div className="grid grid-cols-5 p-3 bg-neutral-50 rounded-md">
              <div>
                <div className="text-xs text-neutral-500 mb-1">{t('customers:loan_summary.total_outstanding')}</div>
                <div className="font-bold text-lg">{formatCurrency(totalOutstanding)}</div>
              </div>
              <div>
                <div className="text-xs text-neutral-500 mb-1">{t('customers:loan_summary.total_due_amount')}</div>
                <div className="font-bold text-lg">{formatCurrency(totalDueAmount)}</div>
              </div>
              <div>
                <div className="text-xs text-neutral-500 mb-1">-</div>
                <div className="font-semibold">-</div>
              </div>
              <div>
                <div className="text-xs text-neutral-500 mb-1">-</div>
                <div className="font-semibold">-</div>
              </div>
              <div>
                <div className="text-xs text-neutral-500 mb-1">{t('customers:loan_summary.total_loans')}</div>
                <div className="font-bold text-lg">{loans.length}</div>
              </div>
            </div>
          </div>
        )}
      </CardContent>

      {/* Loan Details Modal */}
      {selectedLoanAccount && (
        <LoanDetails
          accountNumber={selectedLoanAccount}
          isOpen={isDetailsModalOpen}
          onClose={handleCloseDetails}
        />
      )}
    </Card>
  );
};

export default LoanSummary;