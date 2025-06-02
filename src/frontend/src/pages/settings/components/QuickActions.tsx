import React from 'react';
import { Card } from '../../../components/ui/Card';
import {
  PlusCircleIcon,
  ArrowUpTrayIcon,
  ArrowDownTrayIcon,
  ShieldCheckIcon,
  BoltIcon
} from '@heroicons/react/24/outline';

interface QuickAction {
  id: string;
  title: string;
  icon: string;
  href: string;
}

const getIconComponent = (iconName: string) => {
  const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
    'bi-plus-circle': PlusCircleIcon,
    'bi-upload': ArrowUpTrayIcon,
    'bi-download': ArrowDownTrayIcon,
    'bi-shield-check': ShieldCheckIcon,
  };
  
  return iconMap[iconName] || PlusCircleIcon;
};

const QuickActions: React.FC = () => {
  const quickActions: QuickAction[] = [
    {
      id: 'add-user',
      title: 'Add New User',
      icon: 'bi-plus-circle',
      href: '/settings/users/new'
    },
    {
      id: 'import-data',
      title: 'Import Data',
      icon: 'bi-upload',
      href: '/settings/import'
    },
    {
      id: 'export-settings',
      title: 'Export Settings',
      icon: 'bi-download',
      href: '/settings/export'
    },
    {
      id: 'security-audit',
      title: 'Security Audit',
      icon: 'bi-shield-check',
      href: '/settings/security/audit'
    }
  ];

  const handleActionClick = (action: QuickAction) => {
    // In a real app, you would use React Router navigation
    console.log(`Navigate to: ${action.href}`);
  };

  return (
    <Card className="mb-8">
      <h2 className="text-lg font-semibold text-neutral-800 mb-4 flex items-center gap-2">
        <BoltIcon className="w-5 h-5 text-primary-600" />
        Quick Actions
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {quickActions.map((action) => (
          <button
            key={action.id}
            onClick={() => handleActionClick(action)}
            className="flex items-center gap-3 p-3 bg-neutral-50 border border-neutral-200 rounded-lg text-neutral-700 hover:bg-primary-50 hover:border-primary-200 hover:text-primary-700 transition-all duration-200 text-left"
          >
            {React.createElement(getIconComponent(action.icon), { className: 'w-5 h-5' })}
            <span className="font-medium">{action.title}</span>
          </button>
        ))}
      </div>
    </Card>
  );
};

export default QuickActions;