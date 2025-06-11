import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Spinner } from '../../../components/ui/Spinner';
import { Alert } from '../../../components/ui/Alert';
import { DashboardPerformance, formatCurrency } from '../../../services/api/dashboard.api';

interface PerformanceMetricsProps {
  performance: DashboardPerformance | null;
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
}

const PerformanceMetrics: React.FC<PerformanceMetricsProps> = ({
  performance,
  loading,
  error,
  onRefresh
}) => {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Today's Performance</CardTitle>
        <Button variant="secondary" size="sm" onClick={onRefresh}>
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </Button>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center items-center py-8">
            <Spinner size="lg" />
          </div>
        ) : error ? (
          <Alert variant="danger" className="mb-4">
            {error}
          </Alert>
        ) : performance ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="text-center p-4 bg-neutral-50 rounded-lg">
              <div className="text-2xl font-bold text-primary-600 mb-1">{performance.calls_made}</div>
              <div className="text-sm text-neutral-600">Calls Made</div>
            </div>
            <div className="text-center p-4 bg-neutral-50 rounded-lg">
              <div className="text-2xl font-bold text-primary-600 mb-1">{performance.successful_contacts}</div>
              <div className="text-sm text-neutral-600">Successful Contacts</div>
            </div>
            <div className="text-center p-4 bg-neutral-50 rounded-lg">
              <div className="text-2xl font-bold text-primary-600 mb-1">{performance.promises_to_pay}</div>
              <div className="text-sm text-neutral-600">Promises to Pay</div>
            </div>
            <div className="text-center p-4 bg-neutral-50 rounded-lg">
              <div className="text-2xl font-bold text-primary-600 mb-1">{formatCurrency(performance.amount_promised)}</div>
              <div className="text-sm text-neutral-600">Amount Promised</div>
            </div>
            <div className="text-center p-4 bg-neutral-50 rounded-lg">
              <div className="text-2xl font-bold text-primary-600 mb-1">{Math.round(performance.contact_rate * 100)}%</div>
              <div className="text-sm text-neutral-600">Contact Rate</div>
            </div>
            <div className="text-center p-4 bg-neutral-50 rounded-lg">
              <div className="text-2xl font-bold text-primary-600 mb-1">{Math.round(performance.promise_rate * 100)}%</div>
              <div className="text-sm text-neutral-600">Promise Rate</div>
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
};

export default PerformanceMetrics;