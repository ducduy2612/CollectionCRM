import React, { useState, useEffect } from 'react';
import { Modal, Button, Alert, Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../../../components/ui';
import { ConfirmDialog } from '../../../../components/ui/Modal';
import { authApi, UserResponse, UserSession } from '../../../../services/api/auth.api';

// Icons
const RefreshIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
  </svg>
);

const TrashIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

const DeviceDesktopIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
);

const DeviceMobileIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a1 1 0 001-1V4a1 1 0 00-1-1H8a1 1 0 00-1 1v16a1 1 0 001 1z" />
  </svg>
);

const DeviceTabletIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
  </svg>
);

interface UserSessionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserResponse | null;
}

interface UserSessionsModalState {
  sessions: UserSession[];
  loading: boolean;
  error: string | null;
  terminatingSession: string | null;
  terminatingAll: boolean;
  confirmDialog: {
    isOpen: boolean;
    type: 'single' | 'all';
    sessionId?: string;
  };
}

const UserSessionsModal: React.FC<UserSessionsModalProps> = ({
  isOpen,
  onClose,
  user
}) => {
  const [state, setState] = useState<UserSessionsModalState>({
    sessions: [],
    loading: false,
    error: null,
    terminatingSession: null,
    terminatingAll: false,
    confirmDialog: {
      isOpen: false,
      type: 'single'
    }
  });

  // Load sessions when modal opens or user changes
  useEffect(() => {
    if (isOpen && user) {
      loadSessions();
    }
  }, [isOpen, user]);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setState(prev => ({
        ...prev,
        sessions: [],
        error: null,
        terminatingSession: null,
        terminatingAll: false,
        confirmDialog: { isOpen: false, type: 'single' }
      }));
    }
  }, [isOpen]);

  // Load user sessions
  const loadSessions = async () => {
    if (!user) return;

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const response = await authApi.getUserSessions(user.id);
      console.log(response)
      setState(prev => ({
        ...prev,
        sessions: response.sessions,
        loading: false
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to load user sessions'
      }));
    }
  };

  // Handle refresh sessions
  const handleRefresh = () => {
    loadSessions();
  };

  // Show confirmation dialog for terminating session
  const showTerminateConfirmation = (sessionId?: string) => {
    setState(prev => ({
      ...prev,
      confirmDialog: {
        isOpen: true,
        type: sessionId ? 'single' : 'all',
        sessionId
      }
    }));
  };

  // Hide confirmation dialog
  const hideTerminateConfirmation = () => {
    setState(prev => ({
      ...prev,
      confirmDialog: { isOpen: false, type: 'single' }
    }));
  };

  // Handle terminate single session
  const handleTerminateSession = async (sessionId: string) => {
    if (!user) return;

    setState(prev => ({ ...prev, terminatingSession: sessionId }));

    try {
      await authApi.terminateUserSession(user.id, sessionId);
      
      // Remove the session from the list
      setState(prev => ({
        ...prev,
        sessions: prev.sessions.filter(s => s.id !== sessionId),
        terminatingSession: null
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        terminatingSession: null,
        error: error instanceof Error ? error.message : 'Failed to terminate session'
      }));
    }
  };

  // Handle terminate all sessions
  const handleTerminateAllSessions = async () => {
    if (!user) return;

    setState(prev => ({ ...prev, terminatingAll: true }));

    try {
      await authApi.terminateUserSessions(user.id);
      setState(prev => ({
        ...prev,
        sessions: [],
        terminatingAll: false
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        terminatingAll: false,
        error: error instanceof Error ? error.message : 'Failed to terminate all sessions'
      }));
    }
  };

  // Handle confirmation dialog confirm
  const handleConfirmTerminate = () => {
    const { type, sessionId } = state.confirmDialog;
    hideTerminateConfirmation();

    if (type === 'single' && sessionId) {
      handleTerminateSession(sessionId);
    } else if (type === 'all') {
      handleTerminateAllSessions();
    }
  };

  // Get device icon based on device type
  const getDeviceIcon = (deviceType: string | undefined) => {
    if (!deviceType) {
      return <DeviceDesktopIcon />;
    }
    
    const type = deviceType.toLowerCase();
    if (type.includes('mobile') || type.includes('phone')) {
      return <DeviceMobileIcon />;
    } else if (type.includes('tablet') || type.includes('ipad')) {
      return <DeviceTabletIcon />;
    }
    return <DeviceDesktopIcon />;
  };

  // Format last activity time
  const formatLastActivity = (lastActivity: string) => {
    const date = new Date(lastActivity);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString();
  };

  // Get session status
  const getSessionStatus = (session: UserSession) => {
    const now = new Date();
    const expiresAt = new Date(session.expiresAt);
    const lastActivity = new Date(session.lastActivityAt);
    const timeSinceActivity = now.getTime() - lastActivity.getTime();
    const thirtyMinutes = 30 * 60 * 1000;

    if (now > expiresAt) {
      return { status: 'Expired', className: 'text-neutral-500 bg-neutral-100' };
    } else if (timeSinceActivity > thirtyMinutes) {
      return { status: 'Inactive', className: 'text-warning-700 bg-warning-100' };
    } else {
      return { status: 'Active', className: 'text-success-700 bg-success-100' };
    }
  };

  if (!user) return null;

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={`${user.username}'s Sessions`}
        description="View and manage active user sessions across different devices"
        size="xl"
        closeOnOverlayClick={!state.terminatingAll}
        closeOnEsc={!state.terminatingAll}
      >
        <div className="space-y-4">
          {/* Error Alert */}
          {state.error && (
            <Alert variant="danger">
              {state.error}
            </Alert>
          )}

          {/* Actions Bar */}
          <div className="flex justify-between items-center">
            <div className="text-sm text-neutral-600">
              {state.loading ? 'Loading sessions...' : `${state.sessions.length} session(s) found`}
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={handleRefresh}
                disabled={state.loading || state.terminatingAll}
                className="flex items-center gap-2"
              >
                <RefreshIcon />
                Refresh
              </Button>
              {state.sessions.length > 0 && (
                <Button
                  type="button"
                  variant="danger"
                  size="sm"
                  onClick={() => showTerminateConfirmation()}
                  disabled={state.loading || state.terminatingAll}
                  loading={state.terminatingAll}
                  className="flex items-center gap-2"
                >
                  <TrashIcon />
                  Terminate All
                </Button>
              )}
            </div>
          </div>

          {/* Sessions Table */}
          {state.loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
          ) : state.sessions.length === 0 ? (
            <div className="text-center py-8 text-neutral-500">
              No active sessions found for this user.
            </div>
          ) : (
            <div className="border border-neutral-200 rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Device</TableHead>
                    <TableHead>Browser</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Last Activity</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {state.sessions.map((session) => {
                    const sessionStatus = getSessionStatus(session);
                    return (
                      <TableRow key={session.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getDeviceIcon(session.deviceInfo?.deviceType)}
                            <div>
                              <div className="font-medium text-sm">
                                {session.deviceInfo?.deviceType || 'Unknown Device'}
                              </div>
                              {session.deviceInfo?.os && (
                                <div className="text-xs text-neutral-500">
                                  {session.deviceInfo.os}
                                </div>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {session.deviceInfo?.browser || 'Unknown Browser'}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {session.deviceInfo?.ip || 'Unknown Location'}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {formatLastActivity(session.lastActivityAt)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${sessionStatus.className}`}>
                            {sessionStatus.status}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Button
                            type="button"
                            variant="danger"
                            size="sm"
                            onClick={() => showTerminateConfirmation(session.id)}
                            disabled={state.terminatingSession === session.id}
                            loading={state.terminatingSession === session.id}
                            className="flex items-center gap-1"
                          >
                            <TrashIcon />
                            Terminate
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Modal Actions */}
          <div className="flex justify-end pt-4 border-t border-neutral-200">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              disabled={state.terminatingAll}
            >
              Close
            </Button>
          </div>
        </div>
      </Modal>

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={state.confirmDialog.isOpen}
        onClose={hideTerminateConfirmation}
        onConfirm={handleConfirmTerminate}
        title={state.confirmDialog.type === 'single' ? 'Terminate Session' : 'Terminate All Sessions'}
        description={
          state.confirmDialog.type === 'single'
            ? 'Are you sure you want to terminate this session? The user will be logged out from this device.'
            : `Are you sure you want to terminate all sessions for ${user.username}? The user will be logged out from all devices.`
        }
        confirmText="Terminate"
        cancelText="Cancel"
        variant="danger"
        loading={state.terminatingSession !== null || state.terminatingAll}
      />
    </>
  );
};

export default UserSessionsModal;