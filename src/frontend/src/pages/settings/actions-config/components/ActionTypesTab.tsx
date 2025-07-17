import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '../../../../components/ui/Button';
import { Table } from '../../../../components/ui/Table';
import { Badge } from '../../../../components/ui/Badge';
import { Modal } from '../../../../components/ui/Modal';
import { Input } from '../../../../components/ui/Input';
import { Toggle } from '../../../../components/ui/Toggle';
import { 
  PlusIcon, 
  PencilIcon, 
  TrashIcon,
  EyeIcon,
  EyeSlashIcon
} from '@heroicons/react/24/outline';
import { ActionType } from '../../../customers/types';
import { actionConfigApi, ActionTypeConfig } from '../../../../services/api/workflow/action-config.api';

interface ActionTypesTabProps {
  actionTypes: ActionType[];
  loading: boolean;
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
}

interface FormData {
  code: string;
  name: string;
  description: string;
  display_order: string;
}

const ActionTypesTab: React.FC<ActionTypesTabProps> = ({
  actionTypes,
  loading,
  onSuccess,
  onError
}) => {
  const { t } = useTranslation(['settings', 'common']);
  const [showModal, setShowModal] = useState(false);
  const [showInactive, setShowInactive] = useState(false);
  const [editingItem, setEditingItem] = useState<ActionType | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    code: '',
    name: '',
    description: '',
    display_order: '0'
  });

  const resetForm = () => {
    setFormData({
      code: '',
      name: '',
      description: '',
      display_order: '0'
    });
  };

  const handleAdd = () => {
    resetForm();
    setEditingItem(null);
    setShowModal(true);
  };

  const handleEdit = (item: ActionType) => {
    setFormData({
      code: item.code,
      name: item.name,
      description: item.description || '',
      display_order: item.displayOrder.toString()
    });
    setEditingItem(item);
    setShowModal(true);
  };

  const handleDelete = async (item: ActionType) => {
    if (!confirm(t('settings:actions_config.messages.confirm_delete'))) {
      return;
    }

    try {
      const result = await actionConfigApi.deactivateActionType(item.code);
      if (result.success) {
        onSuccess(t('settings:actions_config.messages.type_deleted'));
      }
    } catch (error) {
      // Extract detailed error message from API response
      let errorMessage = t('settings:actions_config.messages.type_deleted');
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      onError(errorMessage);
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    
    try {
      const config: ActionTypeConfig = {
        code: formData.code,
        name: formData.name,
        description: formData.description,
        display_order: parseInt(formData.display_order) || 0
      };

      if (editingItem) {
        // Update existing action type
        const updateConfig: Partial<ActionTypeConfig> = {
          name: formData.name,
          description: formData.description,
          display_order: parseInt(formData.display_order) || 0
        };
        await actionConfigApi.updateActionType(editingItem.code, updateConfig);
      } else {
        // Add new action type
        await actionConfigApi.addActionType(config);
      }
      
      onSuccess(t(`settings:actions_config.messages.type_${editingItem ? 'updated' : 'created'}`));
      setShowModal(false);
      resetForm();
      setEditingItem(null);
    } catch (error) {
      onError(error instanceof Error ? error.message : t('settings:actions_config.messages.type_created'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    resetForm();
    setEditingItem(null);
  };

  const filteredActionTypes = showInactive 
    ? actionTypes 
    : actionTypes.filter(type => type.isActive);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-neutral-900">{t('settings:actions_config.types.title')}</h3>
          <p className="text-sm text-neutral-600">{t('settings:actions_config.types.description')}</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Toggle
              checked={showInactive}
              onChange={setShowInactive}
              size="sm"
            />
            <span className="text-sm text-neutral-600 flex items-center space-x-1">
              {showInactive ? <EyeIcon className="w-4 h-4" /> : <EyeSlashIcon className="w-4 h-4" />}
              <span>{t('settings:customer_status.filter.show_inactive')}</span>
            </span>
          </div>
          <Button variant="primary" size="sm" onClick={handleAdd}>
            <PlusIcon className="w-4 h-4 mr-2" />
            {t('settings:actions_config.types.add_type')}
          </Button>
        </div>
      </div>
      
      <div className="bg-white rounded-lg border">
        <Table>
          <thead>
            <tr>
              <th>{t('settings:actions_config.types.table.code')}</th>
              <th>{t('settings:actions_config.types.table.name')}</th>
              <th>{t('settings:actions_config.types.table.description')}</th>
              <th>{t('settings:actions_config.form.display_order', { defaultValue: 'Display Order' })}</th>
              <th>{t('settings:actions_config.types.table.status')}</th>
              <th>{t('settings:actions_config.types.table.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {filteredActionTypes.map((type) => (
              <tr key={type.id}>
                <td className="font-mono text-sm">{type.code}</td>
                <td className="font-medium">{type.name}</td>
                <td className="text-neutral-600">{type.description}</td>
                <td>{type.displayOrder}</td>
                <td>
                  <Badge variant={type.isActive ? 'success' : 'secondary'}>
                    {type.isActive ? t('common:status.active') : t('common:status.inactive')}
                  </Badge>
                </td>
                <td>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(type)}
                    >
                      <PencilIcon className="w-4 h-4" />
                    </Button>
                    {type.isActive && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(type)}
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
        title={t(`settings:actions_config.modal.${editingItem ? 'edit' : 'create'}_type`)}
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

export default ActionTypesTab;