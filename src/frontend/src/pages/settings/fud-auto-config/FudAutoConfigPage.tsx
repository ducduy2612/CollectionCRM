import React, { useState, useEffect } from 'react';
import { Button, Alert, Spinner } from '../../../components/ui';
import { Card } from '../../../components/ui/Card';
import { CpuChipIcon, PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { fudAutoConfigApi, FudAutoConfig } from '../../../services/api/workflow/fud-auto-config.api';
import { useTranslation } from '../../../i18n/hooks/useTranslation';
import { FudRuleModal } from './components/FudRuleModal';

const FudAutoConfigPage: React.FC = () => {
  const { t } = useTranslation();
  const [configs, setConfigs] = useState<FudAutoConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingConfig, setEditingConfig] = useState<FudAutoConfig | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Load configurations
  const loadConfigs = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fudAutoConfigApi.getAllConfigs(true); // Include inactive
      setConfigs(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load FUD configurations');
      console.error('Error loading FUD configurations:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConfigs();
  }, []);

  // Handle create
  const handleCreate = () => {
    setEditingConfig(null);
    setIsModalOpen(true);
  };

  // Handle edit
  const handleEdit = (config: FudAutoConfig) => {
    setEditingConfig(config);
    setIsModalOpen(true);
  };

  // Handle delete
  const handleDelete = async (id: string) => {
    if (!confirm(t('settings:fud_auto_config.delete_confirmation'))) {
      return;
    }

    try {
      setDeletingId(id);
      await fudAutoConfigApi.deleteConfig(id);
      await loadConfigs(); // Reload data
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete FUD configuration');
      console.error('Error deleting FUD configuration:', err);
    } finally {
      setDeletingId(null);
    }
  };

  // Handle modal success
  const handleModalSuccess = () => {
    setIsModalOpen(false);
    setEditingConfig(null);
    loadConfigs();
  };

  const formatCalculationType = (type: string) => {
    return type === 'PROMISE_DATE' 
      ? t('settings:fud_auto_config.calculation_types.promise_date')
      : t('settings:fud_auto_config.calculation_types.action_date');
  };

  const formatDaysOffset = (days: number) => {
    if (days === 0) return t('settings:fud_auto_config.same_day');
    if (days === 1) return t('settings:fud_auto_config.next_day');
    if (days === -1) return t('settings:fud_auto_config.previous_day');
    if (days > 0) return t('settings:fud_auto_config.days_after', { replace: { days } });
    return t('settings:fud_auto_config.days_before', { replace: { days: Math.abs(days) } });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center">
          <CpuChipIcon className="w-8 h-8 text-primary-600 mr-2" />
          <div>
            <h1 className="text-3xl font-bold text-neutral-900">
              {t('settings:fud_auto_config.title')}
            </h1>
            <p className="text-neutral-600 mt-1">
              {t('settings:fud_auto_config.description')}
            </p>
          </div>
        </div>
        <Button
          variant="primary"
          onClick={handleCreate}
          leftIcon={<PlusIcon className="w-4 h-4" />}
        >
          {t('settings:fud_auto_config.add_rule')}
        </Button>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert
          variant="danger"
          title={t('common:error')}
          message={error}
          onClose={() => setError(null)}
        />
      )}

      {/* Configuration Table */}
      <Card className="p-6">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-neutral-200">
            <thead className="bg-neutral-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  {t('settings:fud_auto_config.table.action_result')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  {t('settings:fud_auto_config.table.calculation_type')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  {t('settings:fud_auto_config.table.days_offset')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  {t('settings:fud_auto_config.table.priority')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  {t('settings:fud_auto_config.table.status')}
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  {t('settings:fud_auto_config.table.action')}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-neutral-200">
              {configs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-neutral-500">
                    {t('settings:fud_auto_config.no_configurations')}
                  </td>
                </tr>
              ) : (
                configs.map((config) => (
                  <tr key={config.id} className="hover:bg-neutral-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-neutral-900">
                          {config.action_result?.name || 'Unknown'}
                        </div>
                        <div className="text-sm text-neutral-500">
                          {config.action_result?.code || 'N/A'}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900">
                      {formatCalculationType(config.calculation_type)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900">
                      {formatDaysOffset(config.days_offset)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900">
                      {config.priority}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        config.is_active
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {config.is_active 
                          ? t('common:status.active')
                          : t('common:status.inactive')
                        }
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(config)}
                        leftIcon={<PencilIcon className="w-4 h-4" />}
                      >
                        {t('common:buttons.edit')}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(config.id)}
                        loading={deletingId === config.id}
                        leftIcon={<TrashIcon className="w-4 h-4" />}
                        className="text-red-600 hover:text-red-700"
                      >
                        {t('common:buttons.delete')}
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Modal */}
      <FudRuleModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingConfig(null);
        }}
        onSuccess={handleModalSuccess}
        config={editingConfig}
        mode={editingConfig ? 'edit' : 'create'}
        existingConfigs={configs}
      />
    </div>
  );
};

export default FudAutoConfigPage;