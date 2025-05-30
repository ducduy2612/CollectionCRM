import React, { useState, useEffect } from 'react';
import { Loan, DueSegmentation } from '../types';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { Modal } from '../../../components/ui/Modal';
import { Spinner } from '../../../components/ui/Spinner';
import { bankApi } from '../../../services/api/bank.api';

interface LoanDetailsProps {
  accountNumber: string;
  isOpen: boolean;
  onClose: () => void;
}

const LoanDetails: React.FC<LoanDetailsProps> = ({ accountNumber, isOpen, onClose }) => {
  const [loan, setLoan] = useState<Loan | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Helper function to format currency
  const formatCurrency = (amount: number | string) => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      maximumFractionDigits: 0
    }).format(numAmount || 0);
  };

  // Helper function to format percentage
  const formatPercentage = (rate: string | number) => {
    const numRate = typeof rate === 'string' ? parseFloat(rate) : rate;
    return `${numRate?.toFixed(2)}%`;
  };

  // Helper function to get status badge variant
  const getStatusVariant = (dpd: number) => {
    if (dpd === 0) return 'success';
    if (dpd <= 30) return 'warning';
    return 'danger';
  };

  // Helper function to get loan status badge variant
  const getLoanStatusVariant = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'OPEN':
        return 'success';
      case 'CLOSED':
        return 'secondary';
      default:
        return 'warning';
    }
  };

  // Fetch loan details
  const fetchLoanDetails = async () => {
    if (!accountNumber) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const loanData = await bankApi.getLoan(accountNumber);
      setLoan(loanData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch loan details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && accountNumber) {
      fetchLoanDetails();
    }
  }, [isOpen, accountNumber]);

  const renderDueSegmentations = () => {
    if (!loan?.dueSegmentations || loan.dueSegmentations.length === 0) {
      return (
        <div className="text-center py-4 text-neutral-500">
          No due segmentations available
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {loan.dueSegmentations.map((segment, index) => (
          <div key={segment.id || index} className="border rounded-md p-3 bg-neutral-50">
            <div className="flex justify-between items-center mb-2">
              <span className="font-medium text-sm">Due Date: {new Date(segment.dueDate).toLocaleDateString()}</span>
              <span className="text-xs text-neutral-500">
                Total: {formatCurrency(
                  (parseFloat(segment.principalAmount) || 0) +
                  (parseFloat(segment.interestAmount) || 0) +
                  (parseFloat(segment.feesAmount) || 0) +
                  (parseFloat(segment.penaltyAmount) || 0)
                )}
              </span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              <div>
                <span className="text-neutral-500">Principal:</span>
                <div className="font-medium">{formatCurrency(segment.principalAmount)}</div>
              </div>
              <div>
                <span className="text-neutral-500">Interest:</span>
                <div className="font-medium">{formatCurrency(segment.interestAmount)}</div>
              </div>
              <div>
                <span className="text-neutral-500">Fees:</span>
                <div className="font-medium">{formatCurrency(segment.feesAmount)}</div>
              </div>
              <div>
                <span className="text-neutral-500">Penalty:</span>
                <div className="font-medium">{formatCurrency(segment.penaltyAmount)}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">Loan Details</h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <i className="bi bi-x-lg"></i>
          </Button>
        </div>

        {loading && (
          <div className="flex justify-center py-8">
            <Spinner size="lg" />
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
            <div className="flex items-center">
              <i className="bi bi-exclamation-triangle text-red-500 mr-2"></i>
              <span className="text-red-700">{error}</span>
            </div>
          </div>
        )}

        {loan && !loading && (
          <div className="space-y-6">
            {/* Loan Header */}
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="text-lg">
                    {loan.productType} #{loan.accountNumber}
                  </CardTitle>
                  <div className="flex gap-2">
                    <Badge variant={getStatusVariant(loan.dpd)}>
                      {loan.dpd === 0 ? 'Current' : `${loan.dpd} DPD`}
                    </Badge>
                    {loan.status && (
                      <Badge variant={getLoanStatusVariant(loan.status)}>
                        {loan.status}
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <span className="text-sm text-neutral-500">Outstanding Balance</span>
                    <div className="text-xl font-bold text-red-600">
                      {formatCurrency(loan.outstanding)}
                    </div>
                  </div>
                  <div>
                    <span className="text-sm text-neutral-500">Due Amount</span>
                    <div className="text-xl font-bold text-orange-600">
                      {formatCurrency(loan.dueAmount)}
                    </div>
                  </div>
                  <div>
                    <span className="text-sm text-neutral-500">Original Amount</span>
                    <div className="text-xl font-bold text-blue-600">
                      {formatCurrency(loan.originalAmount)}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Loan Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Loan Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div>
                      <span className="text-sm text-neutral-500">Product Type</span>
                      <div className="font-medium">{loan.productType}</div>
                    </div>
                    <div>
                      <span className="text-sm text-neutral-500">Currency</span>
                      <div className="font-medium">{loan.currency || 'N/A'}</div>
                    </div>
                    <div>
                      <span className="text-sm text-neutral-500">Interest Rate</span>
                      <div className="font-medium">
                        {loan.interestRate ? formatPercentage(loan.interestRate) : 'N/A'}
                      </div>
                    </div>
                    <div>
                      <span className="text-sm text-neutral-500">Term</span>
                      <div className="font-medium">{loan.term ? `${loan.term} months` : 'N/A'}</div>
                    </div>
                    <div>
                      <span className="text-sm text-neutral-500">Payment Frequency</span>
                      <div className="font-medium">{loan.paymentFrequency || 'N/A'}</div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <span className="text-sm text-neutral-500">Disbursement Date</span>
                      <div className="font-medium">
                        {loan.disbursementDate ? new Date(loan.disbursementDate).toLocaleDateString() : 'N/A'}
                      </div>
                    </div>
                    <div>
                      <span className="text-sm text-neutral-500">Maturity Date</span>
                      <div className="font-medium">
                        {loan.maturityDate ? new Date(loan.maturityDate).toLocaleDateString() : 'N/A'}
                      </div>
                    </div>
                    <div>
                      <span className="text-sm text-neutral-500">Next Payment Date</span>
                      <div className="font-medium">
                        {new Date(loan.nextPaymentDate).toLocaleDateString()}
                      </div>
                    </div>
                    <div>
                      <span className="text-sm text-neutral-500">Remaining Amount</span>
                      <div className="font-medium">
                        {loan.remainingAmount ? formatCurrency(loan.remainingAmount) : 'N/A'}
                      </div>
                    </div>
                    <div>
                      <span className="text-sm text-neutral-500">Delinquency Status</span>
                      <div className="font-medium">{loan.delinquencyStatus}</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Due Segmentations */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Due Segmentations</CardTitle>
              </CardHeader>
              <CardContent>
                {renderDueSegmentations()}
              </CardContent>
            </Card>

            {/* System Information */}
            {(loan.sourceSystem || loan.createdAt) && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">System Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    {loan.sourceSystem && (
                      <div>
                        <span className="text-neutral-500">Source System</span>
                        <div className="font-medium">{loan.sourceSystem}</div>
                      </div>
                    )}
                    {loan.createdAt && (
                      <div>
                        <span className="text-neutral-500">Created At</span>
                        <div className="font-medium">
                          {new Date(loan.createdAt).toLocaleString()}
                        </div>
                      </div>
                    )}
                    {loan.updatedAt && (
                      <div>
                        <span className="text-neutral-500">Updated At</span>
                        <div className="font-medium">
                          {new Date(loan.updatedAt).toLocaleString()}
                        </div>
                      </div>
                    )}
                    {loan.lastSyncedAt && (
                      <div>
                        <span className="text-neutral-500">Last Synced</span>
                        <div className="font-medium">
                          {new Date(loan.lastSyncedAt).toLocaleString()}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
};

export default LoanDetails;