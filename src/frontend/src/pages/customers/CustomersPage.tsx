import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Customer, Loan, CustomerAction, Payment, CustomerStatus } from './types';
import CustomerHeader from './components/CustomerHeader';
import CustomerTabs from './components/CustomerTabs';
import ContactInformation from './components/ContactInformation';
import LoanSummary from './components/LoanSummary';
import ActionHistory from './components/ActionHistory';
import PaymentHistory from './components/PaymentHistory';
import CustomerStatusComponent from './components/CustomerStatus';
import ActionPanel from './components/ActionPanel';
import CustomerList from './components/CustomerList';
import { bankApi } from '../../services/api/bank.api';
import { workflowApi } from '../../services/api/workflow.api';
import { Spinner } from '../../components/ui/Spinner';

const CustomersPage: React.FC = () => {
  const { cif } = useParams<{ cif: string }>();
  const navigate = useNavigate();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [customerStatus, setCustomerStatus] = useState<CustomerStatus>({
    customerStatus: 'UNCOOPERATIVE',
    collateralStatus: 'SECURED',
    processingState: 'FOLLOW_UP',
    lendingViolation: 'NONE',
    recoveryAbility: 'PARTIAL'
  });
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastContactDate, setLastContactDate] = useState<string | undefined>(undefined);

  useEffect(() => {
    const fetchCustomerData = async () => {
      if (!cif) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        // Fetch customer details
        const customerData = await bankApi.getCustomer(cif);
        setCustomer(customerData);

        // Set loans from customer data
        if (customerData.loans) {
          setLoans(customerData.loans);
        }

        // Last contact date will be set by ActionHistory component

        // Fetch customer case status
        // const statusData = await workflowApi.getCustomerCaseStatus(cif);
        
        // For payments, we would typically have an endpoint like /api/bank/customers/{cif}/payments
        // Since we don't have that in the swagger, we'll use mock data for now
        // In a real implementation, you would fetch this from the appropriate endpoint
        setPayments([
          { date: 'April 15, 2025', amount: 5000000, method: 'Bank Transfer' },
          { date: 'March 20, 2025', amount: 15000000, method: 'Cash' },
          { date: 'February 18, 2025', amount: 15000000, method: 'Bank Transfer' },
          { date: 'January 15, 2025', amount: 15000000, method: 'Bank Transfer' },
          { date: 'December 18, 2024', amount: 15000000, method: 'Cash' }
        ]);

      } catch (err) {
        console.error('Error fetching customer data:', err);
        setError('Failed to load customer data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchCustomerData();
  }, [cif]);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
  };

  const handleCustomerSelect = (selectedCif: string) => {
    navigate(`/customers/${selectedCif}`);
  };

  const handleActionRecorded = useCallback(async () => {
    if (!cif) return;
    
    try {
      // Refresh the ActionHistory component
      if ((window as any).refreshActionHistory) {
        (window as any).refreshActionHistory();
      }
    } catch (err) {
      console.error('Error refreshing actions:', err);
    }
  }, [cif]);

  const handleLastContactDateChange = useCallback((date: string | undefined) => {
    setLastContactDate(date);
  }, []);

  // Memoize the ActionHistory component to prevent unnecessary re-renders and API calls
  // This must be called before any early returns to follow Rules of Hooks
  const actionHistoryComponent = useMemo(() => (
    <ActionHistory
      cif={cif}
      onLastContactDateChange={handleLastContactDateChange}
    />
  ), [cif, handleLastContactDateChange]);

  // If no CIF is provided, show the customer list
  if (!cif) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-neutral-900">Customers</h1>
        <CustomerList onCustomerSelect={handleCustomerSelect} />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-md">
        <p>{error}</p>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded-md">
        <p>Customer not found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-24">
      {/* Customer Header */}
      <CustomerHeader
        customer={customer}
        onReferenceClick={() => setActiveTab('references')}
      />

      {/* Tabs */}
      <CustomerTabs activeTab={activeTab} onTabChange={handleTabChange} />

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-2 gap-6">
          {customer && <ContactInformation phones={customer.phones} emails={customer.emails} addresses={customer.addresses} />}
          {loans && loans.length > 0 && <LoanSummary loans={loans} />}
          {/* ActionHistory is rendered above and shown via CSS */}
          <div /> {/* Placeholder to maintain grid layout */}
          {payments && payments.length > 0 && <PaymentHistory payments={payments} />}
          <CustomerStatusComponent status={customerStatus} />
        </div>
      )}

      {activeTab === 'loans' && (
        <div className="space-y-6">
          {loans && loans.length > 0 && <LoanSummary loans={loans} />}
        </div>
      )}

      {activeTab === 'actions' && (
        <div className="space-y-6">
          {/* ActionHistory is rendered above and shown via CSS */}
        </div>
      )}

      {activeTab === 'payments' && (
        <div className="space-y-6">
          {payments && payments.length > 0 && <PaymentHistory payments={payments} />}
        </div>
      )}

      {activeTab === 'documents' && (
        <div className="bg-white rounded-lg border border-neutral-200 p-8 text-center">
          <p className="text-neutral-600">Documents tab - Under development</p>
        </div>
      )}

      {activeTab === 'references' && (
        <div className="bg-white rounded-lg border border-neutral-200 p-8 text-center">
          <p className="text-neutral-600">References tab - Under development</p>
        </div>
      )}

      {/* ActionHistory - Rendered once and positioned based on active tab */}
      <div
        style={{
          display: (activeTab === 'overview' || activeTab === 'actions') ? 'block' : 'none'
        }}
      >
        {actionHistoryComponent}
      </div>

      {/* Action Panel */}
      {customer && <ActionPanel customer={customer} lastContactDate={lastContactDate} onActionRecorded={handleActionRecorded} />}
    </div>
  );
};

export default CustomersPage;
