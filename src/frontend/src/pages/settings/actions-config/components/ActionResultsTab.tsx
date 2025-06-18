import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '../../../../components/ui/Button';
import { Table } from '../../../../components/ui/Table';
import { Badge } from '../../../../components/ui/Badge';
import { Modal } from '../../../../components/ui/Modal';
import { Input } from '../../../../components/ui/Input';
import { 
  PlusIcon, 
  PencilIcon, 
  TrashIcon
} from '@heroicons/react/24/outline';
import { ActionResult } from '../../../customers/types';
import { actionConfigApi, ActionResultConfig } from '../../../../services/api/workflow/action-config.api';

interface ActionResultsTabProps {
  actionResults: ActionResult[];
  loading: boolean;
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
}

interface FormData {
  code: string;
  name: string;
  description: string;
  display_order: string;
  is_promise: boolean;
}

const ActionResultsTab: React.FC<ActionResultsTabProps> = ({
  actionResults,
  loading,
  onSuccess,
  onError
}) => {
  const { t } = useTranslation(['settings', 'common']);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<ActionResult | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    code: '',
    name: '',
    description: '',
    display_order: '0',
    is_promise: false
  });

  const resetForm = () => {
    setFormData({
      code: '',
      name: '',
      description: '',
      display_order: '0',
      is_promise: false
    });
  };

  const handleAdd = () => {
    resetForm();
    setEditingItem(null);
    setShowModal(true);
  };

  const handleEdit = (item: ActionResult) => {
    setFormData({
      code: item.code,
      name: item.name,
      description: item.description || '',
      display_order: item.displayOrder.toString(),
      is_promise: Boolean(item.isPromise)
    });
    setEditingItem(item);
    setShowModal(true);
  };

  const handleDelete = async (item: ActionResult) => {
    if (!confirm(t('settings:actions_config.messages.confirm_delete'))) {
      return;
    }

    try {
      const result = await actionConfigApi.deactivateActionResult(item.code);
      if (result.success) {
        onSuccess(t('settings:actions_config.messages.result_deleted'));
      }
    } catch (error) {
      // Extract detailed error message from API response
      let errorMessage = t('settings:actions_config.messages.result_deleted');
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      onError(errorMessage);
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    
    try {
      const config: ActionResultConfig = {
        code: formData.code,
        name: formData.name,
        description: formData.description,
        display_order: parseInt(formData.display_order) || 0,
        is_promise: formData.is_promise
      };

      if (editingItem) {
        // Update existing action result
        const updateConfig: Partial<ActionResultConfig> = {
          name: formData.name,
          description: formData.description,
          display_order: parseInt(formData.display_order) || 0,
          is_promise: formData.is_promise
        };
        await actionConfigApi.updateActionResult(editingItem.code, updateConfig);
      } else {
        // Add new action result
        await actionConfigApi.addActionResult(config);
      }
      
      onSuccess(t(`settings:actions_config.messages.result_${editingItem ? 'updated' : 'created'}`));
      setShowModal(false);
      resetForm();
      setEditingItem(null);
    } catch (error) {
      onError(error instanceof Error ? error.message : t('settings:actions_config.messages.result_created'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    resetForm();
    setEditingItem(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-neutral-900">{t('settings:actions_config.results.title')}</h3>
          <p className="text-sm text-neutral-600">{t('settings:actions_config.results.description')}</p>
        </div>
        <Button variant="primary" size="sm" onClick={handleAdd}>
          <PlusIcon className="w-4 h-4 mr-2" />
          {t('settings:actions_config.results.add_result')}
        </Button>
      </div>
      
      <div className="bg-white rounded-lg border">
        <Table>
          <thead>
            <tr>
              <th>{t('settings:actions_config.results.table.code')}</th>
              <th>{t('settings:actions_config.results.table.name')}</th>
              <th>{t('settings:actions_config.results.table.description')}</th>
              <th>{t('settings:actions_config.form.display_order', { defaultValue: 'Display Order' })}</th>
              <th>{t('settings:actions_config.form.is_promise', { defaultValue: 'Is Promise' })}</th>
              <th>{t('settings:actions_config.results.table.status')}</th>
              <th>{t('settings:actions_config.results.table.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {actionResults.map((result) => (
              <tr key={result.id}>
                <td className="font-mono text-sm">{result.code}</td>
                <td className="font-medium">{result.name}</td>
                <td className="text-neutral-600">{result.description}</td>
                <td>{result.displayOrder}</td>
                <td>
                  <Badge variant={result.isPromise ? 'warning' : 'secondary'}>
                    {result.isPromise ? t('common:buttons.yes') : t('common:buttons.no')}
                  </Badge>
                </td>
                <td>
                  <Badge variant={result.isActive ? 'success' : 'secondary'}>
                    {result.isActive ? t('common:status.active') : t('common:status.inactive')}
                  </Badge>
                </td>
                <td>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(result)}
                    >
                      <PencilIcon className="w-4 h-4" />
                    </Button>
                    {result.isActive && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(result)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </div>

      <Modal
        isOpen={showModal}
        onClose={handleCloseModal}
        title={t(`settings:actions_config.modal.${editingItem ? 'edit' : 'create'}_result`)}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              {t('settings:actions_config.form.code')} *
            </label>
            <Input
              value={formData.code}
              onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value }))}
              placeholder={t('settings:actions_config.form.code_placeholder')}
              disabled={!!editingItem} // Don't allow editing code
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              {t('settings:actions_config.form.name')} *
            </label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder={t('settings:actions_config.form.name_placeholder')}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              {t('settings:actions_config.form.description')}
            </label>
            <Input
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder={t('settings:actions_config.form.description_placeholder')}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              {t('settings:actions_config.form.display_order', { defaultValue: 'Display Order' })}
            </label>
            <Input
              type="number"
              value={formData.display_order}
              onChange={(e) => setFormData(prev => ({ ...prev, display_order: e.target.value }))}
              placeholder="0"
            />
          </div>
          
          <div>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formData.is_promise}
                onChange={(e) => setFormData(prev => ({ ...prev, is_promise: e.target.checked }))}
                className="rounded border-neutral-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-neutral-700">{t('settings:actions_config.form.is_promise', { defaultValue: 'Is Promise' })}</span>
            </label>
            <p className="text-xs text-neutral-500 mt-1">
              {t('settings:actions_config.form.is_promise_help', { defaultValue: 'Mark this result as a promise for future follow-up' })}
            </p>
          </div>
          
          <div className="flex justify-end space-x-3 pt-4">
            <Button
              variant="secondary"
              onClick={handleCloseModal}
            >
              {t('common:buttons.cancel')}
            </Button>
            <Button
              variant="primary"
              onClick={handleSubmit}
              loading={submitting}
              disabled={!formData.code || !formData.name}
            >
              {editingItem ? t('common:buttons.update') : t('common:buttons.add')}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ActionResultsTab;