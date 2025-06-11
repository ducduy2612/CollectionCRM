import React, { useState } from 'react';
import { Button } from '../../components/ui/Button';
import { CogIcon, ArrowPathIcon, CheckIcon } from '@heroicons/react/24/outline';
import { QuickActions, SettingsCard } from './shared';

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
}

const SettingsPage: React.FC = () => {
  const [loading, setLoading] = useState(false);

  const handleRefresh = () => {
    setLoading(true);
    // Simulate refresh action
    setTimeout(() => {
      setLoading(false);
    }, 1000);
  };

  const handleSaveAll = () => {
    // Handle save all changes
    console.log('Saving all changes...');
  };

  const settingsCards: SettingsCardData[] = [
    {
      id: 'user-management',
      title: 'User Management',
      description: 'Manage user accounts, roles, and permissions. Control access levels and monitor user activity across the system.',
      icon: 'bi-people',
      stats: [
        { value: '24', label: 'Active Users' },
        { value: '4', label: 'Roles' },
        { value: '2', label: 'Pending' }
      ],
      actionText: 'Manage Users',
      actionLink: '/settings/user-management',
      status: { type: 'active', label: 'Active' }
    },
    {
      id: 'actions-config',
      title: 'Actions Config',
      description: 'Configure automated actions and workflows for collection processes. Set up triggers, conditions, and responses.',
      icon: 'bi-lightning',
      stats: [
        { value: '12', label: 'Active Rules' },
        { value: '3', label: 'Categories' },
        { value: '98%', label: 'Success Rate' }
      ],
      actionText: 'Configure Actions',
      actionLink: '/settings/actions-config',
      status: { type: 'active', label: 'Running' }
    },
    {
      id: 'fud-auto-config',
      title: 'FUD Auto Config',
      description: 'Configure automated Follow-Up and Dunning processes. Set up intelligent scheduling and escalation rules.',
      icon: 'bi-robot',
      stats: [
        { value: '8', label: 'Auto Rules' },
        { value: '156', label: 'Daily Actions' },
        { value: '85%', label: 'Efficiency' }
      ],
      actionText: 'Configure FUD',
      actionLink: '/settings/fud-auto-config',
      status: { type: 'active', label: 'Automated' }
    },
    {
      id: 'queue-campaign-config',
      title: 'Queue Campaign Config',
      description: 'Manage collection queues and campaign configurations. Set up prioritization rules and agent assignments.',
      icon: 'bi-list-task',
      stats: [
        { value: '6', label: 'Active Queues' },
        { value: '1,247', label: 'Total Cases' },
        { value: '92%', label: 'Processing' }
      ],
      actionText: 'Manage Queues',
      actionLink: '/settings/queue-campaign',
      status: { type: 'active', label: 'Processing' }
    },
    {
      id: 'customer-assignment-upload',
      title: 'Customer Assignment Upload',
      description: 'Upload and manage customer assignment files. Configure bulk import settings and validation rules.',
      icon: 'bi-upload',
      stats: [
        { value: '3', label: 'Recent Uploads' },
        { value: '2,456', label: 'Records' },
        { value: '99.2%', label: 'Success Rate' }
      ],
      actionText: 'Upload Data',
      actionLink: '/settings/customer-assignment',
      status: { type: 'active', label: 'Ready' }
    },
    {
      id: 'system-configuration',
      title: 'System Configuration',
      description: 'Configure system-wide settings including database connections, API endpoints, and security policies.',
      icon: 'bi-gear-wide-connected',
      stats: [
        { value: '15', label: 'Config Items' },
        { value: '99.9%', label: 'Uptime' },
        { value: '5', label: 'Services' }
      ],
      actionText: 'System Config',
      actionLink: '/settings/system-config',
      status: { type: 'active', label: 'Healthy' }
    }
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-neutral-900 flex items-center">
          <CogIcon className="w-8 h-8 mr-2 text-primary-600" />
          System Settings
        </h1>
        <div className="flex gap-3">
          <Button
            variant="secondary"
            onClick={handleRefresh}
            loading={loading}
            leftIcon={<ArrowPathIcon className="w-4 h-4" />}
          >
            Refresh
          </Button>
          <Button
            variant="primary"
            onClick={handleSaveAll}
            leftIcon={<CheckIcon className="w-4 h-4" />}
          >
            Save All Changes
          </Button>
        </div>
      </div>

      {/* Quick Actions */}
      <QuickActions />

      {/* Settings Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {settingsCards.map((card) => (
          <SettingsCard key={card.id} {...card} />
        ))}
      </div>
    </div>
  );
};

export default SettingsPage;