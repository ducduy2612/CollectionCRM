import React, { useState, useEffect } from 'react';
import { Modal, Input, Button, Alert } from '../../../../components/ui';
import { authApi, RoleResponse, RoleData, UpdateRoleData, PermissionData } from '../../../../services/api/auth.api';
import { useTranslation } from '../../../../i18n/hooks/useTranslation';

// Available permissions based on backend format (resource:action)
const AVAILABLE_PERMISSIONS = [
  // User Management
  'users:create',
  'users:read',
  'users:update',
  'users:delete',
  
  // Role Management
  'roles:create',
  'roles:read',
  'roles:update',
  'roles:delete',
  
  // Customer Management
  'customers:create',
  'customers:read',
  'customers:update',
  'customers:delete',
  
  // Workflow Management
  'workflows:create',
  'workflows:read',
  'workflows:update',
  'workflows:delete',
  
  // System Access
  'admin:access',
  'supervisor:access'
];

// Helper function to format permission labels for display
const formatPermissionLabel = (permission: string): string => {
  if (permission.includes(':')) {
    const [resource, action] = permission.split(':');
    const resourceLabel = resource.charAt(0).toUpperCase() + resource.slice(1);
    const actionLabel = action.charAt(0).toUpperCase() + action.slice(1);
    return `${actionLabel} ${resourceLabel}`;
  }
  // Fallback for any non-standard permissions
  return permission.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
};

// Helper function to convert permission strings to backend format
const convertPermissionsToBackendFormat = (permissions: string[]): PermissionData[] => {
  return permissions.map(permission => {
    if (permission.includes(':')) {
      const [resource, action] = permission.split(':');
      return { resource, action };
    }
    // Fallback for any non-standard permissions
    return { resource: permission, action: 'access' };
  });
};

// Helper function to convert backend permissions to frontend format
const convertPermissionsFromBackendFormat = (permissions: string[]) => {
  // Backend returns permissions as "resource:action" strings, so no conversion needed
  return permissions;
};

interface RoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  role?: RoleResponse | null; // null for create, RoleResponse for edit
  mode: 'create' | 'edit';
}

interface FormData {
  name: string;
  description: string;
  permissions: string[];
}

interface FormErrors {
  name?: string;
  description?: string;
  permissions?: string;
  general?: string;
}

interface RoleModalState {
  formData: FormData;
  errors: FormErrors;
  loading: boolean;
}

const RoleModal: React.FC<RoleModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  role,
  mode
}) => {
  const { t } = useTranslation();
  const [state, setState] = useState<RoleModalState>({
    formData: {
      name: '',
      description: '',
      permissions: []
    },
    errors: {},
    loading: false
  });

  // Initialize form data when role or mode changes
  useEffect(() => {
    if (isOpen) {
      if (mode === 'edit' && role) {
        setState(prev => ({
          ...prev,
          formData: {
            name: role.name,
            description: role.description || '',
            permissions: [...role.permissions]
          },
          errors: {}
        }));
      } else {
        // Reset form for create mode
        setState(prev => ({
          ...prev,
          formData: {
            name: '',
            description: '',
            permissions: []
          },
          errors: {}
        }));
      }
    }
  }, [isOpen, mode, role]);

  // Validation functions
  const validateName = (name: string): string | undefined => {
    if (!name.trim()) {
      return 'Role name is required';
    }
    if (name.length < 2) {
      return 'Role name must be at least 2 characters long';
    }
    if (!/^[a-zA-Z0-9_\s]+$/.test(name)) {
      return 'Role name can only contain letters, numbers, underscores, and spaces';
    }
    return undefined;
  };

  const validatePermissions = (permissions: string[]): string | undefined => {
    if (permissions.length === 0) {
      return 'At least one permission must be selected';
    }
    const invalidPermissions = permissions.filter(p => !AVAILABLE_PERMISSIONS.includes(p));
    if (invalidPermissions.length > 0) {
      return `Invalid permissions: ${invalidPermissions.join(', ')}`;
    }
    return undefined;
  };

  // Validate entire form
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    newErrors.name = validateName(state.formData.name);
    newErrors.permissions = validatePermissions(state.formData.permissions);

    // Remove undefined errors
    Object.keys(newErrors).forEach(key => {
      if (newErrors[key as keyof FormErrors] === undefined) {
        delete newErrors[key as keyof FormErrors];
      }
    });

    setState(prev => ({ ...prev, errors: newErrors }));
    return Object.keys(newErrors).length === 0;
  };

  // Handle input changes
  const handleInputChange = (field: keyof Omit<FormData, 'permissions'>) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const value = e.target.value;
    setState(prev => ({
      ...prev,
      formData: { ...prev.formData, [field]: value },
      errors: { ...prev.errors, [field]: undefined, general: undefined }
    }));
  };

  // Handle permission changes
  const handlePermissionChange = (permission: string) => {
    setState(prev => {
      const currentPermissions = prev.formData.permissions;
      const newPermissions = currentPermissions.includes(permission)
        ? currentPermissions.filter(p => p !== permission)
        : [...currentPermissions, permission];

      return {
        ...prev,
        formData: { ...prev.formData, permissions: newPermissions },
        errors: { ...prev.errors, permissions: undefined, general: undefined }
      };
    });
  };

  // Handle select all permissions
  const handleSelectAllPermissions = () => {
    setState(prev => ({
      ...prev,
      formData: { 
        ...prev.formData, 
        permissions: prev.formData.permissions.length === AVAILABLE_PERMISSIONS.length 
          ? [] 
          : [...AVAILABLE_PERMISSIONS] 
      },
      errors: { ...prev.errors, permissions: undefined, general: undefined }
    }));
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setState(prev => ({ ...prev, loading: true, errors: {} }));

    try {
      if (mode === 'create') {
        const roleData: RoleData = {
          name: state.formData.name.trim(),
          description: state.formData.description.trim() || undefined,
          permissions: convertPermissionsToBackendFormat(state.formData.permissions)
        };

        await authApi.createRole(roleData);
      } else if (mode === 'edit' && role) {
        const updateData: UpdateRoleData = {
          description: state.formData.description.trim() || undefined,
          permissions: convertPermissionsToBackendFormat(state.formData.permissions)
        };

        await authApi.updateRole(role.id, updateData);
      }

      onSuccess();
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        errors: {
          general: error instanceof Error ? error.message : `Failed to ${mode} role`
        }
      }));
    } finally {
      // Ensure loading is always set to false
      setState(prev => ({ ...prev, loading: false }));
    }
  };

  // Handle modal close
  const handleClose = () => {
    if (!state.loading) {
      setState(prev => ({
        ...prev,
        formData: {
          name: '',
          description: '',
          permissions: []
        },
        errors: {}
      }));
      onClose();
    }
  };

  // Group permissions by category for better organization
  const permissionGroups = {
    [t('settings:titles.user_management')]: ['users:create', 'users:read', 'users:update', 'users:delete'],
    [t('settings:user_management.roles')]: ['roles:create', 'roles:read', 'roles:update', 'roles:delete'],
    [t('settings:messages.customer_management', { defaultValue: 'Customer Management' })]: ['customers:create', 'customers:read', 'customers:update', 'customers:delete'],
    [t('settings:messages.workflow_management', { defaultValue: 'Workflow Management' })]: ['workflows:create', 'workflows:read', 'workflows:update', 'workflows:delete'],
    [t('settings:messages.system_access', { defaultValue: 'System Access' })]: ['admin:access', 'supervisor:access']
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={mode === 'create' ? t('settings:user_management.add_role', { defaultValue: 'Create New Role' }) : t('settings:user_management.edit_role', { defaultValue: 'Edit Role' })}
      description={mode === 'create'
        ? t('settings:messages.create_role_description', { defaultValue: 'Create a new role with specific permissions for system access' })
        : t('settings:messages.edit_role_description', { defaultValue: 'Update role permissions and settings' })
      }
      size="lg"
      closeOnOverlayClick={!state.loading}
      closeOnEsc={!state.loading}
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* General Error */}
        {state.errors.general && (
          <Alert variant="danger">
            {state.errors.general}
          </Alert>
        )}

        {/* Role Name Field */}
        <div>
          <Input
            label={t('settings:user_fields.role')}
            type="text"
            value={state.formData.name}
            onChange={handleInputChange('name')}
            error={state.errors.name}
            disabled={mode === 'edit' || state.loading}
            placeholder={t('settings:messages.enter_role_name', { defaultValue: 'Enter role name' })}
            required
            aria-describedby={state.errors.name ? 'name-error' : undefined}
          />
          {mode === 'edit' && (
            <p className="mt-1 text-xs text-neutral-500">
              {t('settings:messages.role_name_cannot_change', { defaultValue: 'Role name cannot be changed after creation' })}
            </p>
          )}
        </div>

        {/* Description Field */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-neutral-700 mb-1">
            {t('forms:labels.description')}
          </label>
          <textarea
            id="description"
            value={state.formData.description}
            onChange={handleInputChange('description')}
            disabled={state.loading}
            placeholder={t('forms:placeholders.enter_description')}
            rows={3}
            className="w-full px-3 py-2 border border-neutral-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-neutral-50 disabled:text-neutral-500"
            aria-describedby={state.errors.description ? 'description-error' : undefined}
          />
          {state.errors.description && (
            <p id="description-error" className="mt-1 text-xs text-danger-600">
              {state.errors.description}
            </p>
          )}
        </div>

        {/* Permissions Field */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="block text-sm font-medium text-neutral-700">
              {t('settings:user_management.permissions')} *
            </label>
            <button
              type="button"
              onClick={handleSelectAllPermissions}
              disabled={state.loading}
              className="text-sm text-primary-600 hover:text-primary-700 focus:outline-none focus:underline disabled:opacity-50"
            >
              {state.formData.permissions.length === AVAILABLE_PERMISSIONS.length
                ? t('tables:actions.deselect_all')
                : t('tables:actions.select_all')
              }
            </button>
          </div>

          <div className="space-y-4 max-h-64 overflow-y-auto border border-neutral-200 rounded-md p-4">
            {Object.entries(permissionGroups).map(([groupName, permissions]) => (
              <div key={groupName}>
                <h4 className="text-sm font-medium text-neutral-800 mb-2">{groupName}</h4>
                <div className="space-y-2 ml-4">
                  {permissions.map(permission => (
                    <label key={permission} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={state.formData.permissions.includes(permission)}
                        onChange={() => handlePermissionChange(permission)}
                        disabled={state.loading}
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-neutral-300 rounded disabled:opacity-50"
                      />
                      <span className="ml-2 text-sm text-neutral-700">
                        {formatPermissionLabel(permission)}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {state.errors.permissions && (
            <p className="mt-1 text-xs text-danger-600">
              {state.errors.permissions}
            </p>
          )}

          <p className="mt-2 text-xs text-neutral-500">
            {t('settings:messages.selected_permissions', {
              defaultValue: 'Selected {{selected}} of {{total}} permissions',
              replace: {
                selected: state.formData.permissions.length.toString(),
                total: AVAILABLE_PERMISSIONS.length.toString()
              }
            })}
          </p>
        </div>

        {/* Form Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-neutral-200">
          <Button
            type="button"
            variant="secondary"
            onClick={handleClose}
            disabled={state.loading}
          >
            {t('common:cancel')}
          </Button>
          <Button
            type="submit"
            variant="primary"
            loading={state.loading}
          >
            {mode === 'create' ? t('settings:user_management.add_role', { defaultValue: 'Create Role' }) : t('settings:user_management.edit_role', { defaultValue: 'Update Role' })}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default RoleModal;