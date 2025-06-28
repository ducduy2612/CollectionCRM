import { useState } from 'react';

export type ModalTab = 'overview' | 'results' | 'errors' | 'assignments';

interface UseModalTabsState {
  activeTab: ModalTab;
  searchCif: string;
  selectedCampaignResult: string | null;
}

interface UseModalTabsActions {
  setActiveTab: (tab: ModalTab) => void;
  setSearchCif: (cif: string) => void;
  setSelectedCampaignResult: (id: string | null) => void;
  switchToAssignmentsTab: () => void;
}

export const useModalTabs = (): UseModalTabsState & UseModalTabsActions => {
  const [activeTab, setActiveTab] = useState<ModalTab>('overview');
  const [searchCif, setSearchCif] = useState('');
  const [selectedCampaignResult, setSelectedCampaignResult] = useState<string | null>(null);

  const switchToAssignmentsTab = () => {
    setActiveTab('assignments');
  };

  return {
    activeTab,
    searchCif,
    selectedCampaignResult,
    setActiveTab,
    setSearchCif,
    setSelectedCampaignResult,
    switchToAssignmentsTab
  };
};