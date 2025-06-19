import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../../../components/ui/Card';
import { Button } from '../../../../components/ui/Button';
import { Alert } from '../../../../components/ui/Alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../../components/ui/Tabs';
import { 
  CogIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import { ProcessingStateDictItem, ProcessingSubstateDictItem } from '../../../customers/types';
import { statusDictApi } from '../../../../services/api/workflow/status-dict.api';
import ProcessingStatesTab from './ProcessingStatesTab';
import ProcessingSubstatesTab from './ProcessingSubstatesTab';
import ProcessingStateMappingsTab from './ProcessingStateMappingsTab';
import ProcessingStateStatsTab from './ProcessingStateStatsTab';
import { useTranslation } from '../../../../i18n/hooks/useTranslation';

type ProcessingStateConfigTab = 'states' | 'substates' | 'mappings' | 'stats';

interface ProcessingStateConfigState {
  activeTab: ProcessingStateConfigTab;
  loading: boolean;
  error: string | null;
  success: string | null;
  
  // Data
  processingStates: ProcessingStateDictItem[];
  processingSubstates: ProcessingSubstateDictItem[];
  
  refreshTrigger: number;
}

const ProcessingStateSubstateConfig: React.FC = () => {
  const { t } = useTranslation(['settings', 'common']);
  const [state, setState] = useState<ProcessingStateConfigState>({
    activeTab: 'states',
    loading: false,
    error: null,
    success: null,
    processingStates: [],
    processingSubstates: [],
    refreshTrigger: 0
  });

  // Load data on component mount and tab change
  useEffect(() => {
    loadData();
  }, [state.activeTab, state.refreshTrigger]);

  const loadData = async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      switch (state.activeTab) {
        case 'states':
          const states = await statusDictApi.getProcessingStates(true);
          setState(prev => ({ ...prev, processingStates: states }));
          break;
        case 'substates':
          const substates = await statusDictApi.getProcessingSubstates(true);
          setState(prev => ({ ...prev, processingSubstates: substates }));
          break;
        case 'mappings':
          // Load both states and substates for mappings view
          const [statesData, substatesData] = await Promise.all([
            statusDictApi.getProcessingStates(true),
            statusDictApi.getProcessingSubstates(true)
          ]);
          setState(prev => ({ 
            ...prev, 
            processingStates: statesData,
            processingSubstates: substatesData
          }));
          break;
        case 'stats':
          // Load all data for statistics view
          const [allStates, allSubstates] = await Promise.all([
            statusDictApi.getProcessingStates(true),
            statusDictApi.getProcessingSubstates(true)
          ]);
          setState(prev => ({ 
            ...prev, 
            processingStates: allStates,
            processingSubstates: allSubstates
          }));
          break;
      }
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : t('common:messages.operation_failed')
      }));
    } finally {
      setState(prev => ({ ...prev, loading: false }));
    }
  };

  const handleTabChange = (tab: ProcessingStateConfigTab) => {
    setState(prev => ({ 
      ...prev, 
      activeTab: tab,
      error: null,
      success: null
    }));
  };

  const handleRefresh = () => {
    setState(prev => ({ 
      ...prev, 
      refreshTrigger: prev.refreshTrigger + 1,
      error: null,
      success: null
    }));
  };

  const handleSuccess = (message: string) => {
    setState(prev => ({ ...prev, success: message, error: null }));
    handleRefresh();
  };

  const handleError = (message: string) => {
    setState(prev => ({ ...prev, error: message, success: null }));
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between w-full">
            <CardTitle className="flex items-center space-x-2">
              <CogIcon className="w-6 h-6 text-primary-600" />
              <span>{t('settings:processing_state.title')}</span>
            </CardTitle>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleRefresh}
              loading={state.loading}
            >
              {t('settings:actions_config.refresh')}
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          {state.error && (
            <Alert 
              variant="danger" 
              className="mb-6"
              icon={<ExclamationTriangleIcon className="w-5 h-5" />}
            >
              {state.error}
            </Alert>
          )}

          {state.success && (
            <Alert 
              variant="success" 
              className="mb-6"
              icon={<CheckCircleIcon className="w-5 h-5" />}
            >
              {state.success}
            </Alert>
          )}

          <Tabs defaultValue="states" value={state.activeTab} onValueChange={(value) => handleTabChange(value as ProcessingStateConfigTab)}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="states">{t('settings:processing_state.tabs.states')}</TabsTrigger>
              <TabsTrigger value="substates">{t('settings:processing_state.tabs.substates')}</TabsTrigger>
              <TabsTrigger value="mappings">{t('settings:processing_state.tabs.mappings')}</TabsTrigger>
              <TabsTrigger value="stats">{t('settings:processing_state.tabs.statistics')}</TabsTrigger>
            </TabsList>

            <div className="mt-6">
              <TabsContent value="states">
                <ProcessingStatesTab
                  processingStates={state.processingStates}
                  loading={state.loading}
                  onSuccess={handleSuccess}
                  onError={handleError}
                />
              </TabsContent>

              <TabsContent value="substates">
                <ProcessingSubstatesTab
                  processingSubstates={state.processingSubstates}
                  processingStates={state.processingStates}
                  loading={state.loading}
                  onSuccess={handleSuccess}
                  onError={handleError}
                />
              </TabsContent>

              <TabsContent value="mappings">
                <ProcessingStateMappingsTab
                  processingStates={state.processingStates}
                  processingSubstates={state.processingSubstates}
                  loading={state.loading}
                  onSuccess={handleSuccess}
                  onError={handleError}
                />
              </TabsContent>

              <TabsContent value="stats">
                <ProcessingStateStatsTab
                  processingStates={state.processingStates}
                  processingSubstates={state.processingSubstates}
                  loading={state.loading}
                />
              </TabsContent>
            </div>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProcessingStateSubstateConfig;