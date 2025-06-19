import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeftIcon,
  ClipboardDocumentListIcon,
  TagIcon,
  BuildingOfficeIcon,
  ExclamationTriangleIcon,
  ArrowTrendingUpIcon,
  CogIcon
} from '@heroicons/react/24/outline';
import { Button } from '../../../components/ui/Button';
import ActionsConfig from './components/ActionsConfig';
import CustomerStatusConfig from './components/CustomerStatusConfig';
import CollateralStatusConfig from './components/CollateralStatusConfig';
import LendingViolationStatusConfig from './components/LendingViolationStatusConfig';
import RecoveryAbilityStatusConfig from './components/RecoveryAbilityStatusConfig';
import ProcessingStateSubstateConfig from './components/ProcessingStateSubstateConfig';
import { useTranslation } from '../../../i18n/hooks/useTranslation';

interface Tab {
  id: string;
  label: string;
  icon: React.ReactNode;
  component: React.ReactNode;
}

const ActionsConfigPage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation(['settings', 'common']);
  const [activeTab, setActiveTab] = useState<string>('actions');

  const handleGoBack = () => {
    navigate('/settings');
  };

  const tabs: Tab[] = [
    {
      id: 'actions',
      label: t('settings:actions_config.tab_actions'),
      icon: <ClipboardDocumentListIcon className="w-5 h-5" />,
      component: <ActionsConfig />
    },
    {
      id: 'customer-status',
      label: t('settings:actions_config.tab_customer_status'),
      icon: <TagIcon className="w-5 h-5" />,
      component: <CustomerStatusConfig />
    },
    {
      id: 'collateral-status',
      label: t('settings:actions_config.tab_collateral_status'),
      icon: <BuildingOfficeIcon className="w-5 h-5" />,
      component: <CollateralStatusConfig />
    },
    {
      id: 'lending-violation',
      label: t('settings:actions_config.tab_lending_violation'),
      icon: <ExclamationTriangleIcon className="w-5 h-5" />,
      component: <LendingViolationStatusConfig />
    },
    {
      id: 'recovery-ability',
      label: t('settings:actions_config.tab_recovery_ability'),
      icon: <ArrowTrendingUpIcon className="w-5 h-5" />,
      component: <RecoveryAbilityStatusConfig />
    },
    {
      id: 'processing-state',
      label: t('settings:actions_config.tab_processing_state'),
      icon: <CogIcon className="w-5 h-5" />,
      component: <ProcessingStateSubstateConfig />
    }
  ];

  const activeTabContent = tabs.find(tab => tab.id === activeTab)?.component;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="px-6 py-4">
          <div className="flex items-center space-x-4">
            <Button
              variant="secondary"
              size="sm"
              onClick={handleGoBack}
              leftIcon={<ArrowLeftIcon className="w-4 h-4" />}
              aria-label="Back to Settings"
            >
              {t('settings:actions_config.back_to_settings')}
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-neutral-900">{t('settings:actions_config.title')}</h1>
              <p className="text-neutral-600 text-sm mt-1">
                {t('settings:actions_config.description')}
              </p>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="px-6">
          <nav className="flex space-x-8 -mb-px" aria-label="Tabs">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm
                  ${activeTab === tab.id
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300'
                  }
                `}
                aria-current={activeTab === tab.id ? 'page' : undefined}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      <div className="px-6">
        {activeTabContent}
      </div>
    </div>
  );
};

export default ActionsConfigPage;