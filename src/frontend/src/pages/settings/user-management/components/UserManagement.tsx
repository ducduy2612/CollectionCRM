import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../../../components/ui/Card';
import { Button } from '../../../../components/ui/Button';
import { Alert } from '../../../../components/ui/Alert';
import { TabsContent } from '../../../../components/ui/Tabs';
import { UserIcon, ShieldCheckIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import UserManagementTabs from './UserManagementTabs';
import UserList from './UserList';
import RoleList from './RoleList';
import UserModal from './UserModal';
import RoleModal from './RoleModal';
import UserSessionsModal from './UserSessionsModal';
import RoleUsersModal from './RoleUsersModal';
import { UserResponse, RoleResponse } from '../../../../services/api/auth.api';
import { useTranslation } from '../../../../i18n/hooks/useTranslation';

export type UserManagementTab = 'users' | 'roles';

interface UserManagementProps {
  className?: string;
}

interface UserManagementState {
  activeTab: UserManagementTab;
  loading: boolean;
  error: string | null;
  showUserModal: boolean;
  userModalMode: 'create' | 'edit';
  selectedUser: UserResponse | null;
  showRoleModal: boolean;
  roleModalMode: 'create' | 'edit';
  selectedRole: RoleResponse | null;
  showUserSessionsModal: boolean;
  userForSessions: UserResponse | null;
  showRoleUsersModal: boolean;
  roleForUsers: RoleResponse | null;
  refreshTrigger: number;
}

const UserManagement: React.FC<UserManagementProps> = ({ className }) => {
  const { t } = useTranslation();
  const [state, setState] = useState<UserManagementState>({
    activeTab: 'users',
    loading: false,
    error: null,
    showUserModal: false,
    userModalMode: 'create',
    selectedUser: null,
    showRoleModal: false,
    roleModalMode: 'create',
    selectedRole: null,
    showUserSessionsModal: false,
    userForSessions: null,
    showRoleUsersModal: false,
    roleForUsers: null,
    refreshTrigger: 0,
  });

  const handleTabChange = (tab: UserManagementTab) => {
    setState(prev => ({
      ...prev,
      activeTab: tab,
      error: null, // Clear any existing errors when switching tabs
    }));
  };

  const handleRefresh = () => {
    setState(prev => ({
      ...prev,
      loading: true,
      error: null,
      refreshTrigger: prev.refreshTrigger + 1
    }));
    
    // Reset loading state after a short delay
    setTimeout(() => {
      setState(prev => ({ ...prev, loading: false }));
    }, 500);
  };

  // User management handlers
  const handleAddUser = () => {
    setState(prev => ({
      ...prev,
      showUserModal: true,
      userModalMode: 'create',
      selectedUser: null,
    }));
  };

  const handleEditUser = (user: UserResponse) => {
    setState(prev => ({
      ...prev,
      showUserModal: true,
      userModalMode: 'edit',
      selectedUser: user,
    }));
  };

  const handleCloseUserModal = () => {
    setState(prev => ({
      ...prev,
      showUserModal: false,
      selectedUser: null,
    }));
  };

  const handleUserModalSuccess = () => {
    setState(prev => ({
      ...prev,
      showUserModal: false,
      selectedUser: null,
    }));
    // Trigger refresh of user list by updating a timestamp or similar
    handleRefresh();
  };

  const handleViewUserSessions = (user: UserResponse) => {
    setState(prev => ({
      ...prev,
      showUserSessionsModal: true,
      userForSessions: user,
    }));
  };

  const handleCloseUserSessionsModal = () => {
    setState(prev => ({
      ...prev,
      showUserSessionsModal: false,
      userForSessions: null,
    }));
  };

  const handleDeleteUser = (user: UserResponse) => {
    console.log('Delete user:', user);
    // TODO: Implement user deletion with confirmation
  };

  // Role management handlers
  const handleAddRole = () => {
    setState(prev => ({
      ...prev,
      showRoleModal: true,
      roleModalMode: 'create',
      selectedRole: null,
    }));
  };

  const handleEditRole = (role: RoleResponse) => {
    setState(prev => ({
      ...prev,
      showRoleModal: true,
      roleModalMode: 'edit',
      selectedRole: role,
    }));
  };

  const handleCloseRoleModal = () => {
    setState(prev => ({
      ...prev,
      showRoleModal: false,
      selectedRole: null,
    }));
  };

  const handleRoleModalSuccess = () => {
    setState(prev => ({
      ...prev,
      showRoleModal: false,
      selectedRole: null,
      refreshTrigger: prev.refreshTrigger + 1
    }));
  };

  const handleViewRoleUsers = (role: RoleResponse) => {
    setState(prev => ({
      ...prev,
      showRoleUsersModal: true,
      roleForUsers: role,
    }));
  };

  const handleCloseRoleUsersModal = () => {
    setState(prev => ({
      ...prev,
      showRoleUsersModal: false,
      roleForUsers: null,
    }));
  };

  const handleDeleteRole = (role: RoleResponse) => {
    console.log('Delete role:', role);
    // TODO: Implement role deletion with confirmation
  };

  const renderUsersContent = () => {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <UserIcon className="w-6 h-6 text-primary-600" />
            <div>
              <h3 className="text-lg font-semibold text-neutral-900">User Accounts</h3>
              <p className="text-sm text-neutral-600">{t('settings:messages.manage_user_accounts')}</p>
            </div>
          </div>
          <Button variant="primary" size="sm" onClick={handleAddUser}>
            Add User
          </Button>
        </div>
        
        <UserList
          onEditUser={handleEditUser}
          onViewSessions={handleViewUserSessions}
          onDeleteUser={handleDeleteUser}
          refreshTrigger={state.refreshTrigger}
        />
      </div>
    );
  };

  const renderRolesContent = () => {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <ShieldCheckIcon className="w-6 h-6 text-primary-600" />
            <div>
              <h3 className="text-lg font-semibold text-neutral-900">Role Management</h3>
              <p className="text-sm text-neutral-600">{t('settings:messages.manage_roles')}</p>
            </div>
          </div>
        </div>
        
        <RoleList
          onAddRole={handleAddRole}
          onEditRole={handleEditRole}
          onViewUsers={handleViewRoleUsers}
          onDeleteRole={handleDeleteRole}
          refreshTrigger={state.refreshTrigger}
        />
      </div>
    );
  };

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between w-full">
            <CardTitle className="flex items-center space-x-2">
              <UserIcon className="w-6 h-6 text-primary-600" />
              <span>{t('settings:messages.user_management')}</span>
            </CardTitle>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleRefresh}
              loading={state.loading}
              aria-label="Refresh user management data"
            >
              Refresh
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          {state.error && (
            <Alert 
              variant="danger" 
              className="mb-6"
              icon={<ExclamationTriangleIcon className="w-5 h-5" />}
            >
              {state.error}
            </Alert>
          )}

          <UserManagementTabs
            activeTab={state.activeTab}
            onTabChange={handleTabChange}
            className="min-h-[400px]"
          >
            <TabsContent value="users">
              {renderUsersContent()}
            </TabsContent>
            
            <TabsContent value="roles">
              {renderRolesContent()}
            </TabsContent>
          </UserManagementTabs>
        </CardContent>
      </Card>

      {/* User Modal */}
      <UserModal
        isOpen={state.showUserModal}
        onClose={handleCloseUserModal}
        onSuccess={handleUserModalSuccess}
        user={state.selectedUser}
        mode={state.userModalMode}
      />

      {/* Role Modal */}
      <RoleModal
        isOpen={state.showRoleModal}
        onClose={handleCloseRoleModal}
        onSuccess={handleRoleModalSuccess}
        role={state.selectedRole}
        mode={state.roleModalMode}
      />

      {/* User Sessions Modal */}
      <UserSessionsModal
        isOpen={state.showUserSessionsModal}
        onClose={handleCloseUserSessionsModal}
        user={state.userForSessions}
      />

      {/* Role Users Modal */}
      <RoleUsersModal
        isOpen={state.showRoleUsersModal}
        onClose={handleCloseRoleUsersModal}
        role={state.roleForUsers}
      />
    </div>
  );
};

export default UserManagement;