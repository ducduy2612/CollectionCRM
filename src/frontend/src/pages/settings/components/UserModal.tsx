import React, { useState, useEffect } from 'react';
import { Modal, Input, Select, Button, Alert } from '../../../components/ui';
import { authApi, UserResponse, UserData, UpdateUserData, RoleResponse } from '../../../services/api/auth.api';

// Icons
const EyeIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
  </svg>
);

const EyeSlashIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
  </svg>
);

interface UserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  user?: UserResponse | null;
  mode: 'create' | 'edit';
}

interface FormData {
  username: string;
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  role: string;
}

interface FormErrors {
  username?: string;
  email?: string;
  password?: string;
  first_name?: string;
  last_name?: string;
  role?: string;
  general?: string;
}

interface UserModalState {
  formData: FormData;
  errors: FormErrors;
  loading: boolean;
  showPassword: boolean;
  roles: RoleResponse[];
  loadingRoles: boolean;
}

const UserModal: React.FC<UserModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  user,
  mode
}) => {
  const [state, setState] = useState<UserModalState>({
    formData: {
      username: '',
      email: '',
      password: '',
      first_name: '',
      last_name: '',
      role: ''
    },
    errors: {},
    loading: false,
    showPassword: false,
    roles: [],
    loadingRoles: false
  });

  // Load roles when modal opens
  useEffect(() => {
    if (isOpen) {
      loadRoles();
    }
  }, [isOpen]);

  // Initialize form data when user or mode changes
  useEffect(() => {
    if (isOpen) {
      if (mode === 'edit' && user) {
        setState(prev => ({
          ...prev,
          formData: {
            username: user.username,
            email: user.email,
            password: '', // Never populate password for edit
            first_name: user.first_name || '',
            last_name: user.last_name || '',
            role: user.roles[0] || ''
          },
          errors: {}
        }));
      } else {
        // Reset form for create mode
        setState(prev => ({
          ...prev,
          formData: {
            username: '',
            email: '',
            password: '',
            first_name: '',
            last_name: '',
            role: ''
          },
          errors: {}
        }));
      }
    }
  }, [isOpen, mode, user]);

  // Load available roles
  const loadRoles = async () => {
    setState(prev => ({ ...prev, loadingRoles: true }));
    
    try {
      const response = await authApi.getRoles();
      setState(prev => ({
        ...prev,
        roles: response.roles,
        loadingRoles: false
      }));
    } catch (error) {
      console.error('Failed to load roles:', error);
      setState(prev => ({
        ...prev,
        loadingRoles: false,
        errors: { general: 'Failed to load roles' }
      }));
    }
  };

  // Validation functions
  const validateUsername = (username: string): string | undefined => {
    if (!username.trim()) {
      return 'Username is required';
    }
    if (username.length < 3) {
      return 'Username must be at least 3 characters long';
    }
    return undefined;
  };

  const validateEmail = (email: string): string | undefined => {
    if (!email.trim()) {
      return 'Email is required';
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return 'Please enter a valid email address';
    }
    return undefined;
  };

  const validatePassword = (password: string): string | undefined => {
    if (mode === 'create' && !password.trim()) {
      return 'Password is required';
    }
    if (password && password.length < 8) {
      return 'Password must be at least 8 characters long';
    }
    if (password && !/(?=.*[a-zA-Z])(?=.*\d)/.test(password)) {
      return 'Password must contain both letters and numbers';
    }
    return undefined;
  };

  const validateRole = (role: string): string | undefined => {
    if (!role.trim()) {
      return 'Role is required';
    }
    const validRoles = state.roles.map(r => r.name);
    if (!validRoles.includes(role)) {
      return 'Please select a valid role';
    }
    return undefined;
  };

  // Validate entire form
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    newErrors.username = validateUsername(state.formData.username);
    newErrors.email = validateEmail(state.formData.email);
    newErrors.password = validatePassword(state.formData.password);
    newErrors.role = validateRole(state.formData.role);

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
  const handleInputChange = (field: keyof FormData) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const value = e.target.value;
    setState(prev => ({
      ...prev,
      formData: { ...prev.formData, [field]: value },
      errors: { ...prev.errors, [field]: undefined, general: undefined }
    }));
  };

  // Toggle password visibility
  const togglePasswordVisibility = () => {
    setState(prev => ({ ...prev, showPassword: !prev.showPassword }));
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
        const userData: UserData = {
          username: state.formData.username.trim(),
          email: state.formData.email.trim(),
          password: state.formData.password,
          first_name: state.formData.first_name.trim() || undefined,
          last_name: state.formData.last_name.trim() || undefined,
          role: state.formData.role
        };

        await authApi.createUser(userData);
      } else if (mode === 'edit' && user) {
        const updateData: UpdateUserData = {
          email: state.formData.email.trim(),
          first_name: state.formData.first_name.trim() || undefined,
          last_name: state.formData.last_name.trim() || undefined,
          role: state.formData.role
        };

        await authApi.updateUser(user.id, updateData);
      }

      // Reset loading state before calling onSuccess
      setState(prev => ({ ...prev, loading: false }));
      onSuccess();
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        errors: {
          general: error instanceof Error ? error.message : `Failed to ${mode} user`
        }
      }));
    }
  };

  // Handle modal close
  const handleClose = () => {
    if (!state.loading) {
      setState(prev => ({
        ...prev,
        formData: {
          username: '',
          email: '',
          password: '',
          first_name: '',
          last_name: '',
          role: ''
        },
        errors: {},
        showPassword: false
      }));
      onClose();
    }
  };

  const roleOptions = state.roles.map(role => ({
    value: role.name,
    label: role.name.charAt(0).toUpperCase() + role.name.slice(1)
  }));

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={mode === 'create' ? 'Create New User' : 'Edit User'}
      description={mode === 'create' 
        ? 'Add a new user to the system with their role and permissions'
        : 'Update user information and role assignments'
      }
      size="md"
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

        {/* Username Field */}
        <div>
          <Input
            label="Username"
            type="text"
            value={state.formData.username}
            onChange={handleInputChange('username')}
            error={state.errors.username}
            disabled={mode === 'edit' || state.loading}
            placeholder="Enter username"
            required
            aria-describedby={state.errors.username ? 'username-error' : undefined}
          />
          {mode === 'edit' && (
            <p className="mt-1 text-xs text-neutral-500">
              Username cannot be changed after creation
            </p>
          )}
        </div>

        {/* Email Field */}
        <div>
          <Input
            label="Email"
            type="email"
            value={state.formData.email}
            onChange={handleInputChange('email')}
            error={state.errors.email}
            disabled={state.loading}
            placeholder="Enter email address"
            required
            aria-describedby={state.errors.email ? 'email-error' : undefined}
          />
        </div>

        {/* Password Field (Create only) */}
        {mode === 'create' && (
          <div>
            <div className="relative">
              <Input
                label="Password"
                type={state.showPassword ? 'text' : 'password'}
                value={state.formData.password}
                onChange={handleInputChange('password')}
                error={state.errors.password}
                disabled={state.loading}
                placeholder="Enter password"
                required
                aria-describedby={state.errors.password ? 'password-error' : undefined}
              />
              <button
                type="button"
                className="absolute right-3 top-8 text-neutral-400 hover:text-neutral-600 focus:outline-none"
                onClick={togglePasswordVisibility}
                tabIndex={-1}
                aria-label={state.showPassword ? 'Hide password' : 'Show password'}
              >
                {state.showPassword ? <EyeSlashIcon /> : <EyeIcon />}
              </button>
            </div>
            <p className="mt-1 text-xs text-neutral-500">
              Password must be at least 8 characters and contain both letters and numbers
            </p>
          </div>
        )}

        {/* Name Fields */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Input
              label="First Name"
              type="text"
              value={state.formData.first_name}
              onChange={handleInputChange('first_name')}
              error={state.errors.first_name}
              disabled={state.loading}
              placeholder="Enter first name"
              aria-describedby={state.errors.first_name ? 'first-name-error' : undefined}
            />
          </div>
          <div>
            <Input
              label="Last Name"
              type="text"
              value={state.formData.last_name}
              onChange={handleInputChange('last_name')}
              error={state.errors.last_name}
              disabled={state.loading}
              placeholder="Enter last name"
              aria-describedby={state.errors.last_name ? 'last-name-error' : undefined}
            />
          </div>
        </div>

        {/* Role Field */}
        <div>
          <Select
            label="Role"
            value={state.formData.role}
            onChange={handleInputChange('role')}
            options={[
              { value: '', label: 'Select a role...' },
              ...roleOptions
            ]}
            error={state.errors.role}
            disabled={state.loading || state.loadingRoles}
            required
            aria-describedby={state.errors.role ? 'role-error' : undefined}
          />
          {state.loadingRoles && (
            <p className="mt-1 text-xs text-neutral-500">Loading roles...</p>
          )}
        </div>

        {/* Form Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-neutral-200">
          <Button
            type="button"
            variant="secondary"
            onClick={handleClose}
            disabled={state.loading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            loading={state.loading}
            disabled={state.loadingRoles}
          >
            {mode === 'create' ? 'Create User' : 'Update User'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default UserModal;