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
import UserManagementPage from './pages/settings/user-management/UserManagementPage';
import ActionsConfigPage from './pages/settings/actions-config/ActionsConfigPage';
import FudAutoConfigPage from './pages/settings/fud-auto-config/FudAutoConfigPage';
import QueueCampaignConfigPage from './pages/settings/queue-campaign-config/QueueCampaignConfigPage';
import SystemConfigurationPage from './pages/settings/system-configuration/SystemConfigurationPage';
import CustomerAssignmentUploadPage from './pages/settings/customer-assignment-upload/CustomerAssignmentUploadPage';
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
                
                {/* User Management - requires user_management permissions */}
                <Route
                  path="/settings/user-management"
                  element={
                    <ProtectedRoute requiredPermissions={["user_management"]}>
                      <UserManagementPage />
                    </ProtectedRoute>
                  }
                />
                
                {/* Actions Config - requires action_config permission */}
                <Route
                  path="/settings/actions-config"
                  element={
                    <ProtectedRoute requiredPermissions={["action_config"]}>
                      <ActionsConfigPage />
                    </ProtectedRoute>
                  }
                />
                
                {/* FUD Auto Config - requires FUD_config:edit permission */}
                <Route
                  path="/settings/fud-auto-config"
                  element={
                    <ProtectedRoute requiredPermissions={["FUD_config:edit"]}>
                      <FudAutoConfigPage />
                    </ProtectedRoute>
                  }
                />
                
                {/* Queue Campaign Config - requires campaign_management permission */}
                <Route
                  path="/settings/queue-campaign"
                  element={
                    <ProtectedRoute requiredPermissions={["campaign_management"]}>
                      <QueueCampaignConfigPage />
                    </ProtectedRoute>
                  }
                />
                
                {/* System Configuration - requires system_admin permission */}
                <Route
                  path="/settings/system-config"
                  element={
                    <ProtectedRoute requiredPermissions={["system_admin"]}>
                      <SystemConfigurationPage />
                    </ProtectedRoute>
                  }
                />
                
                {/* Customer Assignment - requires customer_assignment permission */}
                <Route
                  path="/settings/customer-assignment"
                  element={
                    <ProtectedRoute requiredPermissions={["customer_assignment"]}>
                      <CustomerAssignmentUploadPage />
                    </ProtectedRoute>
                  }
                />
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