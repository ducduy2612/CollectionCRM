import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from '../../../../../components/ui/Card';
import type { ProcessingRun, ProcessingStatistics } from '../../../../../services/api/campaign/types';
import { formatDateTime, formatDuration } from '../../../../../utils/date-time';

interface OverviewTabProps {
  run: ProcessingRun;
  summary: any;
  statistics: ProcessingStatistics[];
}

export const OverviewTab: React.FC<OverviewTabProps> = ({ run, summary, statistics }) => {
  const { t } = useTranslation('settings');

  return (
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

      {/* Processing Summary */}
      {summary && (
        <Card className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium text-neutral-800">
              {t('campaign_config.processing.modal.statistics')}
            </h4>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary-600">
                {summary.total_customers || 0}
              </div>
              <div className="text-sm text-neutral-500">
                {t('campaign_config.processing.modal.customers_processed')}
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-teal-600">
                {summary.total_contacts || 0}
              </div>
              <div className="text-sm text-neutral-500">
                {t('campaign_config.processing.modal.contacts_selected')}
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {summary.total_groups || 0}
              </div>
              <div className="text-sm text-neutral-500">
                Groups Processed
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {summary.total_campaigns || 0}
              </div>
              <div className="text-sm text-neutral-500">
                {t('campaign_config.processing.modal.campaigns_processed')}
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div className="text-center">
              <div className="text-xl font-bold text-red-600">
                {summary.total_errors || 0}
              </div>
              <div className="text-sm text-neutral-500">
                {t('campaign_config.processing.modal.total_errors')}
              </div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-blue-600">
                {summary.campaign_results_count || 0}
              </div>
              <div className="text-sm text-neutral-500">
                Campaign Results With Data
              </div>
            </div>
          </div>
          
          {summary.processing_duration_ms && (
            <div className="mt-4 text-center">
              <div className="text-lg font-medium text-neutral-700">
                {t('campaign_config.processing.modal.duration')}: {formatDuration(summary.processing_duration_ms)}
              </div>
            </div>
          )}
        </Card>
      )}

      {/* All Statistics Records */}
      {statistics.length > 0 && (
        <div className="space-y-4">
          <h4 className="font-medium text-neutral-800">
            {t('campaign_config.processing.modal.all_statistics')} ({statistics.length})
          </h4>
          {statistics.map((stat) => {
            const groupData = stat.campaign_assignments_by_group ? Object.values(stat.campaign_assignments_by_group)[0] : null;
            
            return (
              <Card key={stat.id} className="p-4">
                {/* Campaign Group Header */}
                {groupData && (
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h5 className="text-sm font-medium text-neutral-800">
                        {(groupData as any).group_name}
                      </h5>
                      <div className="text-xs text-neutral-500">
                        {formatDateTime(stat.created_at)}
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Performance Metrics for this record */}
                {stat.performance_metrics && (
                  <div className="mb-4">
                    <h6 className="text-xs font-medium text-neutral-700 mb-2">
                      {t('campaign_config.processing.modal.performance_metrics')}
                    </h6>
                    <div className="grid grid-cols-4 gap-4 text-sm">
                      <div className="text-center">
                        <div className="text-lg font-bold text-primary-600">
                          {groupData ? (groupData as any).total_assigned.toLocaleString() : 0}
                        </div>
                        <div className="text-xs text-neutral-500">
                          Customers Assigned
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-blue-600">
                          {stat.performance_metrics.customers_per_second}
                        </div>
                        <div className="text-xs text-neutral-500">
                          {t('campaign_config.processing.modal.customers_per_second')}
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-orange-600">
                          {stat.performance_metrics.total_duration_seconds}s
                        </div>
                        <div className="text-xs text-neutral-500">
                          {t('campaign_config.processing.modal.total_duration')}
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-teal-600">
                          {stat.total_contacts_selected}
                        </div>
                        <div className="text-xs text-neutral-500">
                          {t('campaign_config.processing.modal.contacts_selected')}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

              {/* Most Assigned Campaign for this record */}
              {stat.most_assigned_campaign && (
                <div className="border-t pt-3">
                  <h6 className="text-xs font-medium text-neutral-700 mb-2">
                    {t('campaign_config.processing.modal.most_assigned_campaign')}
                  </h6>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium text-neutral-800">
                        {stat.most_assigned_campaign.campaign_name}
                      </div>
                      <div className="text-xs text-neutral-500">
                        ID: {stat.most_assigned_campaign.campaign_id}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-bold text-green-600">
                        {stat.most_assigned_campaign.assignment_count}
                      </div>
                      <div className="text-xs text-neutral-500">
                        {t('campaign_config.processing.modal.assignments')}
                      </div>
                    </div>
                  </div>
                </div>
              )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};