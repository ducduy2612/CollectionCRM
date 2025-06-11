import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useNamespacedTranslation } from '../../i18n';
import {
  dashboardApi,
  DashboardPerformance,
  RecentActivity
} from '../../services/api/dashboard.api';
import {
  workflowApi,
  Assignment
} from '../../services/api/workflow.api';
import { bankApi } from '../../services/api/bank.api';
import {
  PerformanceMetrics,
  PriorityCustomers,
  RecentActivities
} from './components';

const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const { t } = useNamespacedTranslation('dashboard');
  
  // State for performance metrics
  const [performance, setPerformance] = useState<DashboardPerformance | null>(null);
  const [performanceLoading, setPerformanceLoading] = useState(true);
  const [performanceError, setPerformanceError] = useState<string | null>(null);
  
  // State for assigned customers
  const [assignedCustomers, setAssignedCustomers] = useState<Assignment[]>([]);
  const [customersLoading, setCustomersLoading] = useState(true);
  const [customersError, setCustomersError] = useState<string | null>(null);
  const [customerSearch, setCustomerSearch] = useState('');
  const [customerSearchLoading, setCustomerSearchLoading] = useState(false);
  
  // State for recent activities
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [activitiesLoading, setActivitiesLoading] = useState(true);
  const [activitiesError, setActivitiesError] = useState<string | null>(null);

  // Load dashboard performance metrics
  const loadPerformanceMetrics = async () => {
    try {
      setPerformanceLoading(true);
      setPerformanceError(null);
      const data = await dashboardApi.getDashboardPerformance();
      setPerformance(data);
    } catch (error) {
      console.error('Failed to load performance metrics:', error);
      setPerformanceError('Failed to load performance metrics. Please try again.');
    } finally {
      setPerformanceLoading(false);
    }
  };

  // Load assigned customers
  const loadAssignedCustomers = async (search?: string) => {
    try {
      if (search !== undefined) {
        setCustomerSearchLoading(true);
      } else {
        setCustomersLoading(true);
      }
      setCustomersError(null);
      
      // Get current user's agent ID
      if (!user?.id) {
        throw new Error('User not authenticated');
      }
      
      // First get the agent ID from user ID
      const agent = await workflowApi.getAgentByUserId(user.id);
      
      // Then get the agent's assignments
      const assignmentData = await workflowApi.getAgentAssignments(agent.id, {
        cif: search || undefined,
        isCurrent: true,
        pageSize: 10
      });
      
      if (assignmentData.assignments.length === 0) {
        setAssignedCustomers([]);
        return;
      }
      
      // Extract all CIFs from assignments
      const cifs = assignmentData.assignments.map(assignment => assignment.cif);
      
      // Use searchCustomers to get all customer data in one call
      // We'll search by CIF using the first CIF and then filter the results
      const customerSearchResults = await bankApi.searchCustomers({
        pageSize: 100 // Get more results to ensure we capture all customers
      });
      
      // Create a map of CIF to customer data for quick lookup
      const customerMap = new Map();
      customerSearchResults.customers.forEach(customer => {
        if (customer.cif && cifs.includes(customer.cif)) {
          customerMap.set(customer.cif, customer);
        }
      });
      
      // Combine assignments with customer data
      const assignmentsWithCustomers: Assignment[] = assignmentData.assignments.map(assignment => {
        const customer = customerMap.get(assignment.cif);
        if (customer) {
          return {
            ...assignment,
            customer: {
              cif: customer.cif,
              name: customer.name,
              companyName: customer.companyName,
              segment: customer.segment || 'Unknown',
              status: customer.status || 'Unknown'
            }
          };
        }
        return assignment;
      });
      
      setAssignedCustomers(assignmentsWithCustomers);
    } catch (error) {
      console.error('Failed to load assigned customers:', error);
      setCustomersError('Failed to load assigned customers. Please try again.');
    } finally {
      setCustomersLoading(false);
      setCustomerSearchLoading(false);
    }
  };

  // Load recent activities
  const loadRecentActivities = async () => {
    try {
      setActivitiesLoading(true);
      setActivitiesError(null);
      const data = await dashboardApi.getRecentActivities({ limit: 10 });
      setRecentActivities(data);
    } catch (error) {
      console.error('Failed to load recent activities:', error);
      setActivitiesError('Failed to load recent activities. Please try again.');
    } finally {
      setActivitiesLoading(false);
    }
  };

  // Handle customer search
  const handleCustomerSearch = () => {
    loadAssignedCustomers(customerSearch);
  };

  // Handle search input key press
  const handleSearchKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleCustomerSearch();
    }
  };

  // Handle customer search input change
  const handleCustomerSearchChange = (value: string) => {
    setCustomerSearch(value);
  };

  // Load all data on component mount
  useEffect(() => {
    loadPerformanceMetrics();
    loadAssignedCustomers();
    loadRecentActivities();
  }, []);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-neutral-900">
          Agent Dashboard
          {user && <span className="text-lg font-normal text-neutral-600 ml-2">- {user.name}</span>}
        </h1>
      </div>

      {/* Performance Summary */}
      <PerformanceMetrics
        performance={performance}
        loading={performanceLoading}
        error={performanceError}
        onRefresh={loadPerformanceMetrics}
      />

      {/* Assigned Customers */}
      <PriorityCustomers
        customers={assignedCustomers}
        loading={customersLoading}
        error={customersError}
        searchValue={customerSearch}
        searchLoading={customerSearchLoading}
        onRefresh={() => loadAssignedCustomers()}
        onSearchChange={handleCustomerSearchChange}
        onSearch={handleCustomerSearch}
        onSearchKeyPress={handleSearchKeyPress}
      />

      {/* Recent Activities */}
      <RecentActivities
        activities={recentActivities}
        loading={activitiesLoading}
        error={activitiesError}
        onRefresh={loadRecentActivities}
      />
    </div>
  );
};

export default DashboardPage;