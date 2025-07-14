import React, { useState, useMemo } from 'react';
import { Button } from '../../components/ui/Button';
import { CogIcon, ArrowPathIcon, CheckIcon } from '@heroicons/react/24/outline';
import { QuickActions, SettingsCard } from './shared';
import { useAuth } from '../../hooks/useAuth';
import { useSettingsStats } from './hooks/useSettingsStats';
import { Spinner } from '../../components/ui/Spinner';

interface SettingsStat {
  value: string;
  label: string;
}

interface SettingsCardData {
  id: string;
  title: string;
  description: string;
  icon: string;
  stats: SettingsStat[];
  actionText: string;
  actionLink: string;
  status: {
    type: 'active' | 'inactive' | 'warning';
    label: string;
  };
  requiredPermission?: string;
}

const SettingsPage: React.FC = () => {
  const { user } = useAuth();
  const { stats, isLoading } = useSettingsStats();

  // Helper function to check if user has permission
  const hasPermission = (requiredPermission: string): boolean => {
    if (!user || !user.permissions) return false;
    return user.permissions.some(permission =>
      permission.startsWith(requiredPermission + ':') || permission === requiredPermission
    );
  };

  const settingsCards: SettingsCardData[] = useMemo(() => [
    {
      id: 'user-management',
      title: 'User Management',
      description: 'Manage user accounts, roles, and permissions. Control access levels and monitor user activity across the system.',
      icon: 'bi-people',
      stats: [
        { value: stats.userManagement.activeUsers.toString(), label: 'Active Users' },
        { value: stats.userManagement.totalRoles.toString(), label: 'Roles' },
        { value: stats.userManagement.pendingUsers.toString(), label: 'Pending' }
      ],
      actionText: 'Manage Users',
      actionLink: '/settings/user-management',
      status: { type: 'active', label: 'Active' },
      requiredPermission: 'user_management'
    },
    {
      id: 'actions-config',
      title: 'Actions Config',
      description: 'Configure automated actions and workflows for collection processes. Set up triggers, conditions, and responses.',
      icon: 'bi-lightning',
      stats: [
        { value: stats.actionsConfig.types.toString(), label: 'Types' },
        { value: stats.actionsConfig.subtypes.toString(), label: 'Subtypes' },
        { value: stats.actionsConfig.results.toString(), label: 'Results' }
      ],
      actionText: 'Configure Actions',
      actionLink: '/settings/actions-config',
      status: { type: 'active', label: 'Running' },
      requiredPermission: 'action_config'
    },
    {
      id: 'fud-auto-config',
      title: 'FUD Auto Config',
      description: 'Configure automated Follow-Up and Dunning processes. Set up intelligent scheduling and escalation rules.',
      icon: 'bi-robot',
      stats: [
        { value: stats.fudAutoConfig.totalRules.toString(), label: 'Total Rules' },
        { value: stats.fudAutoConfig.activeRules.toString(), label: 'Active Rules' }
      ],
      actionText: 'Configure FUD',
      actionLink: '/settings/fud-auto-config',
      status: { type: 'active', label: 'Automated' },
      requiredPermission: 'FUD_config:edit'
    },
    {
      id: 'queue-campaign-config',
      title: 'Queue Campaign Config',
      description: 'Manage collection queues and campaign configurations. Set up prioritization rules and contact exclusions.',
      icon: 'bi-list-task',
      stats: [
        { value: stats.queueCampaign.activeQueues.toString(), label: 'Campaign Groups' },
        { value: stats.queueCampaign.totalCases.toLocaleString(), label: 'Campaigns' },
      ],
      actionText: 'Manage Queues',
      actionLink: '/settings/queue-campaign',
      status: { type: 'active', label: 'Active' },
      requiredPermission: 'campaign_management'
    },
    {
      id: 'customer-assignment-upload',
      title: 'Customer Assignment Upload',
      description: 'Upload and manage customer assignment files. Configure bulk import settings and validation rules.',
      icon: 'bi-upload',
      stats: [
        { value: '50mb', label: 'Maximum file size' },
        { value: 'CSV', label: 'File format' },
      ],
      actionText: 'Upload Data',
      actionLink: '/settings/customer-assignment',
      status: { type: 'active', label: 'Ready' },
      requiredPermission: 'customer_assignment'
    },
    {
      id: 'audit-log',
      title: 'Audit Log',
      description: 'View and analyze system audit logs with date-based filtering for security monitoring and compliance.',
      icon: 'bi-clipboard-data',
      stats: [
        { value: '2.1K', label: 'Today\'s Logs' },
        { value: '45K', label: 'This Month' },
        { value: '8', label: 'Services' }
      ],
      actionText: 'View Logs',
      actionLink: '/settings/audit-log',
      status: { type: 'active', label: 'Monitoring' },
      requiredPermission: 'audit_view'
    }
  ], [stats]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-neutral-900 flex items-center">
            <CogIcon className="w-8 h-8 mr-2 text-primary-600" />
            System Settings
          </h1>
        </div>
        <div className="flex justify-center items-center h-64">
          <Spinner size="lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-neutral-900 flex items-center">
          <CogIcon className="w-8 h-8 mr-2 text-primary-600" />
          System Settings
        </h1>
      </div>

      {/* Quick Actions */}
      <QuickActions />

      {/* Settings Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {settingsCards.map((card) => (
          <SettingsCard
            key={card.id}
            {...card}
            disabled={card.requiredPermission ? !hasPermission(card.requiredPermission) : false}
          />
        ))}
      </div>
    </div>
  );
};

export default SettingsPage;