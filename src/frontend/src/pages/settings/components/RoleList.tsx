import React, { useState, useEffect, useCallback } from 'react';
import { 
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
  Modal
} from '../../../components/ui';
import { authApi, RoleResponse, RoleUsersResponse } from '../../../services/api/auth.api';

// Icons as SVG components
const SearchIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);

const PlusIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
);

const EditIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
  </svg>
);

const UsersIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
  </svg>
);

const TrashIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

// Interfaces
interface RoleListState {
  roles: RoleResponse[];
  loading: boolean;
  error: string | null;
  searchQuery: string;
  selectedRole: RoleResponse | null;
  userCounts: Record<string, number>;
  loadingUserCounts: boolean;
}

interface RoleListProps {
  onAddRole?: () => void;
  onEditRole?: (role: RoleResponse) => void;
  onViewUsers?: (role: RoleResponse) => void;
  onDeleteRole?: (role: RoleResponse) => void;
  refreshTrigger?: number; // Add refresh trigger prop
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

const RoleList: React.FC<RoleListProps> = ({
  onAddRole,
  onEditRole,
  onViewUsers,
  onDeleteRole,
  refreshTrigger
}) => {
  const [state, setState] = useState<RoleListState>({
    roles: [],
    loading: false,
    error: null,
    searchQuery: '',
    selectedRole: null,
    userCounts: {},
    loadingUserCounts: false
  });

  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [roleToDelete, setRoleToDelete] = useState<RoleResponse | null>(null);

  // Debounce search query to avoid excessive filtering
  const debouncedSearchQuery = useDebounce(state.searchQuery, 300);

  // Load roles
  const loadRoles = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const response = await authApi.getRoles();
      setState(prev => ({
        ...prev,
        roles: response.roles,
        loading: false
      }));

      // Load user counts for each role
      loadUserCounts(response.roles);
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to load roles',
        loading: false
      }));
    }
  }, []);

  // Load user counts for roles
  const loadUserCounts = async (roles: RoleResponse[]) => {
    setState(prev => ({ ...prev, loadingUserCounts: true }));
    
    try {
      const userCountPromises = roles.map(async (role) => {
        try {
          const response = await authApi.getUsersWithRole(role.id, { page: 1, pageSize: 1 });
          return { roleId: role.id, count: response.pagination.totalItems };
        } catch (error) {
          console.error(`Failed to load user count for role ${role.name}:`, error);
          return { roleId: role.id, count: 0 };
        }
      });

      const userCountResults = await Promise.all(userCountPromises);
      const userCountsMap = userCountResults.reduce((acc, { roleId, count }) => {
        acc[roleId] = count;
        return acc;
      }, {} as Record<string, number>);

      setState(prev => ({
        ...prev,
        userCounts: userCountsMap,
        loadingUserCounts: false
      }));
    } catch (error) {
      console.error('Failed to load user counts:', error);
      setState(prev => ({ ...prev, loadingUserCounts: false }));
    }
  };

  // Load roles on component mount
  useEffect(() => {
    loadRoles();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Reload roles when refresh trigger changes
  useEffect(() => {
    if (refreshTrigger !== undefined && refreshTrigger > 0) {
      loadRoles();
    }
  }, [refreshTrigger]); // eslint-disable-line react-hooks/exhaustive-deps

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setState(prev => ({ ...prev, searchQuery: e.target.value }));
  };

  // Filter roles based on search query
  const filteredRoles = state.roles.filter(role => {
    if (!debouncedSearchQuery.trim()) return true;
    
    const query = debouncedSearchQuery.toLowerCase();
    return (
      role.name.toLowerCase().includes(query) ||
      (role.description && role.description.toLowerCase().includes(query))
    );
  });

  // Handle add role
  const handleAddRole = () => {
    if (onAddRole) {
      onAddRole();
    } else {
      console.log('Add new role');
      // TODO: Implement role creation modal
    }
  };

  // Handle edit role
  const handleEditRole = (role: RoleResponse) => {
    if (onEditRole) {
      onEditRole(role);
    } else {
      console.log('Edit role:', role);
      // TODO: Implement role edit modal
    }
  };

  // Handle view users
  const handleViewUsers = (role: RoleResponse) => {
    if (onViewUsers) {
      onViewUsers(role);
    } else {
      console.log('View users for role:', role);
      // TODO: Implement role users modal
    }
  };

  // Handle delete role confirmation
  const handleDeleteRoleConfirm = (role: RoleResponse) => {
    setRoleToDelete(role);
    setShowDeleteConfirm(true);
  };

  // Handle delete role
  const handleDeleteRole = async () => {
    if (!roleToDelete) return;

    setActionLoading(`delete-${roleToDelete.id}`);
    
    try {
      await authApi.deleteRole(roleToDelete.id);
      
      // Reload roles to get updated data
      await loadRoles();
      
      setShowDeleteConfirm(false);
      setRoleToDelete(null);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete role';
      
      setState(prev => ({
        ...prev,
        error: errorMessage
      }));
      
      // If the error is about users being assigned, close the modal since we now prevent this case
      if (errorMessage.includes('assigned to') && errorMessage.includes('user(s)')) {
        setShowDeleteConfirm(false);
        setRoleToDelete(null);
      }
    } finally {
      setActionLoading(null);
    }
  };

  // Cancel delete confirmation
  const handleCancelDelete = () => {
    setShowDeleteConfirm(false);
    setRoleToDelete(null);
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Truncate description with tooltip
  const truncateDescription = (description: string | undefined, maxLength: number = 50) => {
    if (!description) return 'No description';
    if (description.length <= maxLength) return description;
    return description.substring(0, maxLength) + '...';
  };

  return (
    <div className="space-y-6">
      {/* Header with Search and Add Button */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-4 flex-1">
          {/* Search Input */}
          <div className="flex-1 max-w-md">
            <Input
              type="text"
              placeholder="Search roles by name or description..."
              value={state.searchQuery}
              onChange={handleSearchChange}
              leftIcon={<SearchIcon />}
              aria-label="Search roles"
            />
          </div>
        </div>

        {/* Add Role Button */}
        <Button
          onClick={handleAddRole}
          className="flex items-center gap-2"
          aria-label="Add new role"
        >
          <PlusIcon />
          Add New Role
        </Button>
      </div>

      {/* Results Info */}
      {filteredRoles.length > 0 && (
        <div className="text-sm text-neutral-600">
          <span>
            Showing {filteredRoles.length} of {state.roles.length} roles
          </span>
        </div>
      )}

      {/* Error Message */}
      {state.error && (
        <div className="bg-danger-50 border border-danger-200 text-danger-700 px-4 py-3 rounded-md">
          {state.error}
        </div>
      )}

      {/* Roles Table */}
      <div className="relative">
        {state.loading && (
          <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10">
            <div className="flex items-center gap-2">
              <Spinner size="sm" />
              <span className="text-sm text-neutral-600">Loading roles...</span>
            </div>
          </div>
        )}
        
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="text-center">Permissions</TableHead>
              <TableHead className="text-center">Users</TableHead>
              <TableHead className="hidden md:table-cell">Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredRoles.length === 0 && !state.loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-neutral-500">
                  {state.searchQuery.trim()
                    ? 'No roles found matching your search criteria'
                    : 'No roles found'
                  }
                </TableCell>
              </TableRow>
            ) : (
              filteredRoles.map((role) => (
                <TableRow key={role.id} clickable>
                  <TableCell>
                    <div>
                      <div className="font-medium text-neutral-900">
                        {role.name}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span 
                      className="text-neutral-700"
                      title={role.description}
                    >
                      {truncateDescription(role.description)}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="neutral" size="sm">
                      {role.permissions.length}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    {state.loadingUserCounts ? (
                      <Spinner size="sm" />
                    ) : (
                      <span className="text-neutral-700">
                        {state.userCounts[role.id] || 0}
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-neutral-600">
                    {formatDate(role.created_at)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEditRole(role)}
                        aria-label={`Edit ${role.name} role`}
                      >
                        <EditIcon />
                      </Button>
                      
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleViewUsers(role)}
                        aria-label={`View users with ${role.name} role`}
                      >
                        <UsersIcon />
                      </Button>
                      
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteRoleConfirm(role)}
                        className="text-danger-600 hover:text-danger-700 hover:bg-danger-50"
                        aria-label={`Delete ${role.name} role`}
                      >
                        <TrashIcon />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteConfirm}
        onClose={handleCancelDelete}
        title="Delete Role"
        size="sm"
      >
        <div className="space-y-4">
          {roleToDelete && state.userCounts[roleToDelete.id] > 0 ? (
            <>
              <p className="text-neutral-700">
                Cannot delete the role "{roleToDelete.name}" because it is currently assigned to {state.userCounts[roleToDelete.id]} user(s).
              </p>
              
              <div className="bg-danger-50 border border-danger-200 text-danger-700 px-3 py-2 rounded-md text-sm">
                <strong>Action Required:</strong> Before deleting this role, you must:
                <ul className="mt-2 ml-4 list-disc">
                  <li>Remove all users from this role, or</li>
                  <li>Reassign users to a different role (e.g., default agent role)</li>
                </ul>
              </div>

              <div className="flex justify-end gap-3">
                <Button
                  variant="secondary"
                  onClick={handleCancelDelete}
                >
                  Close
                </Button>
                <Button
                  variant="primary"
                  onClick={() => {
                    handleCancelDelete();
                    if (onViewUsers && roleToDelete) {
                      onViewUsers(roleToDelete);
                    }
                  }}
                >
                  Manage Users
                </Button>
              </div>
            </>
          ) : (
            <>
              <p className="text-neutral-700">
                Are you sure you want to delete the role "{roleToDelete?.name}"? This action cannot be undone.
              </p>

              <div className="flex justify-end gap-3">
                <Button
                  variant="secondary"
                  onClick={handleCancelDelete}
                  disabled={actionLoading === `delete-${roleToDelete?.id}`}
                >
                  Cancel
                </Button>
                <Button
                  variant="danger"
                  onClick={handleDeleteRole}
                  loading={actionLoading === `delete-${roleToDelete?.id}`}
                >
                  Delete Role
                </Button>
              </div>
            </>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default RoleList;