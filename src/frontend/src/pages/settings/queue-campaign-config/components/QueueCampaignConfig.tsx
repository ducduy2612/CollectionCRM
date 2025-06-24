import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from '../../../../components/ui/Card';
import { QueueListIcon } from '@heroicons/react/24/outline';
import CampaignGroupsSection from './CampaignGroupsSection';
import CampaignsSection from './CampaignsSection';
import CustomFieldsSection from './CustomFieldsSection';

type ActiveTab = 'campaign_groups' | 'campaigns' | 'custom_fields';

const QueueCampaignConfig: React.FC = () => {
  const { t } = useTranslation('settings');
  const [activeTab, setActiveTab] = useState<ActiveTab>('campaign_groups');

  const tabs = [
    { id: 'campaign_groups' as const, label: t('campaign_config.tabs.campaign_groups') },
    { id: 'campaigns' as const, label: t('campaign_config.tabs.campaigns') },
    { id: 'custom_fields' as const, label: t('campaign_config.tabs.custom_fields') },
  ];

  const renderActiveTabContent = () => {
    switch (activeTab) {
      case 'campaign_groups':
        return <CampaignGroupsSection />;
      case 'campaigns':
        return <CampaignsSection />;
      case 'custom_fields':
        return <CustomFieldsSection />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="p-6">
        <div className="flex items-center mb-4">
          <QueueListIcon className="w-6 h-6 text-primary-600 mr-2" />
          <h2 className="text-xl font-semibold text-neutral-800">
            {t('campaign_config.title')}
          </h2>
        </div>
        <p className="text-neutral-600">
          {t('campaign_config.description')}
        </p>
      </Card>

      {/* Tab Navigation */}
      <Card className="p-0">
        <div className="border-b border-neutral-200">
          <nav className="flex space-x-8 px-6" aria-label="Tabs">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {renderActiveTabContent()}
        </div>
      </Card>
    </div>
  );
};

export default QueueCampaignConfig;