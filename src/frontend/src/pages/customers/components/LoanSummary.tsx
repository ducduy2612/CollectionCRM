import React, { useState, useMemo } from 'react';
import { Loan } from '../types';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import LoanDetails from './LoanDetails';

interface LoanSummaryProps {
  loans: Loan[];
}

type SortField = 'outstanding' | 'dueAmount' | 'dpd' | 'nextPaymentDate' | 'productType';
type SortDirection = 'asc' | 'desc';

const LoanSummary: React.FC<LoanSummaryProps> = ({ loans }) => {
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [selectedLoanAccount, setSelectedLoanAccount] = useState<string | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  // Helper function to format currency
  const formatCurrency = (amount: number | string) => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      maximumFractionDigits: 0
    }).format(numAmount || 0);
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
        <CardTitle>Loan Summary ({loans.length} loans)</CardTitle>
        <Button variant="secondary" size="sm">
          <i className="bi bi-graph-up mr-2"></i>
          Analytics
        </Button>
      </CardHeader>
      
      <CardContent>
        {/* Sortable Column Headers */}
        <div className="grid grid-cols-5 p-3 bg-neutral-100 border rounded-md mb-4">
          <button
            onClick={() => handleSort('outstanding')}
            className="text-left text-xs font-medium text-neutral-700 hover:text-blue-600 flex items-center"
          >
            Outstanding
            {renderSortIcon('outstanding')}
          </button>
          <button
            onClick={() => handleSort('dueAmount')}
            className="text-left text-xs font-medium text-neutral-700 hover:text-blue-600 flex items-center"
          >
            Due Amount
            {renderSortIcon('dueAmount')}
          </button>
          <button
            onClick={() => handleSort('dpd')}
            className="text-left text-xs font-medium text-neutral-700 hover:text-blue-600 flex items-center"
          >
            DPD
            {renderSortIcon('dpd')}
          </button>
          <button
            onClick={() => handleSort('nextPaymentDate')}
            className="text-left text-xs font-medium text-neutral-700 hover:text-blue-600 flex items-center"
          >
            Next Payment
            {renderSortIcon('nextPaymentDate')}
          </button>
          <button
            onClick={() => handleSort('productType')}
            className="text-left text-xs font-medium text-neutral-700 hover:text-blue-600 flex items-center"
          >
            Product Type
            {renderSortIcon('productType')}
          </button>
        </div>

        <div className="max-h-96 overflow-y-auto pr-2">
          {sortedLoans.map((loan, index) => (
            <div
              key={index}
              className="mb-4 border rounded-md overflow-hidden cursor-pointer hover:shadow-md hover:border-blue-300 transition-all duration-200"
              onClick={() => handleLoanClick(loan.accountNumber)}
            >
              <div className="flex justify-between items-center p-3 bg-neutral-50 border-b border-neutral-200">
                <div className="font-semibold">{loan.productType} #{loan.accountNumber}</div>
                <div className="flex items-center gap-2">
                  <Badge variant={getStatusVariant(loan.dpd)}>
                    {loan.dpd === 0 ? 'Current' : `${loan.dpd} DPD`}
                  </Badge>
                  <i className="bi bi-chevron-right text-neutral-400"></i>
                </div>
              </div>
              <div className="grid grid-cols-5 p-3">
                <div>
                  <div className="font-semibold">{formatCurrency(loan.outstanding)}</div>
                </div>
                <div>
                  <div className="font-semibold">{formatCurrency(loan.dueAmount)}</div>
                </div>
                <div>
                  <div className="font-semibold">{loan.dpd}</div>
                </div>
                <div>
                  <div className="font-semibold">{new Date(loan.nextPaymentDate).toLocaleDateString()}</div>
                </div>
                <div>
                  <div className="font-semibold">{loan.productType}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {/* Totals Section */}
        {loans.length > 0 && (
          <div className="mt-4 pt-4 border-t border-neutral-200">
            <div className="grid grid-cols-5 p-3 bg-neutral-50 rounded-md">
              <div>
                <div className="text-xs text-neutral-500 mb-1">Total Outstanding</div>
                <div className="font-bold text-lg">{formatCurrency(totalOutstanding)}</div>
              </div>
              <div>
                <div className="text-xs text-neutral-500 mb-1">Total Due Amount</div>
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
                <div className="text-xs text-neutral-500 mb-1">Total Loans</div>
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