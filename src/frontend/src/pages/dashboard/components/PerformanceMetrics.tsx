import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Spinner } from '../../../components/ui/Spinner';
import { Alert } from '../../../components/ui/Alert';
import { formatCurrency } from '../../../services/api/dashboard.api';
import { actionsApi } from '../../../services/api/workflow/actions.api';
import { agentsApi } from '../../../services/api/workflow/agents.api';
import { useAuth } from '../../../hooks/useAuth';
import { CustomerAction } from '../../customers/types';

// Workflow-based performance metrics interface
interface WorkflowPerformanceMetrics {
  calls_made: number;
  successful_contacts: number;
  promises_to_pay: number;
  amount_promised: number;
  contact_rate: number;
  promise_rate: number;
}

interface PerformanceMetricsProps {
  onRefresh?: () => void;
}

const PerformanceMetrics: React.FC<PerformanceMetricsProps> = ({ onRefresh }) => {
  const { user } = useAuth();
  const [performance, setPerformance] = useState<WorkflowPerformanceMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const calculatePerformanceMetrics = (actions: CustomerAction[]): WorkflowPerformanceMetrics => {
    // Get today's date range
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

    // Filter actions for today
    const todayActions = actions.filter(action => {
      const actionDate = new Date(action.actionDate);
      return actionDate >= startOfDay && actionDate < endOfDay;
    });

    // Calculate metrics based on actions
    const totalActions = todayActions.length;
    
    // Count calls made (actions with call-related types)
    const callActions = todayActions.filter(action =>
      action.actionType?.code?.toLowerCase().includes('call') ||
      action.actionSubtype?.code?.toLowerCase().includes('call') ||
      action.actionType?.name?.toLowerCase().includes('call') ||
      action.actionSubtype?.name?.toLowerCase().includes('call')
    );
    const calls_made = callActions.length;

    // Count successful contacts (actions with successful results)
    const unsuccessfulContacts = todayActions.filter(action =>
      action.actionResult?.code?.toLowerCase().includes('no_contact')
    );
    const successful_contacts = calls_made - unsuccessfulContacts.length;

    // Count promises to pay (actions with promise results)
    const promiseActions = todayActions.filter(action =>
      action.actionResult?.code?.toLowerCase().includes('promise') ||
      action.actionResult?.name?.toLowerCase().includes('promise') ||
      action.actionResult?.code?.toLowerCase().includes('ptp') ||
      action.actionResult?.name?.toLowerCase().includes('ptp')
    );
    const promises_to_pay = promiseActions.length;

    // Calculate amount promised (this would need to be stored in action data)
    // For now, we'll use a placeholder calculation
    const amount_promised = promiseActions.reduce((total, action) => {
      // If promise amount is stored in the action, use it
      // Otherwise, estimate based on due amount or use 0
      return total + (action.dueAmount ? Number(action.dueAmount) * 0.5 : 0);
    }, 0);

    // Calculate rates
    const contact_rate = calls_made > 0 ? successful_contacts / calls_made : 0;
    const promise_rate = successful_contacts > 0 ? promises_to_pay / successful_contacts : 0;

    return {
      calls_made,
      successful_contacts,
      promises_to_pay,
      amount_promised,
      contact_rate,
      promise_rate
    };
  };

  const fetchPerformanceData = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      // Get agent info for current user
      const agentInfo = await agentsApi.getAgentByUserId(user.id);
      
      // Get today's date range for filtering
      const today = new Date();
      const startDate = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString();
      const endDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1).toISOString();

      // Fetch agent actions for today
      const actionsResponse = await actionsApi.getAgentActions(agentInfo.id, {
        startDate,
        endDate,
        pageSize: 500 // Get all actions for today
      });

      // Calculate performance metrics from actions
      const metrics = calculatePerformanceMetrics(actionsResponse.actions);
      setPerformance(metrics);
    } catch (err) {
      console.error('Failed to fetch performance data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load performance data');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    fetchPerformanceData();
    onRefresh?.();
  };

  useEffect(() => {
    fetchPerformanceData();
  }, [user]);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Today's Performance</CardTitle>
        <Button variant="secondary" size="sm" onClick={handleRefresh}>
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