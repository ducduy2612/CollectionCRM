import React, { useState, useMemo } from 'react';
import { Button } from '../../components/ui/Button';
import { CogIcon, ArrowPathIcon, CheckIcon } from '@heroicons/react/24/outline';
import { QuickActions, SettingsCard } from './shared';
import { useAuth } from '../../hooks/useAuth';
import { useSettingsStats } from './hooks/useSettingsStats';
import { Spinner } from '../../components/ui/Spinner';
import { useTranslation } from '../../i18n/hooks/useTranslation';

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
  const { t } = useTranslation(['settings', 'common']);

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
      title: t('settings:cards.user_management.title'),
      description: t('settings:cards.user_management.description'),
      icon: 'bi-people',
      stats: [
        { value: stats.userManagement.activeUsers.toString(), label: t('settings:stats.active_users') },
        { value: stats.userManagement.totalRoles.toString(), label: t('settings:stats.roles') },
        { value: stats.userManagement.pendingUsers.toString(), label: t('settings:stats.pending') }
      ],
      actionText: t('settings:actions.manage_users'),
      actionLink: '/settings/user-management',
      status: { type: 'active', label: t('common:status.active') },
      requiredPermission: 'user_management'
    },
    {
      id: 'actions-config',
      title: t('settings:cards.actions_config.title'),
      description: t('settings:cards.actions_config.description'),
      icon: 'bi-lightning',
      stats: [
        { value: stats.actionsConfig.types.toString(), label: t('settings:stats.types') },
        { value: stats.actionsConfig.subtypes.toString(), label: t('settings:stats.subtypes') },
        { value: stats.actionsConfig.results.toString(), label: t('settings:stats.results') }
      ],
      actionText: t('settings:actions.configure_actions'),
      actionLink: '/settings/actions-config',
      status: { type: 'active', label: t('settings:status.running') },
      requiredPermission: 'action_config'
    },
    {
      id: 'fud-auto-config',
      title: t('settings:cards.fud_auto_config.title'),
      description: t('settings:cards.fud_auto_config.description'),
      icon: 'bi-robot',
      stats: [
        { value: stats.fudAutoConfig.totalRules.toString(), label: t('settings:stats.total_rules') },
        { value: stats.fudAutoConfig.activeRules.toString(), label: t('settings:stats.active_rules') }
      ],
      actionText: t('settings:actions.configure_fud'),
      actionLink: '/settings/fud-auto-config',
      status: { type: 'active', label: t('settings:status.automated') },
      requiredPermission: 'FUD_config:all'
    },
    {
      id: 'queue-campaign-config',
      title: t('settings:cards.queue_campaign_config.title'),
      description: t('settings:cards.queue_campaign_config.description'),
      icon: 'bi-list-task',
      stats: [
        { value: stats.queueCampaign.activeQueues.toString(), label: t('settings:stats.campaign_groups') },
        { value: stats.queueCampaign.totalCases.toLocaleString(), label: t('settings:stats.campaigns') },
      ],
      actionText: t('settings:actions.manage_queues'),
      actionLink: '/settings/queue-campaign',
      status: { type: 'active', label: t('common:status.active') },
      requiredPermission: 'campaign_management'
    },
    {
      id: 'customer-assignment-upload',
      title: t('settings:cards.customer_assignment_upload.title'),
      description: t('settings:cards.customer_assignment_upload.description'),
      icon: 'bi-upload',
      stats: [
        { value: '50mb', label: t('settings:stats.maximum_file_size') },
        { value: 'CSV', label: t('settings:stats.file_format') },
      ],
      actionText: t('settings:actions.upload_data'),
      actionLink: '/settings/customer-assignment',
      status: { type: 'active', label: t('settings:status.ready') },
      requiredPermission: 'customer_assignment'
    },
    {
      id: 'audit-log',
      title: t('settings:cards.audit_log.title'),
      description: t('settings:cards.audit_log.description'),
      icon: 'bi-clipboard-data',
      stats: [
        { value: '2.1K', label: t('settings:stats.todays_logs') },
        { value: '45K', label: t('settings:stats.this_month') },
        { value: '8', label: t('settings:stats.services') }
      ],
      actionText: t('settings:actions.view_logs'),
      actionLink: '/settings/audit-log',
      status: { type: 'active', label: t('settings:status.monitoring') },
      requiredPermission: 'audit_view'
    }
  ], [stats, t]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-neutral-900 flex items-center">
            <CogIcon className="w-8 h-8 mr-2 text-primary-600" />
            {t('settings:page.title')}
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