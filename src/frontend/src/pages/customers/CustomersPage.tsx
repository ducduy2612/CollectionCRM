import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Customer, Loan, PaymentHistoryItem, PaymentHistoryFilters } from './types';
import CustomerHeader from './components/CustomerHeader';
import CustomerTabs from './components/CustomerTabs';
import ContactInformation from './components/ContactInformation';
import LoanSummary from './components/LoanSummary';
import ActionHistory from './components/ActionHistory';
import PaymentHistory from './components/PaymentHistory';
import AssignmentHistory from './components/AssignmentHistory';
import CustomerStatusComponent from './components/CustomerStatus';
import ActionPanel from './components/ActionPanel';
import CustomerList from './components/CustomerList';
import DocumentHistory from './components/DocumentHistory';
import ReferenceCustomers from './components/ReferenceCustomers';
import { bankApi } from '../../services/api/bank.api';
import { paymentApi } from '../../services/api/payment.api';
import { Spinner } from '../../components/ui/Spinner';
import { useTranslation } from '../../i18n/hooks/useTranslation';

const CustomersPage: React.FC = () => {
  const { cif } = useParams<{ cif: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation(['customers', 'common', 'errors']);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [payments, setPayments] = useState<PaymentHistoryItem[]>([]);
  const [paymentsLoading, setPaymentsLoading] = useState(false);
  const [paymentsError, setPaymentsError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastContactDate, setLastContactDate] = useState<string | undefined>(undefined);

  // Fetch customer data function
  const fetchCustomerData = useCallback(async () => {
    if (!cif) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const customerData = await bankApi.getCustomer(cif);
      setCustomer(customerData);

      if (customerData.loans) {
        setLoans(customerData.loans);
      }
    } catch (err) {
      console.error('Error fetching customer data:', err);
      setError('Failed to load customer data');
    } finally {
      setLoading(false);
    }
  }, [cif]);

  // Fetch customer data on mount
  useEffect(() => {
    fetchCustomerData();
  }, [fetchCustomerData]);

  // Fetch payments
  useEffect(() => {
    const fetchInitialPayments = async () => {
      if (!cif) return;
      
      setPaymentsLoading(true);
      setPaymentsError(null);
      
      try {
        const response = await paymentApi.getPaymentsByCif(cif, { limit: 50, offset: 0 });
        setPayments(response.data.payments);
      } catch (err) {
        console.error('Error fetching payments:', err);
        setPaymentsError('Failed to load payments');
      } finally {
        setPaymentsLoading(false);
      }
    };

    fetchInitialPayments();
  }, [cif]);

  // Handle payment filter changes
  const fetchPayments = useCallback(async (filters?: PaymentHistoryFilters) => {
    if (!cif) return;
    
    setPaymentsLoading(true);
    setPaymentsError(null);
    
    try {
      const params = {
        limit: 50,
        offset: 0,
        ...(filters?.loan_account_number && { loan_account_number: filters.loan_account_number }),
        ...(filters?.start_date && { start_date: filters.start_date }),
        ...(filters?.end_date && { end_date: filters.end_date })
      };
      
      const response = await paymentApi.getPaymentsByCif(cif, params);
      setPayments(response.data.payments);
    } catch (err) {
      console.error('Error fetching payments:', err);
      setPaymentsError('Failed to load payments');
    } finally {
      setPaymentsLoading(false);
    }
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

  // Memoize the AssignmentHistory component to prevent unnecessary re-renders and API calls
  const assignmentHistoryComponent = useMemo(() => (
    cif ? <AssignmentHistory cif={cif} /> : null
  ), [cif]);

  // If no CIF is provided, show the customer list
  if (!cif) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-neutral-900">{t('customers:titles.customers')}</h1>
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
        <p>{t('customers:messages.customer_not_found')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-16">
      {/* Customer Header and Status - Side by Side */}
      <div className="grid grid-cols-3 gap-4 items-stretch">
        <CustomerHeader
          customer={customer}
          onReferenceClick={() => setActiveTab('references')}
        />
        {customer && <ContactInformation cif={cif} phones={customer.phones} emails={customer.emails} addresses={customer.addresses} />}
        <CustomerStatusComponent cif={cif || ''} />
      </div>
      
      {/* Tabs */}
      <CustomerTabs activeTab={activeTab} onTabChange={handleTabChange} />

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="space-y-1">
          {/* Top row: ContactInformation, LoanSummary, PaymentHistory */}
          <div className="grid grid-cols-3 gap-4">
            {loans && loans.length > 0 && <LoanSummary loans={loans} />}
            {cif && <PaymentHistory 
              cif={cif} 
              loans={loans} 
              payments={payments}
              loading={paymentsLoading}
              error={paymentsError}
              onFiltersChange={fetchPayments}
            />}
            {assignmentHistoryComponent}
          </div>
        </div>
      )}

      {activeTab === 'loans' && (
        <div className="space-y-4">
          {loans && loans.length > 0 && <LoanSummary loans={loans} />}
        </div>
      )}

      {activeTab === 'actions' && (
        <div className="space-y-4">
          {/* ActionHistory is rendered above and shown via CSS */}
        </div>
      )}

      {activeTab === 'payments' && (
        <div className="space-y-4">
          {cif && <PaymentHistory 
            cif={cif} 
            loans={loans} 
            payments={payments}
            loading={paymentsLoading}
            error={paymentsError}
            onFiltersChange={fetchPayments}
          />}
        </div>
      )}

      {activeTab === 'documents' && (
        <DocumentHistory 
          cif={cif!}
          loans={loans}
          className="space-y-4"
        />
      )}

      {activeTab === 'references' && customer && (
        <ReferenceCustomers 
          primaryCif={customer.cif}
          referenceCustomers={customer.referenceCustomers || []}
          onRefresh={fetchCustomerData}
        />
      )}

      {/* ActionHistory - Rendered once and positioned based on active tab */}
      <div
        style={{
          display: (activeTab === 'overview' || activeTab === 'actions') ? 'block' : 'none'
        }}
      >
        {actionHistoryComponent}
      </div>
      {/* Bottom row: AssignmentHistory */}

      {/* Action Panel */}
      {customer && <ActionPanel customer={customer} lastContactDate={lastContactDate} onActionRecorded={handleActionRecorded} />}
    </div>
  );
};

export default CustomersPage;
