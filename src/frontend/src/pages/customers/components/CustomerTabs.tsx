import React from 'react';
import { Tabs, TabsList, TabsTrigger } from '../../../components/ui/Tabs';

interface CustomerTabsProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const CustomerTabs: React.FC<CustomerTabsProps> = ({ activeTab, onTabChange }) => {
  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'loans', label: 'Loans' },
    { id: 'actions', label: 'Actions' },
    { id: 'payments', label: 'Payments' },
    { id: 'documents', label: 'Documents' },
    { id: 'references', label: 'References' }
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