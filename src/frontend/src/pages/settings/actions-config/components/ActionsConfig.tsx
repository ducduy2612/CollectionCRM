import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../../../components/ui/Card';
import { Button } from '../../../../components/ui/Button';
import { Alert } from '../../../../components/ui/Alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../../components/ui/Tabs';
import { 
  BoltIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import { ActionType, ActionSubtype, ActionResult } from '../../../customers/types';
import { actionConfigApi, ConfigurationUsageStats } from '../../../../services/api/workflow/action-config.api';
import ActionTypesTab from './ActionTypesTab';
import ActionSubtypesTab from './ActionSubtypesTab';
import ActionResultsTab from './ActionResultsTab';
import MappingsTab from './MappingsTab';
import StatsTab from './StatsTab';
import { useTranslation } from '../../../../i18n/hooks/useTranslation';

type ActionConfigTab = 'types' | 'subtypes' | 'results' | 'mappings' | 'stats';

interface ActionConfigState {
  activeTab: ActionConfigTab;
  loading: boolean;
  error: string | null;
  success: string | null;
  
  // Data
  actionTypes: ActionType[];
  actionSubtypes: ActionSubtype[];
  actionResults: ActionResult[];
  usageStats: ConfigurationUsageStats | null;
  
  refreshTrigger: number;
}

const ActionsConfig: React.FC = () => {
  const { t } = useTranslation(['settings', 'common']);
  const [state, setState] = useState<ActionConfigState>({
    activeTab: 'types',
    loading: false,
    error: null,
    success: null,
    actionTypes: [],
    actionSubtypes: [],
    actionResults: [],
    usageStats: null,
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
        case 'types':
          const types = await actionConfigApi.getAllActionTypes();
          setState(prev => ({ ...prev, actionTypes: types }));
          break;
        case 'subtypes':
          const subtypes = await actionConfigApi.getAllActionSubtypes();
          setState(prev => ({ ...prev, actionSubtypes: subtypes }));
          break;
        case 'results':
          const results = await actionConfigApi.getAllActionResults();
          setState(prev => ({ ...prev, actionResults: results }));
          break;
        case 'mappings':
          // Load all data for mappings view
          const [typesData, subtypesData, resultsData] = await Promise.all([
            actionConfigApi.getAllActionTypes(),
            actionConfigApi.getAllActionSubtypes(),
            actionConfigApi.getAllActionResults()
          ]);
          setState(prev => ({ 
            ...prev, 
            actionTypes: typesData,
            actionSubtypes: subtypesData,
            actionResults: resultsData
          }));
          break;
        case 'stats':
          const stats = await actionConfigApi.getConfigurationUsageStats();
          setState(prev => ({ ...prev, usageStats: stats }));
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

  const handleTabChange = (tab: ActionConfigTab) => {
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
              <BoltIcon className="w-6 h-6 text-primary-600" />
              <span>{t('settings:actions_config.title')}</span>
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

          <Tabs defaultValue="types" value={state.activeTab} onValueChange={(value) => handleTabChange(value as ActionConfigTab)}>
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="types">{t('settings:actions_config.tabs.types')}</TabsTrigger>
              <TabsTrigger value="subtypes">{t('settings:actions_config.tabs.subtypes')}</TabsTrigger>
              <TabsTrigger value="results">{t('settings:actions_config.tabs.results')}</TabsTrigger>
              <TabsTrigger value="mappings">{t('settings:actions_config.tabs.mappings')}</TabsTrigger>
              <TabsTrigger value="stats">{t('settings:actions_config.tabs.statistics')}</TabsTrigger>
            </TabsList>

            <div className="mt-6">
              <TabsContent value="types">
                <ActionTypesTab
                  actionTypes={state.actionTypes}
                  loading={state.loading}
                  onSuccess={handleSuccess}
                  onError={handleError}
                />
              </TabsContent>

              <TabsContent value="subtypes">
                <ActionSubtypesTab
                  actionSubtypes={state.actionSubtypes}
                  loading={state.loading}
                  onSuccess={handleSuccess}
                  onError={handleError}
                />
              </TabsContent>

              <TabsContent value="results">
                <ActionResultsTab
                  actionResults={state.actionResults}
                  loading={state.loading}
                  onSuccess={handleSuccess}
                  onError={handleError}
                />
              </TabsContent>

              <TabsContent value="mappings">
                <MappingsTab
                  actionTypes={state.actionTypes}
                  actionSubtypes={state.actionSubtypes}
                  actionResults={state.actionResults}
                  loading={state.loading}
                  onSuccess={handleSuccess}
                  onError={handleError}
                />
              </TabsContent>

              <TabsContent value="stats">
                <StatsTab
                  usageStats={state.usageStats}
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

export default ActionsConfig;