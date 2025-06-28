import React from 'react';
import { 
  ChartBarIcon,
  ExclamationTriangleIcon,
  UserGroupIcon,
  ClipboardDocumentListIcon
} from '@heroicons/react/24/outline';
import type { ModalTab } from '../hooks/useModalTabs';

interface Tab {
  id: ModalTab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface TabNavigationProps {
  activeTab: ModalTab;
  onTabChange: (tab: ModalTab) => void;
  tabs: Tab[];
}

export const TabNavigation: React.FC<TabNavigationProps> = ({ 
  activeTab, 
  onTabChange, 
  tabs 
}) => {
  return (
    <div className="border-b border-neutral-200 mb-4">
      <nav className="flex space-x-6">
        {tabs.map(tab => {
          const IconComponent = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-neutral-500 hover:text-neutral-700'
              }`}
            >
              <IconComponent className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </nav>
    </div>
  );
};

export const createTabs = (t: (key: string) => string): Tab[] => [
  { 
    id: 'overview', 
    label: t('campaign_config.processing.modal.tabs.overview'), 
    icon: ChartBarIcon 
  },
  { 
    id: 'results', 
    label: t('campaign_config.processing.modal.tabs.results'), 
    icon: ClipboardDocumentListIcon 
  },
  { 
    id: 'errors', 
    label: t('campaign_config.processing.modal.tabs.errors'), 
    icon: ExclamationTriangleIcon 
  },
  { 
    id: 'assignments', 
    label: t('campaign_config.processing.modal.tabs.assignments'), 
    icon: UserGroupIcon 
  },
];