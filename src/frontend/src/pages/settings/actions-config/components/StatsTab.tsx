import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardHeader, CardTitle, CardContent } from '../../../../components/ui/Card';
import { Spinner } from '../../../../components/ui/Spinner';
import { Badge } from '../../../../components/ui/Badge';
import { 
  ChartBarIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { ConfigurationUsageStats } from '../../../../services/api/workflow/action-config.api';

interface StatsTabProps {
  usageStats: ConfigurationUsageStats | null;
  loading: boolean;
}

const StatsTab: React.FC<StatsTabProps> = ({
  usageStats,
  loading
}) => {
  const { t } = useTranslation(['settings', 'common']);
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!usageStats || usageStats.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-neutral-600">{t('settings:actions_config.statistics.no_stats')}</p>
      </div>
    );
  }

  // Process the stats data
  const types = usageStats.filter(item => item.config_type === 'TYPE');
  const subtypes = usageStats.filter(item => item.config_type === 'SUBTYPE');
  const results = usageStats.filter(item => item.config_type === 'RESULT');

  const typeStats = {
    total: types.length,
    active: types.filter(item => item.is_active).length,
    inactive: types.filter(item => !item.is_active).length,
    canDeactivate: types.filter(item => item.can_be_deactivated).length,
    inUse: types.filter(item => parseInt(item.usage_count) > 0).length
  };

  const subtypeStats = {
    total: subtypes.length,
    active: subtypes.filter(item => item.is_active).length,
    inactive: subtypes.filter(item => !item.is_active).length,
    canDeactivate: subtypes.filter(item => item.can_be_deactivated).length,
    inUse: subtypes.filter(item => parseInt(item.usage_count) > 0).length
  };

  const resultStats = {
    total: results.length,
    active: results.filter(item => item.is_active).length,
    inactive: results.filter(item => !item.is_active).length,
    canDeactivate: results.filter(item => item.can_be_deactivated).length,
    inUse: results.filter(item => parseInt(item.usage_count) > 0).length
  };

  // Get most used items (sorted by usage count)
  const mostUsedTypes = types
    .sort((a, b) => parseInt(b.usage_count) - parseInt(a.usage_count))
    .slice(0, 5);

  const mostUsedSubtypes = subtypes
    .sort((a, b) => parseInt(b.usage_count) - parseInt(a.usage_count))
    .slice(0, 5);

  const mostUsedResults = results
    .sort((a, b) => parseInt(b.usage_count) - parseInt(a.usage_count))
    .slice(0, 5);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-neutral-900">{t('settings:actions_config.statistics.title')}</h3>
        <p className="text-sm text-neutral-600">{t('settings:actions_config.statistics.description')}</p>
      </div>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center space-x-2">
              <ChartBarIcon className="w-4 h-4" />
              <span>{t('settings:actions_config.statistics.action_types', { defaultValue: 'Action Types' })}</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-neutral-600">{t('settings:actions_config.statistics.total_types')}:</span>
                <span className="font-semibold">{typeStats.total}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-neutral-600">{t('settings:actions_config.statistics.active_types')}:</span>
                <span className="font-semibold text-green-600">{typeStats.active}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-neutral-600">{t('common:status.inactive')}:</span>
                <span className="font-semibold text-neutral-500">{typeStats.inactive}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-neutral-600">{t('settings:actions_config.statistics.in_use', { defaultValue: 'In Use' })}:</span>
                <span className="font-semibold text-blue-600">{typeStats.inUse}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-neutral-600">{t('settings:actions_config.statistics.can_deactivate', { defaultValue: 'Can Deactivate' })}:</span>
                <span className="font-semibold text-orange-600">{typeStats.canDeactivate}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center space-x-2">
              <ChartBarIcon className="w-4 h-4" />
              <span>{t('settings:actions_config.statistics.action_subtypes', { defaultValue: 'Action Subtypes' })}</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-neutral-600">{t('settings:actions_config.statistics.total_subtypes')}:</span>
                <span className="font-semibold">{subtypeStats.total}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-neutral-600">{t('settings:actions_config.statistics.active_subtypes')}:</span>
                <span className="font-semibold text-green-600">{subtypeStats.active}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-neutral-600">{t('common:status.inactive')}:</span>
                <span className="font-semibold text-neutral-500">{subtypeStats.inactive}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-neutral-600">{t('settings:actions_config.statistics.in_use', { defaultValue: 'In Use' })}:</span>
                <span className="font-semibold text-blue-600">{subtypeStats.inUse}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-neutral-600">{t('settings:actions_config.statistics.can_deactivate', { defaultValue: 'Can Deactivate' })}:</span>
                <span className="font-semibold text-orange-600">{subtypeStats.canDeactivate}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center space-x-2">
              <ChartBarIcon className="w-4 h-4" />
              <span>{t('settings:actions_config.statistics.action_results', { defaultValue: 'Action Results' })}</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-neutral-600">{t('settings:actions_config.statistics.total_results')}:</span>
                <span className="font-semibold">{resultStats.total}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-neutral-600">{t('settings:actions_config.statistics.active_results')}:</span>
                <span className="font-semibold text-green-600">{resultStats.active}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-neutral-600">{t('common:status.inactive')}:</span>
                <span className="font-semibold text-neutral-500">{resultStats.inactive}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-neutral-600">{t('settings:actions_config.statistics.in_use', { defaultValue: 'In Use' })}:</span>
                <span className="font-semibold text-blue-600">{resultStats.inUse}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-neutral-600">{t('settings:actions_config.statistics.can_deactivate', { defaultValue: 'Can Deactivate' })}:</span>
                <span className="font-semibold text-orange-600">{resultStats.canDeactivate}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Configuration Health */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">{t('settings:actions_config.statistics.configuration_overview', { defaultValue: 'Configuration Overview' })}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-neutral-600">{t('settings:actions_config.statistics.total_configurations', { defaultValue: 'Total Configurations' })}:</span>
                <span className="font-semibold">
                  {typeStats.total + subtypeStats.total + resultStats.total}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-neutral-600">{t('settings:actions_config.statistics.total_active', { defaultValue: 'Total Active' })}:</span>
                <span className="font-semibold text-green-600">
                  {typeStats.active + subtypeStats.active + resultStats.active}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-neutral-600">{t('settings:actions_config.statistics.total_in_use', { defaultValue: 'Total In Use' })}:</span>
                <span className="font-semibold text-blue-600">
                  {typeStats.inUse + subtypeStats.inUse + resultStats.inUse}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center space-x-2">
              <ExclamationTriangleIcon className="w-4 h-4" />
              <span>{t('settings:actions_config.statistics.deactivation_status', { defaultValue: 'Deactivation Status' })}</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-neutral-600">{t('settings:actions_config.statistics.can_be_deactivated', { defaultValue: 'Can Be Deactivated' })}:</span>
                <span className="font-semibold text-orange-600">
                  {typeStats.canDeactivate + subtypeStats.canDeactivate + resultStats.canDeactivate}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-neutral-600">{t('settings:actions_config.statistics.cannot_deactivate', { defaultValue: 'Cannot Deactivate' })}:</span>
                <span className="font-semibold text-red-600">
                  {(typeStats.total - typeStats.canDeactivate) + 
                   (subtypeStats.total - subtypeStats.canDeactivate) + 
                   (resultStats.total - resultStats.canDeactivate)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Usage Statistics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">{t('settings:actions_config.statistics.most_used_types')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {mostUsedTypes.length > 0 ? (
                mostUsedTypes.map((item, index) => (
                  <div key={index} className="flex justify-between items-center">
                    <div className="flex-1">
                      <div className="text-sm font-medium">{item.config_name}</div>
                      <div className="text-xs text-neutral-500 flex items-center space-x-2">
                        <span>{item.config_code}</span>
                        <Badge 
                          variant={item.can_be_deactivated ? 'secondary' : 'danger'}
                          className="text-xs"
                        >
                          {item.can_be_deactivated ? t('settings:actions_config.statistics.can_deactivate', { defaultValue: 'Can Deactivate' }) : t('settings:actions_config.statistics.in_use', { defaultValue: 'In Use' })}
                        </Badge>
                      </div>
                    </div>
                    <span className="text-sm font-semibold text-primary-600 ml-2">
                      {item.usage_count}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-neutral-500">{t('settings:actions_config.statistics.no_usage_data', { defaultValue: 'No usage data available' })}</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">{t('settings:actions_config.statistics.most_used_subtypes')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {mostUsedSubtypes.length > 0 ? (
                mostUsedSubtypes.map((item, index) => (
                  <div key={index} className="flex justify-between items-center">
                    <div className="flex-1">
                      <div className="text-sm font-medium">{item.config_name}</div>
                      <div className="text-xs text-neutral-500 flex items-center space-x-2">
                        <span>{item.config_code}</span>
                        <Badge 
                          variant={item.can_be_deactivated ? 'secondary' : 'danger'}
                          className="text-xs"
                        >
                          {item.can_be_deactivated ? t('settings:actions_config.statistics.can_deactivate', { defaultValue: 'Can Deactivate' }) : t('settings:actions_config.statistics.in_use', { defaultValue: 'In Use' })}
                        </Badge>
                      </div>
                    </div>
                    <span className="text-sm font-semibold text-primary-600 ml-2">
                      {item.usage_count}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-neutral-500">{t('settings:actions_config.statistics.no_usage_data', { defaultValue: 'No usage data available' })}</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">{t('settings:actions_config.statistics.most_used_results')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {mostUsedResults.length > 0 ? (
                mostUsedResults.map((item, index) => (
                  <div key={index} className="flex justify-between items-center">
                    <div className="flex-1">
                      <div className="text-sm font-medium">{item.config_name}</div>
                      <div className="text-xs text-neutral-500 flex items-center space-x-2">
                        <span>{item.config_code}</span>
                        <Badge 
                          variant={item.can_be_deactivated ? 'secondary' : 'danger'}
                          className="text-xs"
                        >
                          {item.can_be_deactivated ? t('settings:actions_config.statistics.can_deactivate', { defaultValue: 'Can Deactivate' }) : t('settings:actions_config.statistics.in_use', { defaultValue: 'In Use' })}
                        </Badge>
                      </div>
                    </div>
                    <span className="text-sm font-semibold text-primary-600 ml-2">
                      {item.usage_count}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-neutral-500">{t('settings:actions_config.statistics.no_usage_data', { defaultValue: 'No usage data available' })}</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default StatsTab;