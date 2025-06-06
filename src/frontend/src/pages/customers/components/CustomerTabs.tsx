import React from 'react';
import { Tabs, TabsList, TabsTrigger } from '../../../components/ui/Tabs';
import { useTranslation } from '../../../i18n/hooks/useTranslation';

interface CustomerTabsProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const CustomerTabs: React.FC<CustomerTabsProps> = ({ activeTab, onTabChange }) => {
  const { t } = useTranslation(['customers']);
  
  const tabs = [
    { id: 'overview', label: t('customers:tabs.overview') },
    { id: 'loans', label: t('customers:tabs.loans') },
    { id: 'actions', label: t('customers:tabs.actions') },
    { id: 'payments', label: t('customers:tabs.payments') },
    { id: 'documents', label: t('customers:tabs.documents') },
    { id: 'references', label: t('customers:tabs.references') }
  ];

  return (
    <Tabs 
      defaultValue={tabs[0].id} 
      value={activeTab} 
      onValueChange={onTabChange}
    >
      <TabsList>
        {tabs.map(tab => (
          <TabsTrigger key={tab.id} value={tab.id}>
            {tab.label}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
};

export default CustomerTabs;