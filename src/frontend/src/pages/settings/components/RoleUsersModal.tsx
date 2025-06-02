import React, { useState, useEffect, useCallback } from 'react';
import { 
  Modal, 
  Table, 
  TableHeader, 
  TableBody, 
  TableRow, 
  TableHead, 
  TableCell,
  Button,
  Input,
  Badge,
  Spinner,
  Alert
} from '../../../components/ui';
import { authApi, RoleResponse, UserResponse, PaginationParams } from '../../../services/api/auth.api';

// Icons as SVG components
const SearchIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);

const UserMinusIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 11h6" />
  </svg>
);

const UserPlusIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 11h6m-3-3v6" />
  </svg>
);

const CheckIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);

// Interfaces
interface RoleUsersModalProps {
  isOpen: boolean;
  onClose: () => void;
  role: RoleResponse | null;
}

interface RoleUsersModalState {
  // Current users with this role
  roleUsers: UserResponse[];
  roleUsersLoading: boolean;
  roleUsersError: string | null;
  
  // Available users to assign
  availableUsers: UserResponse[];
  availableUsersLoading: boolean;
  availableUsersError: string | null;
  
  // UI state
  showAssignUsers: boolean;
  searchQuery: string;
  availableSearchQuery: string;
  selectedUserIds: string[];
  
  // Action states
  unassignLoading: string | null;
  assignLoading: boolean;
  
  // Confirmation states
  showUnassignConfirm: boolean;
  userToUnassign: UserResponse | null;
}

// Debounce hook
const useDebounce = (value: string, delay: number) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

const RoleUsersModal: React.FC<RoleUsersModalProps> = ({
  isOpen,
  onClose,
  role
}) => {
  const [state, setState] = useState<RoleUsersModalState>({
    roleUsers: [],
    roleUsersLoading: false,
    roleUsersError: null,
    availableUsers: [],
    availableUsersLoading: false,
    availableUsersError: null,
    showAssignUsers: false,
    searchQuery: '',
    availableSearchQuery: '',
    selectedUserIds: [],
    unassignLoading: null,
    assignLoading: false,
    showUnassignConfirm: false,
    userToUnassign: null,
  });

  // Debounce search queries
  const debouncedSearchQuery = useDebounce(state.searchQuery, 300);
  const debouncedAvailableSearchQuery = useDebounce(state.availableSearchQuery, 300);

  // Load users with this role
  const loadRoleUsers = useCallback(async () => {
    if (!role) return;

    setState(prev => ({ ...prev, roleUsersLoading: true, roleUsersError: null }));

    try {
      const response = await authApi.getUsersWithRole(role.id, { page: 1, pageSize: 100 });
      setState(prev => ({
        ...prev,
        roleUsers: response.users,
        roleUsersLoading: false
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        roleUsersError: error instanceof Error ? error.message : 'Failed to load users with role',
        roleUsersLoading: false
      }));
    }
  }, [role]);

  // Load available users (users without this role)
  const loadAvailableUsers = useCallback(async () => {
    if (!role) return;

    setState(prev => ({ ...prev, availableUsersLoading: true, availableUsersError: null }));

    try {
      // Get all users
      const allUsersResponse = await authApi.getUsers({}, { page: 1, pageSize: 1000 });
      
      // Get users with this role
      const roleUsersResponse = await authApi.getUsersWithRole(role.id, { page: 1, pageSize: 1000 });
      const roleUserIds = new Set(roleUsersResponse.users.map(u => u.id));
      
      // Filter out users who already have this role
      const availableUsers = allUsersResponse.users.filter(user => !roleUserIds.has(user.id));
      
      setState(prev => ({
        ...prev,
        availableUsers,
        availableUsersLoading: false
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        availableUsersError: error instanceof Error ? error.message : 'Failed to load available users',
        availableUsersLoading: false
      }));
    }
  }, [role]);

  // Load data when modal opens or role changes
  useEffect(() => {
    if (isOpen && role) {
      loadRoleUsers();
    }
  }, [isOpen, role, loadRoleUsers]);

  // Load available users when assign mode is opened
  useEffect(() => {
    if (state.showAssignUsers && role) {
      loadAvailableUsers();
    }
  }, [state.showAssignUsers, role, loadAvailableUsers]);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setState(prev => ({
        ...prev,
        showAssignUsers: false,
        searchQuery: '',
        availableSearchQuery: '',
        selectedUserIds: [],
        showUnassignConfirm: false,
        userToUnassign: null,
      }));
    }
  }, [isOpen]);

  // Handle search input changes
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setState(prev => ({ ...prev, searchQuery: e.target.value }));
  };

  const handleAvailableSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setState(prev => ({ ...prev, availableSearchQuery: e.target.value }));
  };

  // Filter users based on search
  const filteredRoleUsers = state.roleUsers.filter(user => {
    if (!debouncedSearchQuery.trim()) return true;
    
    const query = debouncedSearchQuery.toLowerCase();
    const fullName = `${user.first_name || ''} ${user.last_name || ''}`.trim();
    
    return (
      user.username.toLowerCase().includes(query) ||
      user.email.toLowerCase().includes(query) ||
      fullName.toLowerCase().includes(query)
    );
  });

  const filteredAvailableUsers = state.availableUsers.filter(user => {
    if (!debouncedAvailableSearchQuery.trim()) return true;
    
    const query = debouncedAvailableSearchQuery.toLowerCase();
    const fullName = `${user.first_name || ''} ${user.last_name || ''}`.trim();
    
    return (
      user.username.toLowerCase().includes(query) ||
      user.email.toLowerCase().includes(query) ||
      fullName.toLowerCase().includes(query)
    );
  });

  // Handle user selection for assignment
  const handleUserSelection = (userId: string) => {
    setState(prev => ({
      ...prev,
      selectedUserIds: prev.selectedUserIds.includes(userId)
        ? prev.selectedUserIds.filter(id => id !== userId)
        : [...prev.selectedUserIds, userId]
    }));
  };

  // Handle select all users
  const handleSelectAllUsers = () => {
    setState(prev => ({
      ...prev,
      selectedUserIds: prev.selectedUserIds.length === filteredAvailableUsers.length
        ? []
        : filteredAvailableUsers.map(user => user.id)
    }));
  };

  // Handle unassign user confirmation
  const handleUnassignUserConfirm = (user: UserResponse) => {
    setState(prev => ({
      ...prev,
      showUnassignConfirm: true,
      userToUnassign: user
    }));
  };

  // Handle unassign user
  const handleUnassignUser = async () => {
    if (!role || !state.userToUnassign) return;

    setState(prev => ({ ...prev, unassignLoading: state.userToUnassign!.id }));

    try {
      // Remove user from role using the new API method
      await authApi.removeUsersFromRole(role.id, [state.userToUnassign.id]);
      
      // Reload role users
      await loadRoleUsers();
      
      setState(prev => ({
        ...prev,
        showUnassignConfirm: false,
        userToUnassign: null,
        unassignLoading: null
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        roleUsersError: error instanceof Error ? error.message : 'Failed to unassign user from role',
        unassignLoading: null
      }));
    }
  };

  // Handle assign users
  const handleAssignUsers = async () => {
    if (!role || state.selectedUserIds.length === 0) return;

    setState(prev => ({ ...prev, assignLoading: true }));

    try {
      await authApi.assignRoleToUsers(role.id, state.selectedUserIds);
      
      // Reload both lists
      await Promise.all([loadRoleUsers(), loadAvailableUsers()]);
      
      setState(prev => ({
        ...prev,
        assignLoading: false,
        showAssignUsers: false,
        selectedUserIds: [],
        availableSearchQuery: ''
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        availableUsersError: error instanceof Error ? error.message : 'Failed to assign users to role',
        assignLoading: false
      }));
    }
  };

  // Handle cancel operations
  const handleCancelUnassign = () => {
    setState(prev => ({
      ...prev,
      showUnassignConfirm: false,
      userToUnassign: null
    }));
  };

  const handleCancelAssign = () => {
    setState(prev => ({
      ...prev,
      showAssignUsers: false,
      selectedUserIds: [],
      availableSearchQuery: ''
    }));
  };

  // Format user display name
  const formatUserName = (user: UserResponse) => {
    const fullName = `${user.first_name || ''} ${user.last_name || ''}`.trim();
    return fullName || user.username;
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (!role) return null;

  return (
    <>
      {/* Main Role Users Modal */}
      <Modal
        isOpen={isOpen && !state.showAssignUsers}
        onClose={onClose}
        title={`Users with "${role.name}" Role`}
        description={role.description || `Manage users assigned to the ${role.name} role`}
        size="lg"
      >
        <div className="space-y-6">
          {/* Role Info */}
          <div className="bg-neutral-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-neutral-900">{role.name}</h4>
                {role.description && (
                  <p className="text-sm text-neutral-600 mt-1">{role.description}</p>
                )}
              </div>
              <div className="text-right">
                <div className="text-sm text-neutral-500">Permissions</div>
                <Badge variant="neutral" size="sm">
                  {role.permissions.length}
                </Badge>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between">
            <div className="flex-1 max-w-md">
              <Input
                type="text"
                placeholder="Search users..."
                value={state.searchQuery}
                onChange={handleSearchChange}
                leftIcon={<SearchIcon />}
                aria-label="Search users with role"
              />
            </div>
            <Button
              onClick={() => setState(prev => ({ ...prev, showAssignUsers: true }))}
              className="flex items-center gap-2"
              variant="primary"
              size="sm"
            >
              <UserPlusIcon />
              Assign Users
            </Button>
          </div>

          {/* Error Messages */}
          {state.roleUsersError && (
            <Alert variant="danger">
              {state.roleUsersError}
            </Alert>
          )}

          {/* Users Table */}
          <div className="relative">
            {state.roleUsersLoading && (
              <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10">
                <div className="flex items-center gap-2">
                  <Spinner size="sm" />
                  <span className="text-sm text-neutral-600">Loading users...</span>
                </div>
              </div>
            )}

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="hidden md:table-cell">Joined</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRoleUsers.length === 0 && !state.roleUsersLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-neutral-500">
                      {state.searchQuery.trim()
                        ? 'No users found matching your search criteria'
                        : 'No users assigned to this role'
                      }
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredRoleUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium text-neutral-900">
                            {formatUserName(user)}
                          </div>
                          <div className="text-sm text-neutral-500">
                            @{user.username}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-neutral-700">{user.email}</span>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge 
                          variant={user.is_active ? "success" : "danger"}
                          size="sm"
                        >
                          {user.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-neutral-600">
                        {formatDate(user.created_at)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleUnassignUserConfirm(user)}
                            className="text-danger-600 hover:text-danger-700 hover:bg-danger-50"
                            aria-label={`Remove ${formatUserName(user)} from ${role.name} role`}
                            loading={state.unassignLoading === user.id}
                          >
                            <UserMinusIcon />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Results Info */}
          {filteredRoleUsers.length > 0 && (
            <div className="text-sm text-neutral-600">
              Showing {filteredRoleUsers.length} of {state.roleUsers.length} users
            </div>
          )}
        </div>
      </Modal>

      {/* Assign Users Modal */}
      <Modal
        isOpen={state.showAssignUsers}
        onClose={handleCancelAssign}
        title={`Assign Users to "${role.name}" Role`}
        description="Select users to assign to this role"
        size="lg"
      >
        <div className="space-y-6">
          {/* Search and Actions */}
          <div className="flex items-center justify-between">
            <div className="flex-1 max-w-md">
              <Input
                type="text"
                placeholder="Search available users..."
                value={state.availableSearchQuery}
                onChange={handleAvailableSearchChange}
                leftIcon={<SearchIcon />}
                aria-label="Search available users"
              />
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={handleSelectAllUsers}
                disabled={filteredAvailableUsers.length === 0}
              >
                {state.selectedUserIds.length === filteredAvailableUsers.length 
                  ? 'Deselect All' 
                  : 'Select All'
                }
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleAssignUsers}
                disabled={state.selectedUserIds.length === 0}
                loading={state.assignLoading}
                className="flex items-center gap-2"
              >
                <CheckIcon />
                Assign ({state.selectedUserIds.length})
              </Button>
            </div>
          </div>

          {/* Error Messages */}
          {state.availableUsersError && (
            <Alert variant="danger">
              {state.availableUsersError}
            </Alert>
          )}

          {/* Available Users Table */}
          <div className="relative">
            {state.availableUsersLoading && (
              <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10">
                <div className="flex items-center gap-2">
                  <Spinner size="sm" />
                  <span className="text-sm text-neutral-600">Loading available users...</span>
                </div>
              </div>
            )}

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <input
                      type="checkbox"
                      checked={state.selectedUserIds.length === filteredAvailableUsers.length && filteredAvailableUsers.length > 0}
                      onChange={handleSelectAllUsers}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-neutral-300 rounded"
                      disabled={filteredAvailableUsers.length === 0}
                    />
                  </TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="hidden md:table-cell">Joined</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAvailableUsers.length === 0 && !state.availableUsersLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-neutral-500">
                      {state.availableSearchQuery.trim()
                        ? 'No available users found matching your search criteria'
                        : 'No users available to assign to this role'
                      }
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredAvailableUsers.map((user) => (
                    <TableRow key={user.id} clickable onClick={() => handleUserSelection(user.id)}>
                      <TableCell>
                        <input
                          type="checkbox"
                          checked={state.selectedUserIds.includes(user.id)}
                          onChange={() => handleUserSelection(user.id)}
                          className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-neutral-300 rounded"
                        />
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium text-neutral-900">
                            {formatUserName(user)}
                          </div>
                          <div className="text-sm text-neutral-500">
                            @{user.username}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-neutral-700">{user.email}</span>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge 
                          variant={user.is_active ? "success" : "danger"}
                          size="sm"
                        >
                          {user.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-neutral-600">
                        {formatDate(user.created_at)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Results Info */}
          {filteredAvailableUsers.length > 0 && (
            <div className="text-sm text-neutral-600">
              Showing {filteredAvailableUsers.length} of {state.availableUsers.length} available users
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-neutral-200">
            <Button
              variant="secondary"
              onClick={handleCancelAssign}
              disabled={state.assignLoading}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleAssignUsers}
              disabled={state.selectedUserIds.length === 0}
              loading={state.assignLoading}
            >
              Assign {state.selectedUserIds.length} User{state.selectedUserIds.length !== 1 ? 's' : ''}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Unassign Confirmation Modal */}
      <Modal
        isOpen={state.showUnassignConfirm}
        onClose={handleCancelUnassign}
        title="Remove User from Role"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-neutral-700">
            Are you sure you want to remove <strong>{state.userToUnassign ? formatUserName(state.userToUnassign) : ''}</strong> from the "{role.name}" role?
          </p>
          
          <div className="bg-warning-50 border border-warning-200 text-warning-700 px-3 py-2 rounded-md text-sm">
            This will remove all permissions associated with this role from the user.
          </div>

          <div className="flex justify-end gap-3">
            <Button
              variant="secondary"
              onClick={handleCancelUnassign}
              disabled={state.unassignLoading === state.userToUnassign?.id}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleUnassignUser}
              loading={state.unassignLoading === state.userToUnassign?.id}
            >
              Remove from Role
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default RoleUsersModal;