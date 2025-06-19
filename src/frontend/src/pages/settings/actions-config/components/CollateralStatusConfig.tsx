import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardHeader, CardTitle, CardContent } from '../../../../components/ui/Card';
import { Button } from '../../../../components/ui/Button';
import { Table } from '../../../../components/ui/Table';
import { Badge } from '../../../../components/ui/Badge';
import { Modal } from '../../../../components/ui/Modal';
import { Input } from '../../../../components/ui/Input';
import { Toggle } from '../../../../components/ui/Toggle';
import { Alert } from '../../../../components/ui/Alert';
import { 
  PlusIcon, 
  PencilIcon, 
  TrashIcon,
  EyeIcon,
  EyeSlashIcon,
  BuildingOfficeIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import { CollateralStatus, statusDictApi, CollateralStatusConfig } from '../../../../services/api/workflow/status-dict.api';

interface FormData {
  code: string;
  name: string;
  description: string;
  color: string;
  displayOrder: string;
}

const CollateralStatusConfigComponent: React.FC = () => {
  const { t } = useTranslation(['settings', 'common']);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<CollateralStatus | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showInactive, setShowInactive] = useState(false);
  const [collateralStatuses, setCollateralStatuses] = useState<CollateralStatus[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>({
    code: '',
    name: '',
    description: '',
    color: '#3B82F6',
    displayOrder: '0'
  });

  // Load collateral statuses on component mount
  useEffect(() => {
    loadCollateralStatuses();
  }, []);

  const loadCollateralStatuses = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const statuses = await statusDictApi.getCollateralStatuses(true); // Include inactive for admin view
      setCollateralStatuses(statuses);
    } catch (error) {
      setError(error instanceof Error ? error.message : t('common:messages.operation_failed'));
    } finally {
      setLoading(false);
    }
  };

  const handleSuccess = (message: string) => {
    setSuccess(message);
    setError(null);
    loadCollateralStatuses(); // Reload data
    // Clear success message after 3 seconds
    setTimeout(() => setSuccess(null), 3000);
  };

  const handleError = (message: string) => {
    setError(message);
    setSuccess(null);
  };

  const resetForm = () => {
    setFormData({
      code: '',
      name: '',
      description: '',
      color: '#3B82F6',
      displayOrder: '0'
    });
    setEditingItem(null);
  };

  const handleAdd = () => {
    resetForm();
    setShowModal(true);
  };

  const handleEdit = (item: CollateralStatus) => {
    setFormData({
      code: item.code,
      name: item.name,
      description: item.description || '',
      color: item.color || '#3B82F6',
      displayOrder: item.display_order.toString()
    });
    setEditingItem(item);
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.code.trim() || !formData.name.trim()) {
      handleError(t('settings:collateral_status.validation.required_fields'));
      return;
    }

    setSubmitting(true);
    
    try {
      const config: CollateralStatusConfig = {
        code: formData.code.trim(),
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        color: formData.color || undefined,
        displayOrder: parseInt(formData.displayOrder) || 0
      };

      if (editingItem) {
        await statusDictApi.updateCollateralStatus(editingItem.code, {
          name: config.name,
          description: config.description,
          color: config.color,
          displayOrder: config.displayOrder
        });
        handleSuccess(t('settings:collateral_status.messages.update_success'));
      } else {
        await statusDictApi.addCollateralStatus(config);
        handleSuccess(t('settings:collateral_status.messages.add_success'));
      }

      setShowModal(false);
      resetForm();
    } catch (error) {
      handleError(error instanceof Error ? error.message : t('common:messages.operation_failed'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeactivate = async (item: CollateralStatus) => {
    if (!confirm(t('settings:collateral_status.confirm.deactivate', { name: item.name }))) {
      return;
    }

    try {
      await statusDictApi.deactivateCollateralStatus(item.code);
      handleSuccess(t('settings:collateral_status.messages.deactivate_success'));
    } catch (error) {
      handleError(error instanceof Error ? error.message : t('common:messages.operation_failed'));
    }
  };

  const filteredStatuses = collateralStatuses.filter(status => 
    showInactive ? true : status.is_active
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between w-full">
          <CardTitle className="flex items-center space-x-2">
            <BuildingOfficeIcon className="w-6 h-6 text-primary-600" />
            <span>{t('settings:collateral_status.title')}</span>
          </CardTitle>
          <Button
            variant="secondary"
            size="sm"
            onClick={loadCollateralStatuses}
            loading={loading}
          >
            {t('settings:actions_config.refresh')}
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        {error && (
          <Alert 
            variant="danger" 
            className="mb-6"
            icon={<ExclamationTriangleIcon className="w-5 h-5" />}
          >
            {error}
          </Alert>
        )}

        {success && (
          <Alert 
            variant="success" 
            className="mb-6"
            icon={<CheckCircleIcon className="w-5 h-5" />}
          >
            {success}
          </Alert>
        )}

        {/* Header with Add Button and Filter */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Toggle
                checked={showInactive}
                onChange={setShowInactive}
                size="sm"
              />
              <span className="text-sm text-neutral-600 flex items-center space-x-1">
                {showInactive ? <EyeIcon className="w-4 h-4" /> : <EyeSlashIcon className="w-4 h-4" />}
                <span>{t('settings:collateral_status.filter.show_inactive')}</span>
              </span>
            </div>
          </div>
          <Button
            variant="primary"
            size="sm"
            onClick={handleAdd}
            leftIcon={<PlusIcon className="w-4 h-4" />}
          >
            {t('settings:collateral_status.actions.add')}
          </Button>
        </div>

        {/* Status Count */}
        <div className="text-sm text-neutral-600 mb-4">
          {t('settings:collateral_status.summary', { 
            total: filteredStatuses.length,
            active: collateralStatuses.filter(s => s.is_active).length,
            inactive: collateralStatuses.filter(s => !s.is_active).length
          })}
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg border">
          <Table>
            <thead>
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  {t('settings:collateral_status.table.code')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  {t('settings:collateral_status.table.name')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  {t('settings:collateral_status.table.description')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  {t('settings:collateral_status.table.color')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  {t('settings:collateral_status.table.display_order')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  {t('settings:collateral_status.table.status')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  {t('settings:collateral_status.table.actions')}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-neutral-200">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center text-neutral-500">
                    {t('common:loading')}
                  </td>
                </tr>
              ) : filteredStatuses.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center text-neutral-500">
                    {showInactive 
                      ? t('settings:collateral_status.empty.no_statuses')
                      : t('settings:collateral_status.empty.no_active_statuses')
                    }
                  </td>
                </tr>
              ) : (
                filteredStatuses.map((status) => (
                  <tr key={status.id} className="hover:bg-neutral-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="font-mono text-sm">{status.code}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="font-medium">{status.name}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-neutral-600">{status.description || '-'}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <div 
                          className="w-4 h-4 rounded border border-neutral-200"
                          style={{ backgroundColor: status.color || '#3B82F6' }}
                        />
                        <span className="text-sm font-mono">{status.color || '#3B82F6'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm">{status.display_order}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge variant={status.is_active ? 'success' : 'neutral'}>
                        {status.is_active ? t('common:status.active') : t('common:status.inactive')}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(status)}
                          aria-label={t('common:actions.edit')}
                        >
                          <PencilIcon className="w-4 h-4" />
                        </Button>
                        {status.is_active && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeactivate(status)}
                            aria-label={t('common:actions.deactivate')}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <TrashIcon className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </Table>
        </div>
      </CardContent>

      {/* Add/Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          resetForm();
        }}
        title={editingItem 
          ? t('settings:collateral_status.modal.edit_title') 
          : t('settings:collateral_status.modal.add_title')
        }
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Input
              label={t('settings:collateral_status.form.code')}
              type="text"
              value={formData.code}
              onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value }))}
              placeholder={t('settings:collateral_status.form.code_placeholder')}
              required
              disabled={!!editingItem}
              maxLength={20}
            />
          </div>

          <div>
            <Input
              label={t('settings:collateral_status.form.name')}
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder={t('settings:collateral_status.form.name_placeholder')}
              required
              maxLength={100}
            />
          </div>

          <div>
            <Input
              label={t('settings:collateral_status.form.description')}
              type="text"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder={t('settings:collateral_status.form.description_placeholder')}
              maxLength={500}
            />
          </div>

          <div>
            <Input
              label={t('settings:collateral_status.form.color')}
              type="color"
              value={formData.color}
              onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
            />
          </div>

          <div>
            <Input
              label={t('settings:collateral_status.form.display_order')}
              type="number"
              value={formData.displayOrder}
              onChange={(e) => setFormData(prev => ({ ...prev, displayOrder: e.target.value }))}
              placeholder="0"
              min="0"
              max="999"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setShowModal(false);
                resetForm();
              }}
            >
              {t('common:buttons.cancel')}
            </Button>
            <Button
              type="submit"
              variant="primary"
              loading={submitting}
            >
              {editingItem ? t('common:buttons.update') : t('common:buttons.add')}
            </Button>
          </div>
        </form>
      </Modal>
    </Card>
  );
};

export default CollateralStatusConfigComponent;