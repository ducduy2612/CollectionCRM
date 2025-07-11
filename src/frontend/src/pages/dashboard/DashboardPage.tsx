import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useNamespacedTranslation } from '../../i18n';
import {
  workflowApi,
  Assignment
} from '../../services/api/workflow.api';
import { bankApi } from '../../services/api/bank.api';
import { CustomerAction } from '../customers/types';
import {
  PerformanceMetrics,
  PriorityCustomers,
  RecentActivities
} from './components';

const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const { t } = useNamespacedTranslation('dashboard');
  
  // State for assigned customers
  const [assignedCustomers, setAssignedCustomers] = useState<Assignment[]>([]);
  const [customersLoading, setCustomersLoading] = useState(true);
  const [customersError, setCustomersError] = useState<string | null>(null);
  const [customerSearch, setCustomerSearch] = useState('');
  const [customerSearchLoading, setCustomerSearchLoading] = useState(false);
  
  // State for recent activities
  const [recentActivities, setRecentActivities] = useState<CustomerAction[]>([]);
  const [activitiesLoading, setActivitiesLoading] = useState(true);
  const [activitiesError, setActivitiesError] = useState<string | null>(null);
  const [activitiesPagination, setActivitiesPagination] = useState({
    page: 1,
    pageSize: 10,
    totalPages: 1,
    totalItems: 0
  });
  
  // State for agent info (to avoid duplicate API calls)
  const [agentId, setAgentId] = useState<string | null>(null);

  // Load agent information
  const loadAgentInfo = async () => {
    try {
      if (!user?.id) {
        throw new Error('User not authenticated');
      }
      
      // Get the agent ID from user ID
      const agent = await workflowApi.getAgentByUserId(user.id);
      setAgentId(agent.id);
      return agent.id;
    } catch (error) {
      console.error('Failed to load agent info:', error);
      throw error;
    }
  };

  // Load assigned customers
  const loadAssignedCustomers = async (search?: string, currentAgentId?: string) => {
    try {
      if (search !== undefined) {
        setCustomerSearchLoading(true);
      } else {
        setCustomersLoading(true);
      }
      setCustomersError(null);
      
      // Use provided agent ID or get from state
      const agentIdToUse = currentAgentId || agentId;
      if (!agentIdToUse) {
        throw new Error('Agent ID not available');
      }
      
      // Get the agent's assignments (remove pageSize limit to get all)
      const assignmentData = await workflowApi.getAgentAssignments(agentIdToUse, {
        cif: search || undefined,
        isCurrent: true,
        pageSize: 100 // Increased to capture all assignments
      });
      
      if (assignmentData.assignments.length === 0) {
        setAssignedCustomers([]);
        return;
      }
      
      // Extract all CIFs from assignments
      const cifs = assignmentData.assignments.map(assignment => assignment.cif);
      console.log(`Found ${assignmentData.assignments.length} assignments with CIFs:`, cifs);
      
      // Get customer data for all CIFs in one efficient API call
      const customers = await bankApi.getCustomersByCifs(cifs);
      console.log(`Successfully fetched ${customers.length} customer records out of ${cifs.length} CIFs`);
      
      // Create a map of CIF to customer data for quick lookup
      const customerMap = new Map();
      customers.forEach(customer => {
        if (customer.cif) {
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
  const loadRecentActivities = async (currentAgentId?: string, page: number = 1) => {
    try {
      setActivitiesLoading(true);
      setActivitiesError(null);
      
      // Use provided agent ID or get from state
      const agentIdToUse = currentAgentId || agentId;
      if (!agentIdToUse) {
        throw new Error('Agent ID not available');
      }
      
      // Get the agent's recent actions
      const actionsData = await workflowApi.getAgentActions(agentIdToUse, {
        pageSize: 10,
        page: page
      });
      
      setRecentActivities(actionsData.actions);
      setActivitiesPagination(actionsData.pagination);
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

  // Handle activities page change
  const handleActivitiesPageChange = (page: number) => {
    loadRecentActivities(agentId || undefined, page);
  };

  // Load all data on component mount
  useEffect(() => {
    const initializeDashboard = async () => {
      try {
        // Load agent info first, then use it for other calls
        const currentAgentId = await loadAgentInfo();
        
        // Load data that depends on agent ID
        loadAssignedCustomers(undefined, currentAgentId);
        loadRecentActivities(currentAgentId);
      } catch (error) {
        console.error('Failed to initialize dashboard:', error);
      }
    };
    
    initializeDashboard();
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
      <PerformanceMetrics />

      {/* Assigned Customers */}
      <PriorityCustomers
        customers={assignedCustomers}
        loading={customersLoading}
        error={customersError}
        searchValue={customerSearch}
        searchLoading={customerSearchLoading}
        onRefresh={() => loadAssignedCustomers(undefined, agentId || undefined)}
        onSearchChange={handleCustomerSearchChange}
        onSearch={handleCustomerSearch}
        onSearchKeyPress={handleSearchKeyPress}
      />

      {/* Recent Activities */}
      <RecentActivities
        activities={recentActivities}
        loading={activitiesLoading}
        error={activitiesError}
        pagination={activitiesPagination}
        onRefresh={() => loadRecentActivities(agentId || undefined)}
        onPageChange={handleActivitiesPageChange}
      />
    </div>
  );
};

export default DashboardPage;