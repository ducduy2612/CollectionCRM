import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../../../../components/ui/Card';
import {
  PlusCircleIcon,
  ArrowUpTrayIcon,
  ArrowDownTrayIcon,
  ShieldCheckIcon,
  BoltIcon
} from '@heroicons/react/24/outline';
import { useTranslation } from '../../../../i18n/hooks/useTranslation';

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
  const { t } = useTranslation();
  const navigate = useNavigate();
  
  const quickActions: QuickAction[] = [
    {
      id: 'add-user',
      title: t('settings:user_management.add_user'),
      icon: 'bi-plus-circle',
      href: '/settings/user-management'
    },
    {
      id: 'import-data',
      title: t('settings:integrations.import_export'),
      icon: 'bi-upload',
      href: '/settings/customer-assignment'
    },
    {
      id: 'export-settings',
      title: t('settings:actions.export_settings'),
      icon: 'bi-download',
      href: '/settings/queue-campaign'
    },
    {
      id: 'security-audit',
      title: t('settings:security.audit_trail'),
      icon: 'bi-shield-check',
      href: '/settings/audit-log'
    }
  ];

  const handleActionClick = (action: QuickAction) => {
    navigate(action.href);
  };

  return (
    <Card className="mb-8">
      <h2 className="text-lg font-semibold text-neutral-800 mb-4 flex items-center gap-2">
        <BoltIcon className="w-5 h-5 text-primary-600" />
        {t('settings:quick_actions')}
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