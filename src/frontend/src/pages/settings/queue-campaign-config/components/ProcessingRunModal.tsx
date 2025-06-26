import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal } from '../../../../components/ui/Modal';
import { Card } from '../../../../components/ui/Card';
import { Badge } from '../../../../components/ui/Badge';
import { Button } from '../../../../components/ui/Button';
import { Alert } from '../../../../components/ui/Alert';
import { 
  ChartBarIcon,
  ExclamationTriangleIcon,
  UserGroupIcon,
  ClipboardDocumentListIcon,
  MagnifyingGlassIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { processingApi } from '../../../../services/api/campaign';
import type { 
  ProcessingRun, 
  CampaignResult, 
  ProcessingStatistics, 
  ProcessingError,
  CustomerAssignment 
} from '../../../../services/api/campaign/types';
import { formatDateTime, formatDuration } from '../../../../utils/date-time';

interface ProcessingRunModalProps {
  run: ProcessingRun;
  isOpen: boolean;
  onClose: () => void;
}

type ModalTab = 'overview' | 'results' | 'errors' | 'assignments';

const ProcessingRunModal: React.FC<ProcessingRunModalProps> = ({ run, isOpen, onClose }) => {
  const { t } = useTranslation('settings');
  const [activeTab, setActiveTab] = useState<ModalTab>('overview');
  const [statistics, setStatistics] = useState<ProcessingStatistics | null>(null);
  const [campaignResults, setCampaignResults] = useState<CampaignResult[]>([]);
  const [errors, setErrors] = useState<ProcessingError[]>([]);
  const [assignments, setAssignments] = useState<CustomerAssignment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchCif, setSearchCif] = useState('');
  const [selectedCampaignResult, setSelectedCampaignResult] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && run.id) {
      loadRunDetails();
    }
  }, [isOpen, run.id]);

  const loadRunDetails = async () => {
    setIsLoading(true);
    try {
      const [statisticsResponse, resultsResponse, errorsResponse] = await Promise.all([
        processingApi.getProcessingStatistics(run.id).catch(() => ({ success: false, data: null })),
        processingApi.getCampaignResults(run.id).catch(() => ({ success: false, data: [] })),
        processingApi.getProcessingErrors(run.id).catch(() => ({ success: false, data: [] }))
      ]);

      if (statisticsResponse.success) {
        setStatistics(statisticsResponse.data);
      }
      
      if (resultsResponse.success) {
        setCampaignResults(resultsResponse.data);
      }
      
      if (errorsResponse.success) {
        setErrors(errorsResponse.data);
      }
    } catch (err) {
      console.error('Failed to load run details:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchAssignments = async () => {
    if (!searchCif.trim()) return;

    setIsLoading(true);
    try {
      const response = await processingApi.searchCustomerAssignments({
        cif: searchCif.trim(),
        processing_run_id: run.id
      });

      if (response.success) {
        setAssignments(response.data);
        setActiveTab('assignments');
      }
    } catch (err) {
      console.error('Failed to search assignments:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoadCampaignAssignments = async (campaignResultId: string) => {
    setIsLoading(true);
    try {
      const response = await processingApi.getCustomerAssignments(campaignResultId, { limit: 100 });
      
      if (response.success) {
        setAssignments(response.data);
        setSelectedCampaignResult(campaignResultId);
        setActiveTab('assignments');
      }
    } catch (err) {
      console.error('Failed to load campaign assignments:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const tabs = [
    { id: 'overview' as const, label: t('campaign_config.processing.modal.tabs.overview'), icon: ChartBarIcon },
    { id: 'results' as const, label: t('campaign_config.processing.modal.tabs.results'), icon: ClipboardDocumentListIcon },
    { id: 'errors' as const, label: t('campaign_config.processing.modal.tabs.errors'), icon: ExclamationTriangleIcon },
    { id: 'assignments' as const, label: t('campaign_config.processing.modal.tabs.assignments'), icon: UserGroupIcon },
  ];

  const renderOverviewTab = () => (
    <div className="space-y-6">
      {/* Run Information */}
      <Card className="p-4">
        <h4 className="font-medium text-neutral-800 mb-3">
          {t('campaign_config.processing.modal.run_info')}
        </h4>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-neutral-500">{t('campaign_config.processing.modal.request_id')}:</span>
            <div className="font-mono text-xs">{run.request_id}</div>
          </div>
          <div>
            <span className="text-neutral-500">{t('campaign_config.processing.modal.requested_by')}:</span>
            <div>{run.requested_by}</div>
          </div>
          <div>
            <span className="text-neutral-500">{t('campaign_config.processing.modal.started_at')}:</span>
            <div>{formatDateTime(run.started_at)}</div>
          </div>
          {run.completed_at && (
            <div>
              <span className="text-neutral-500">{t('campaign_config.processing.modal.completed_at')}:</span>
              <div>{formatDateTime(run.completed_at)}</div>
            </div>
          )}
        </div>
      </Card>

      {/* Statistics */}
      {statistics && (
        <Card className="p-4">
          <h4 className="font-medium text-neutral-800 mb-3">
            {t('campaign_config.processing.modal.statistics')}
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary-600">
                {statistics.total_customers}
              </div>
              <div className="text-sm text-neutral-500">
                {t('campaign_config.processing.modal.customers_processed')}
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {statistics.customers_with_assignments}
              </div>
              <div className="text-sm text-neutral-500">
                {t('campaign_config.processing.modal.assignments_created')}
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {statistics.total_errors}
              </div>
              <div className="text-sm text-neutral-500">
                {t('campaign_config.processing.modal.total_errors')}
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-neutral-600">
                {statistics.total_campaigns_processed}
              </div>
              <div className="text-sm text-neutral-500">
                {t('campaign_config.processing.modal.campaigns_processed')}
              </div>
            </div>
          </div>
          
          {statistics.total_processing_duration_ms && (
            <div className="mt-4 text-center">
              <div className="text-lg font-medium text-neutral-700">
                {t('campaign_config.processing.modal.duration')}: {formatDuration(statistics.total_processing_duration_ms)}
              </div>
            </div>
          )}
        </Card>
      )}

      {/* Performance Metrics */}
      {statistics?.performance_metrics && (
        <Card className="p-4">
          <h4 className="font-medium text-neutral-800 mb-3">
            {t('campaign_config.processing.modal.performance_metrics')}
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="text-center">
              <div className="text-lg font-bold text-blue-600">
                {Math.round(statistics.performance_metrics.customers_per_second)}
              </div>
              <div className="text-xs text-neutral-500">
                {t('campaign_config.processing.modal.customers_per_second')}
              </div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-purple-600">
                {statistics.performance_metrics.total_database_queries}
              </div>
              <div className="text-xs text-neutral-500">
                {t('campaign_config.processing.modal.database_queries')}
              </div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-orange-600">
                {statistics.performance_metrics.average_query_duration_ms}ms
              </div>
              <div className="text-xs text-neutral-500">
                {t('campaign_config.processing.modal.avg_query_duration')}
              </div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-teal-600">
                {statistics.total_contacts_selected}
              </div>
              <div className="text-xs text-neutral-500">
                {t('campaign_config.processing.modal.contacts_selected')}
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Most Assigned Campaign */}
      {statistics?.most_assigned_campaign && (
        <Card className="p-4">
          <h4 className="font-medium text-neutral-800 mb-3">
            {t('campaign_config.processing.modal.most_assigned_campaign')}
          </h4>
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-neutral-800">
                {statistics.most_assigned_campaign.campaign_name}
              </div>
              <div className="text-sm text-neutral-500">
                ID: {statistics.most_assigned_campaign.campaign_id}
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-green-600">
                {statistics.most_assigned_campaign.assignment_count}
              </div>
              <div className="text-sm text-neutral-500">
                {t('campaign_config.processing.modal.assignments')}
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );

  const renderResultsTab = () => (
    <div className="space-y-4">
      {campaignResults.length === 0 ? (
        <div className="text-center py-8 text-neutral-500">
          {t('campaign_config.processing.modal.no_results')}
        </div>
      ) : (
        <div className="space-y-4">
          {campaignResults.map(result => (
            <Card key={result.id} className="p-4">
              <div className="flex items-center justify-between mb-2">
                <h5 className="font-medium text-neutral-800">{result.campaign_name}</h5>
                <Badge variant="primary">{result.campaign_group_name}</Badge>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-3">
                <div>
                  <span className="text-neutral-500">{t('campaign_config.processing.modal.customers_assigned')}:</span>
                  <div className="font-medium">{result.customers_assigned}</div>
                </div>
                <div>
                  <span className="text-neutral-500">{t('campaign_config.processing.modal.customers_with_contacts')}:</span>
                  <div className="font-medium text-blue-600">{result.customers_with_contacts}</div>
                </div>
                <div>
                  <span className="text-neutral-500">{t('campaign_config.processing.modal.contacts_selected')}:</span>
                  <div className="font-medium text-green-600">{result.total_contacts_selected}</div>
                </div>
                <div>
                  <span className="text-neutral-500">{t('campaign_config.processing.modal.duration')}:</span>
                  <div className="font-medium text-orange-600">{result.processing_duration_ms}ms</div>
                </div>
              </div>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => handleLoadCampaignAssignments(result.id)}
                className="flex items-center gap-1"
              >
                <UserGroupIcon className="w-4 h-4" />
                {t('campaign_config.processing.modal.view_assignments')}
              </Button>
            </Card>
          ))}
        </div>
      )}
    </div>
  );

  const renderErrorsTab = () => (
    <div className="space-y-4">
      {errors.length === 0 ? (
        <div className="text-center py-8 text-neutral-500">
          {t('campaign_config.processing.modal.no_errors')}
        </div>
      ) : (
        <div className="space-y-4">
          {errors.map(error => (
            <Card key={error.id} className="p-4 border-l-4 border-l-red-500">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className="font-medium text-red-800">{error.error_type}</div>
                  <div className="text-sm text-neutral-600 mt-1">{error.error_message}</div>
                </div>
                <div className="text-xs text-neutral-500">
                  {formatDateTime(error.created_at)}
                </div>
              </div>
              {error.customer_cif && (
                <div className="text-sm text-neutral-600">
                  <span className="font-medium">CIF:</span> {error.customer_cif}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );

  const renderAssignmentsTab = () => (
    <div className="space-y-4">
      {/* Search */}
      <Card className="p-4">
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder={t('campaign_config.processing.modal.search_cif_placeholder')}
            value={searchCif}
            onChange={(e) => setSearchCif(e.target.value)}
            className="flex-1 px-3 py-2 border border-neutral-300 rounded-md"
            onKeyDown={(e) => e.key === 'Enter' && handleSearchAssignments()}
          />
          <Button
            onClick={handleSearchAssignments}
            disabled={!searchCif.trim() || isLoading}
            className="flex items-center gap-1"
          >
            <MagnifyingGlassIcon className="w-4 h-4" />
            {t('campaign_config.processing.modal.search')}
          </Button>
        </div>
      </Card>

      {/* Assignments */}
      {assignments.length === 0 ? (
        <div className="text-center py-8 text-neutral-500">
          {t('campaign_config.processing.modal.no_assignments')}
        </div>
      ) : (
        <div className="space-y-4">
          {assignments.map(assignment => (
            <Card key={assignment.id} className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="font-medium text-neutral-800">
                  CIF: {assignment.cif}
                </div>
                <div className="text-xs text-neutral-500">
                  {formatDateTime(assignment.assigned_at)}
                </div>
              </div>
              
              {/* Campaign Info */}
              {assignment.campaign_name && (
                <div className="mb-3">
                  <div className="text-sm font-medium text-neutral-700">
                    {assignment.campaign_name}
                  </div>
                  {assignment.campaign_group_name && (
                    <div className="text-xs text-neutral-500">
                      Group: {assignment.campaign_group_name}
                    </div>
                  )}
                </div>
              )}
              
              {/* Selected Contacts */}
              {assignment.selected_contacts && assignment.selected_contacts.length > 0 && (
                <div>
                  <div className="text-sm font-medium text-neutral-700 mb-2">
                    {t('campaign_config.processing.modal.selected_contacts')} ({assignment.selected_contacts.length})
                  </div>
                  <div className="space-y-2">
                    {assignment.selected_contacts.map(contact => (
                      <div key={contact.id} className="bg-neutral-50 p-2 rounded text-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{contact.contact_type}: {contact.contact_value}</span>
                          <span className="text-neutral-500">Priority: {contact.rule_priority}</span>
                        </div>
                        <div className="text-neutral-600 mt-1">
                          {contact.related_party_type} - {contact.related_party_name || contact.related_party_cif}
                          {contact.is_primary && (
                            <Badge variant="success" className="ml-2 text-xs">Primary</Badge>
                          )}
                          {contact.is_verified && (
                            <Badge variant="info" className="ml-1 text-xs">Verified</Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* No contacts message */}
              {(!assignment.selected_contacts || assignment.selected_contacts.length === 0) && (
                <div className="text-sm text-neutral-500 italic">
                  {t('campaign_config.processing.modal.no_contacts_selected')}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return renderOverviewTab();
      case 'results':
        return renderResultsTab();
      case 'errors':
        return renderErrorsTab();
      case 'assignments':
        return renderAssignmentsTab();
      default:
        return null;
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-neutral-800">
          {t('campaign_config.processing.modal.title')}
        </h3>
        <Button
          variant="secondary"
          size="sm"
          onClick={loadRunDetails}
          disabled={isLoading}
        >
          <ArrowPathIcon className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          {t('campaign_config.common.refresh')}
        </Button>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-neutral-200 mb-4">
        <nav className="flex space-x-6">
          {tabs.map(tab => {
            const IconComponent = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
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

      {/* Tab Content */}
      <div className="max-h-96 overflow-y-auto">
        {renderTabContent()}
      </div>
    </Modal>
  );
};

export default ProcessingRunModal;