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
  Select,
  Badge,
  Spinner,
  LoadingOverlay
} from '../../../../components/ui';
import { authApi, UserResponse, UserFilters, PaginationParams } from '../../../../services/api/auth.api';
import { useTranslation } from '../../../../i18n/hooks/useTranslation';

// Icons as SVG components
const SearchIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);

const EditIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
  </svg>
);

const PowerIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
  </svg>
);

const EyeIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
  </svg>
);

const TrashIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

const ChevronLeftIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
  </svg>
);

const ChevronRightIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
  </svg>
);

// Interfaces
interface UserListState {
  users: UserResponse[];
  loading: boolean;
  error: string | null;
  searchQuery: string;
  roleFilter: string;
  statusFilter: string;
  currentPage: number;
  pageSize: number;
  totalPages: number;
  totalItems: number;
  selectedUser: UserResponse | null;
}

interface UserListProps {
  onEditUser?: (user: UserResponse) => void;
  onViewSessions?: (user: UserResponse) => void;
  onDeleteUser?: (user: UserResponse) => void;
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

const UserList: React.FC<UserListProps> = ({
  onEditUser,
  onViewSessions,
  onDeleteUser,
  refreshTrigger
}) => {
  const { t } = useTranslation(['settings', 'common']);
  const [state, setState] = useState<UserListState>({
    users: [],
    loading: false,
    error: null,
    searchQuery: '',
    roleFilter: '',
    statusFilter: '',
    currentPage: 1,
    pageSize: 10,
    totalPages: 0,
    totalItems: 0,
    selectedUser: null
  });

  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [roles, setRoles] = useState<Array<{ value: string; label: string }>>([]);

  // Debounce search query to avoid excessive API calls
  const debouncedSearchQuery = useDebounce(state.searchQuery, 500);

  // Load available roles for filter
  useEffect(() => {
    const loadRoles = async () => {
      try {
        const response = await authApi.getRoles();
        const roleOptions = response.roles.map(role => ({
          value: role.name,
          label: role.name.charAt(0).toUpperCase() + role.name.slice(1)
        }));
        setRoles(roleOptions);
      } catch (error) {
        console.error('Failed to load roles:', error);
      }
    };

    loadRoles();
  }, []);

  // Load users when filters or pagination change
  const loadUsers = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const filters: UserFilters = {};
      const pagination: PaginationParams = {
        page: state.currentPage,
        pageSize: state.pageSize
      };

      // Apply search filter
      if (debouncedSearchQuery.trim()) {
        // Check if search query looks like an email
        if (debouncedSearchQuery.includes('@')) {
          filters.email = debouncedSearchQuery.trim();
        } else {
          filters.username = debouncedSearchQuery.trim();
        }
      }

      // Apply role filter
      if (state.roleFilter) {
        filters.role = state.roleFilter;
      }

      // Apply status filter
      if (state.statusFilter) {
        filters.isActive = state.statusFilter === 'active';
      }

      const response = await authApi.getUsers(filters, pagination);

      setState(prev => ({
        ...prev,
        users: response.users,
        totalPages: response.pagination.totalPages,
        totalItems: response.pagination.totalItems,
        loading: false
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : t('common:messages.operation_failed'),
        loading: false
      }));
    }
  }, [debouncedSearchQuery, state.roleFilter, state.statusFilter, state.currentPage, state.pageSize]);

  // Load users when dependencies change
  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  // Reload users when refresh trigger changes
  useEffect(() => {
    if (refreshTrigger !== undefined && refreshTrigger > 0) {
      loadUsers();
    }
  }, [refreshTrigger]); // eslint-disable-line react-hooks/exhaustive-deps

  // Reset to first page when filters change
  useEffect(() => {
    if (state.currentPage !== 1) {
      setState(prev => ({ ...prev, currentPage: 1 }));
    }
  }, [debouncedSearchQuery, state.roleFilter, state.statusFilter]);

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setState(prev => ({ ...prev, searchQuery: e.target.value }));
  };

  // Handle role filter change
  const handleRoleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setState(prev => ({ ...prev, roleFilter: e.target.value }));
  };

  // Handle status filter change
  const handleStatusFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setState(prev => ({ ...prev, statusFilter: e.target.value }));
  };

  // Handle page size change
  const handlePageSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setState(prev => ({ 
      ...prev, 
      pageSize: parseInt(e.target.value),
      currentPage: 1 
    }));
  };

  // Handle pagination
  const handlePageChange = (page: number) => {
    setState(prev => ({ ...prev, currentPage: page }));
  };

  // Handle user activation/deactivation
  const handleToggleUserStatus = async (user: UserResponse) => {
    setActionLoading(`toggle-${user.id}`);
    
    try {
      if (user.is_active) {
        await authApi.deactivateUser(user.id);
      } else {
        await authApi.activateUser(user.id);
      }
      
      // Reload users to get updated data
      await loadUsers();
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : t('settings:messages.operation_failed')
      }));
    } finally {
      setActionLoading(null);
    }
  };

  // Placeholder handlers for actions
  const handleEditUser = (user: UserResponse) => {
    if (onEditUser) {
      onEditUser(user);
    } else {
      console.log('Edit user:', user);
      // TODO: Implement user edit modal
    }
  };

  const handleViewSessions = (user: UserResponse) => {
    if (onViewSessions) {
      onViewSessions(user);
    } else {
      console.log('View sessions for user:', user);
      // TODO: Implement user sessions modal
    }
  };

  const handleDeleteUser = (user: UserResponse) => {
    if (onDeleteUser) {
      onDeleteUser(user);
    } else {
      console.log('Delete user:', user);
      // TODO: Implement user deletion with confirmation
    }
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

  // Get user display name
  const getUserDisplayName = (user: UserResponse) => {
    if (user.first_name || user.last_name) {
      return `${user.first_name || ''} ${user.last_name || ''}`.trim();
    }
    return user.username;
  };

  // Get primary role for display
  const getPrimaryRole = (user: UserResponse) => {
    return user.roles[0] || 'USER';
  };

  // Generate pagination numbers
  const getPaginationNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    let start = Math.max(1, state.currentPage - Math.floor(maxVisible / 2));
    let end = Math.min(state.totalPages, start + maxVisible - 1);
    
    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }
    
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    
    return pages;
  };

  return (
    <div className="space-y-6">
      {/* Header with Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-4 flex-1">
          {/* Search Input */}
          <div className="flex-1 max-w-md">
            <Input
              type="text"
              placeholder={t('settings:user_management.search_placeholder')}
              value={state.searchQuery}
              onChange={handleSearchChange}
              leftIcon={<SearchIcon />}
              aria-label={t('settings:user_management.search_users')}
            />
          </div>

          {/* Filters */}
          <div className="flex gap-2">
            <Select
              value={state.roleFilter}
              onChange={handleRoleFilterChange}
              options={[
                { value: '', label: t('settings:user_management.all_roles') },
                ...roles
              ]}
              placeholder={t('settings:user_management.filter_by_role')}
              aria-label={t('settings:user_management.filter_by_role')}
            />
            
            <Select
              value={state.statusFilter}
              onChange={handleStatusFilterChange}
              options={[
                { value: '', label: t('settings:user_management.all_status') },
                { value: 'active', label: t('common:status.active') },
                { value: 'inactive', label: t('common:status.inactive') }
              ]}
              placeholder={t('settings:user_management.filter_by_status')}
              aria-label={t('settings:user_management.filter_by_status')}
            />
          </div>
        </div>

        {/* Results Info */}
        <div className="text-sm text-neutral-600">
          {state.totalItems > 0 && (
            <span>
              {t('settings:user_management.showing_results', {
                replace: {
                  start: ((state.currentPage - 1) * state.pageSize) + 1,
                  end: Math.min(state.currentPage * state.pageSize, state.totalItems),
                  total: state.totalItems
                }
              })}
            </span>
          )}
        </div>
      </div>

      {/* Error Message */}
      {state.error && (
        <div className="bg-danger-50 border border-danger-200 text-danger-700 px-4 py-3 rounded-md">
          {state.error}
        </div>
      )}

      {/* Users Table */}
      <div className="relative">
        <LoadingOverlay show={state.loading} label={t('settings:user_management.loading_users')} />
        
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('settings:user_fields.full_name')}</TableHead>
              <TableHead>{t('settings:user_fields.email')}</TableHead>
              <TableHead>{t('settings:user_fields.role')}</TableHead>
              <TableHead>{t('settings:user_fields.status')}</TableHead>
              <TableHead className="hidden md:table-cell">{t('settings:user_fields.last_login')}</TableHead>
              <TableHead className="text-right">{t('common:activities')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {state.users.length === 0 && !state.loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-neutral-500">
                  {state.searchQuery || state.roleFilter || state.statusFilter
                    ? t('settings:user_management.no_users_found_filtered')
                    : t('settings:user_management.no_users_found')
                  }
                </TableCell>
              </TableRow>
            ) : (
              state.users.map((user) => (
                <TableRow key={user.id} clickable>
                  <TableCell>
                    <div>
                      <div className="font-medium text-neutral-900">
                        {getUserDisplayName(user)}
                      </div>
                      <div className="text-sm text-neutral-500">
                        @{user.username}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-neutral-900">{user.email}</span>
                  </TableCell>
                  <TableCell>
                    <Badge variant="neutral" size="sm">
                      {getPrimaryRole(user)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant={user.is_active ? 'success' : 'neutral'} 
                      size="sm"
                    >
                      {user.is_active ? t('common:status.active') : t('common:status.inactive')}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-neutral-600">
                    {formatDate(user.updated_at)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEditUser(user)}
                        aria-label={t('settings:user_management.edit_user_aria', { replace: { name: getUserDisplayName(user) } })}
                      >
                        <EditIcon />
                      </Button>
                      
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleToggleUserStatus(user)}
                        loading={actionLoading === `toggle-${user.id}`}
                        aria-label={t('settings:user_management.toggle_user_aria', { 
                          replace: {
                            action: user.is_active ? t('settings:user_management.deactivate_user') : t('settings:user_management.activate_user'),
                            name: getUserDisplayName(user)
                          }
                        })}
                      >
                        <PowerIcon />
                      </Button>
                      
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleViewSessions(user)}
                        aria-label={t('settings:user_management.view_sessions_aria', { replace: { name: getUserDisplayName(user) } })}
                      >
                        <EyeIcon />
                      </Button>
                      
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteUser(user)}
                        className="text-danger-600 hover:text-danger-700 hover:bg-danger-50"
                        aria-label={t('settings:user_management.delete_user_aria', { replace: { name: getUserDisplayName(user) } })}
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

      {/* Pagination */}
      {state.totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-neutral-600">{t('settings:user_management.rows_per_page')}:</span>
            <Select
              value={state.pageSize.toString()}
              onChange={handlePageSizeChange}
              options={[
                { value: '5', label: '5' },
                { value: '10', label: '10' },
                { value: '25', label: '25' },
                { value: '50', label: '50' }
              ]}
              aria-label={t('settings:user_management.rows_per_page')}
            />
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handlePageChange(state.currentPage - 1)}
              disabled={state.currentPage === 1}
              leftIcon={<ChevronLeftIcon />}
              aria-label={t('settings:user_management.previous_page')}
            >
              {t('common:buttons.previous')}
            </Button>

            <div className="flex items-center gap-1">
              {getPaginationNumbers().map((page) => (
                <Button
                  key={page}
                  variant={page === state.currentPage ? 'primary' : 'ghost'}
                  size="sm"
                  onClick={() => handlePageChange(page)}
                  aria-label={t('settings:user_management.go_to_page', { replace: { page } })}
                  aria-current={page === state.currentPage ? 'page' : undefined}
                >
                  {page}
                </Button>
              ))}
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => handlePageChange(state.currentPage + 1)}
              disabled={state.currentPage === state.totalPages}
              rightIcon={<ChevronRightIcon />}
              aria-label={t('settings:user_management.next_page')}
            >
              {t('common:buttons.next')}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserList;