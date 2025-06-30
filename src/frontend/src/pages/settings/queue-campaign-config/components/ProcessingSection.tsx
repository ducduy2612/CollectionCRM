import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from '../../../../components/ui/Card';
import { Button } from '../../../../components/ui/Button';
import { Badge } from '../../../../components/ui/Badge';
import { Alert } from '../../../../components/ui/Alert';
import { Modal } from '../../../../components/ui/Modal';
import { 
  PlayIcon, 
  EyeIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { processingApi, campaignGroupsApi } from '../../../../services/api/campaign';
import type { 
  ProcessingRun, 
  ProcessingRequest, 
  CampaignGroup,
  CampaignResult,
  ProcessingStatistics 
} from '../../../../services/api/campaign/types';
import { formatDateTime, formatDuration } from '../../../../utils/date-time';
import ProcessingRunModal from './ProcessingRunModal';

const ProcessingSection: React.FC = () => {
  const { t } = useTranslation('settings');
  const [processingRuns, setProcessingRuns] = useState<ProcessingRun[]>([]);
  const [campaignGroups, setCampaignGroups] = useState<CampaignGroup[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRunsLoading, setIsRunsLoading] = useState(true);
  const [selectedRun, setSelectedRun] = useState<ProcessingRun | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [processingOptions, setProcessingOptions] = useState({
    max_contacts_per_customer: 3,
    include_uncontactable: false
  });
  const [selectedCampaignGroups, setSelectedCampaignGroups] = useState<string[]>([]);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      const [runsResponse, groupsResponse] = await Promise.all([
        processingApi.getProcessingRuns({ limit: 20 }),
        campaignGroupsApi.getCampaignGroups()
      ]);

      if (runsResponse.success) {
        setProcessingRuns(runsResponse.data);
      }
      
      setCampaignGroups(groupsResponse);
    } catch (err) {
      console.error('Load initial data error:', err);
      setError(t('campaign_config.processing.error.load_failed'));
    } finally {
      setIsRunsLoading(false);
    }
  };

  const handleTriggerProcessing = async () => {
    if (isLoading) return;

    setIsLoading(true);
    setError(null);

    try {
      const request: ProcessingRequest = {
        processing_options: processingOptions
      };

      if (selectedCampaignGroups.length > 0) {
        request.campaign_group_ids = selectedCampaignGroups;
      }

      const response = await processingApi.triggerProcessing(request);
      
      if (response.success) {
        await loadInitialData();
      } else {
        setError(t('campaign_config.processing.error.trigger_failed'));
      }
    } catch (err) {
      setError(t('campaign_config.processing.error.trigger_failed'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewResults = (run: ProcessingRun) => {
    setSelectedRun(run);
    setIsModalOpen(true);
  };

  const getStatusBadge = (status: ProcessingRun['status']) => {
    switch (status) {
      case 'running':
        return (
          <Badge variant="warning" className="flex items-center gap-1">
            <ArrowPathIcon className="w-3 h-3 animate-spin" />
            {t('campaign_config.processing.status.running')}
          </Badge>
        );
      case 'completed':
        return (
          <Badge variant="success" className="flex items-center gap-1">
            <CheckCircleIcon className="w-3 h-3" />
            {t('campaign_config.processing.status.completed')}
          </Badge>
        );
      case 'failed':
        return (
          <Badge variant="danger" className="flex items-center gap-1">
            <XCircleIcon className="w-3 h-3" />
            {t('campaign_config.processing.status.failed')}
          </Badge>
        );
      default:
        return null;
    }
  };

  const handleCampaignGroupToggle = (groupId: string) => {
    setSelectedCampaignGroups(prev => 
      prev.includes(groupId) 
        ? prev.filter(id => id !== groupId)
        : [...prev, groupId]
    );
  };

  return (
    <div className="space-y-6">
      {/* Processing Controls */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-neutral-800">
            {t('campaign_config.processing.title')}
          </h3>
        </div>

        {error && (
          <Alert variant="danger" className="mb-4">
            <ExclamationTriangleIcon className="w-5 h-5" />
            <span>{error}</span>
          </Alert>
        )}

        <div className="space-y-4">
          {/* Campaign Group Selection */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              {t('campaign_config.processing.campaign_groups_label')}
            </label>
            <div className="space-y-2">
              <div className="flex flex-wrap gap-2">
                {campaignGroups.map(group => (
                  <label key={group.id} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={selectedCampaignGroups.includes(group.id)}
                      onChange={() => handleCampaignGroupToggle(group.id)}
                      className="mr-2"
                    />
                    <span className="text-sm text-neutral-700">{group.name}</span>
                  </label>
                ))}
              </div>
              <p className="text-xs text-neutral-500">
                {t('campaign_config.processing.campaign_groups_help')}
              </p>
            </div>
          </div>

          {/* Processing Options */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                {t('campaign_config.processing.max_contacts_label')}
              </label>
              <select
                value={processingOptions.max_contacts_per_customer}
                onChange={(e) => setProcessingOptions(prev => ({
                  ...prev,
                  max_contacts_per_customer: Number(e.target.value)
                }))}
                className="w-full px-3 py-2 border border-neutral-300 rounded-md"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                  <option key={num} value={num}>{num}</option>
                ))}
              </select>
            </div>
            
            <div className="flex items-center">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={processingOptions.include_uncontactable}
                  onChange={(e) => setProcessingOptions(prev => ({
                    ...prev,
                    include_uncontactable: e.target.checked
                  }))}
                  className="mr-2"
                />
                <span className="text-sm text-neutral-700">
                  {t('campaign_config.processing.include_uncontactable_label')}
                </span>
              </label>
            </div>
          </div>

          <Button
            onClick={handleTriggerProcessing}
            disabled={isLoading}
            className="flex items-center gap-2"
          >
            <PlayIcon className="w-4 h-4" />
            {isLoading 
              ? t('campaign_config.processing.triggering') 
              : t('campaign_config.processing.trigger_button')
            }
          </Button>
        </div>
      </Card>

      {/* Processing Runs History */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-neutral-800">
            {t('campaign_config.processing.history_title')}
          </h3>
          <Button
            variant="secondary"
            size="sm"
            onClick={loadInitialData}
            disabled={isRunsLoading}
          >
            <ArrowPathIcon className={`w-4 h-4 ${isRunsLoading ? 'animate-spin' : ''}`} />
            {t('campaign_config.common.refresh')}
          </Button>
        </div>

        {isRunsLoading ? (
          <div className="text-center py-8 text-neutral-500">
            {t('campaign_config.common.loading')}
          </div>
        ) : processingRuns.length === 0 ? (
          <div className="text-center py-8 text-neutral-500">
            {t('campaign_config.processing.no_runs')}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-neutral-200">
                  <th className="text-left py-3 px-4 font-medium text-neutral-700">
                    {t('campaign_config.processing.table.status')}
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-neutral-700">
                    {t('campaign_config.processing.table.started_at')}
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-neutral-700">
                    {t('campaign_config.processing.table.duration')}
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-neutral-700">
                    {t('campaign_config.processing.table.results')}
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-neutral-700">
                    {t('campaign_config.processing.table.actions')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {processingRuns.map(run => (
                  <tr key={run.id} className="border-b border-neutral-100">
                    <td className="py-3 px-4">
                      {getStatusBadge(run.status)}
                    </td>
                    <td className="py-3 px-4 text-sm text-neutral-600">
                      <div className="flex items-center gap-1">
                        <ClockIcon className="w-4 h-4" />
                        {formatDateTime(run.started_at)}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm text-neutral-600">
                      {run.total_duration_ms 
                        ? formatDuration(run.total_duration_ms)
                        : '-'
                      }
                    </td>
                    <td className="py-3 px-4 text-sm text-neutral-600">
                      {run.status === 'completed' && (
                        <div className="space-y-1">
                          <div>{t('campaign_config.processing.table.processed')}: {run.processed_count || 0}</div>
                          <div className="text-green-600">{t('campaign_config.processing.table.success')}: {run.success_count || 0}</div>
                          {(run.error_count || 0) > 0 && (
                            <div className="text-red-600">{t('campaign_config.processing.table.errors')}: {run.error_count}</div>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleViewResults(run)}
                        className="flex items-center gap-1"
                      >
                        <EyeIcon className="w-4 h-4" />
                        {t('campaign_config.processing.view_results')}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Processing Run Details Modal */}
      {selectedRun && (
        <ProcessingRunModal
          run={selectedRun}
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedRun(null);
          }}
        />
      )}
    </div>
  );
};

export default ProcessingSection;