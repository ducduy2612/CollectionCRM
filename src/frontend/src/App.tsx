import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';

// Providers
import { AuthProvider } from './providers/AuthProvider';
import { ToastProvider } from './components/ui/ToastProvider';

// Layout components
import MainLayout from './layouts/MainLayout';
import AuthLayout from './layouts/AuthLayout';

// Pages
import LoginPage from './pages/auth/LoginPage';
import DashboardPage from './pages/dashboard/DashboardPage';
import CustomersPage from './pages/customers/CustomersPage';
import SettingsPage from './pages/settings/SettingsPage';
import UserManagementPage from './pages/settings/UserManagementPage';
import ActionsConfigPage from './pages/settings/ActionsConfigPage';
import CustomerAssignmentUploadPage from './pages/settings/CustomerAssignmentUploadPage';
import NotFoundPage from './pages/NotFoundPage';

// Components
import { ProtectedRoute } from './components/auth/ProtectedRoute';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: false,
      staleTime: 5 * 60 * 1000,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ToastProvider>
          <Router>
            <Routes>
              {/* Auth routes */}
              <Route element={<AuthLayout />}>
                <Route path="/login" element={<LoginPage />} />
              </Route>

              {/* Protected routes */}
              <Route element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
                <Route path="/dashboard" element={<DashboardPage />} />
                
                <Route path="/customers" element={<CustomersPage />} />
                <Route path="/customers/:cif" element={<CustomersPage />} />
                
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="/settings/user-management" element={<UserManagementPage />} />
                <Route path="/settings/actions-config" element={<ActionsConfigPage />} />
                <Route path="/settings/customer-assignment" element={<CustomerAssignmentUploadPage />} />
              </Route>

              {/* Redirect root to dashboard */}
              <Route path="/" element={<Navigate to="/dashboard" replace />} />

              {/* 404 route */}
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </Router>
        </ToastProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;