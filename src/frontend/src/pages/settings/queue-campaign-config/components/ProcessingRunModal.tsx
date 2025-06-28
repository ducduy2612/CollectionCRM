import React from 'react';
import { useTranslation } from 'react-i18next';
import { Modal } from '../../../../components/ui/Modal';
import type { ProcessingRun } from '../../../../services/api/campaign/types';
import { OverviewTab } from './ProcessingRun/OverviewTab';
import { ResultsTab } from './ProcessingRun/ResultsTab';
import { ErrorsTab } from './ProcessingRun/ErrorsTab';
import { AssignmentsTab } from './ProcessingRun/AssignmentsTab';
import { TabNavigation, createTabs } from './ProcessingRun/TabNavigation';
import { ModalHeader } from './ProcessingRun/ModalHeader';
import { useProcessingRunDetails } from './ProcessingRun/useProcessingRunDetails';
import { useModalTabs } from './ProcessingRun/useModalTabs';

interface ProcessingRunModalProps {
  run: ProcessingRun;
  isOpen: boolean;
  onClose: () => void;
}

const ProcessingRunModal: React.FC<ProcessingRunModalProps> = ({ run, isOpen, onClose }) => {
  const { t } = useTranslation('settings');
  
  const {
    summary,
    statistics,
    campaignResults,
    errors,
    assignments,
    isLoading,
    loadRunDetails,
    searchCustomerAssignments,
    loadCampaignAssignments
  } = useProcessingRunDetails(run.id);
  
  const {
    activeTab,
    searchCif,
    setActiveTab,
    setSearchCif,
    switchToAssignmentsTab
  } = useModalTabs();

  const handleSearchAssignments = async () => {
    await searchCustomerAssignments(searchCif, run.id);
    switchToAssignmentsTab();
  };

  const handleLoadCampaignAssignments = async (campaignResultId: string) => {
    await loadCampaignAssignments(campaignResultId);
    switchToAssignmentsTab();
  };

  const tabs = createTabs(t);





  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return <OverviewTab run={run} summary={summary} statistics={statistics} />;
      case 'results':
        return <ResultsTab campaignResults={campaignResults} onLoadCampaignAssignments={handleLoadCampaignAssignments} />;
      case 'errors':
        return <ErrorsTab errors={errors} />;
      case 'assignments':
        return (
          <AssignmentsTab
            assignments={assignments}
            searchCif={searchCif}
            onSearchCifChange={setSearchCif}
            onSearchAssignments={handleSearchAssignments}
            isLoading={isLoading}
          />
        );
      default:
        return null;
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      <ModalHeader
        title={t('campaign_config.processing.modal.title')}
        onRefresh={loadRunDetails}
        isLoading={isLoading}
        refreshButtonText={t('campaign_config.common.refresh')}
      />

      <TabNavigation
        activeTab={activeTab}
        onTabChange={setActiveTab}
        tabs={tabs}
      />

      {/* Tab Content */}
      <div className="max-h-[70vh] overflow-y-auto">
        {renderTabContent()}
      </div>
    </Modal>
  );
};

export default ProcessingRunModal;