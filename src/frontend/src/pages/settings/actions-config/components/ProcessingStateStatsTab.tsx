import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardHeader, CardTitle, CardContent } from '../../../../components/ui/Card';
import { ProcessingStateDictItem, ProcessingSubstateDictItem } from '../../../customers/types';

interface ProcessingStateStatsTabProps {
  processingStates: ProcessingStateDictItem[];
  processingSubstates: ProcessingSubstateDictItem[];
  loading: boolean;
}

const ProcessingStateStatsTab: React.FC<ProcessingStateStatsTabProps> = ({
  processingStates,
  processingSubstates,
  loading
}) => {
  const { t } = useTranslation(['settings', 'common']);

  const activeStates = processingStates.filter(state => state.is_active);
  const activeSubstates = processingSubstates.filter(substate => substate.is_active);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-neutral-600">{t('common:loading')}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-neutral-900">{t('settings:processing_state.statistics.title')}</h3>
        <p className="text-sm text-neutral-600">
          {t('settings:processing_state.statistics.description')}
        </p>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-neutral-600">
              {t('settings:processing_state.statistics.total_states')}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-2xl font-bold text-primary-600">
              {processingStates.length}
            </div>
            <p className="text-xs text-neutral-500 mt-1">
              {activeStates.length} {t('common:active').toLowerCase()}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-neutral-600">
              {t('settings:processing_state.statistics.total_substates')}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-2xl font-bold text-primary-600">
              {processingSubstates.length}
            </div>
            <p className="text-xs text-neutral-500 mt-1">
              {activeSubstates.length} {t('common:active').toLowerCase()}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-neutral-600">
              {t('settings:processing_state.statistics.active_states')}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-2xl font-bold text-green-600">
              {activeStates.length}
            </div>
            <p className="text-xs text-neutral-500 mt-1">
              {((activeStates.length / Math.max(processingStates.length, 1)) * 100).toFixed(1)}% of total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-neutral-600">
              {t('settings:processing_state.statistics.active_substates')}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-2xl font-bold text-green-600">
              {activeSubstates.length}
            </div>
            <p className="text-xs text-neutral-500 mt-1">
              {((activeSubstates.length / Math.max(processingSubstates.length, 1)) * 100).toFixed(1)}% of total
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ProcessingStateStatsTab;