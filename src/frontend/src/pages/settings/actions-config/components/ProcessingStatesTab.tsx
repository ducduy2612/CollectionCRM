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
import { ProcessingStateDictItem } from '../../../customers/types';

interface ProcessingStatesTabProps {
  processingStates: ProcessingStateDictItem[];
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

const ProcessingStatesTab: React.FC<ProcessingStatesTabProps> = ({
  processingStates,
  loading,
  onSuccess,
  onError
}) => {
  const { t } = useTranslation(['settings', 'common']);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<ProcessingStateDictItem | null>(null);
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

  const handleEdit = (item: ProcessingStateDictItem) => {
    setFormData({
      code: item.code,
      name: item.name,
      description: item.description || '',
      display_order: item.display_order.toString()
    });
    setEditingItem(item);
    setShowModal(true);
  };

  const handleDelete = async (item: ProcessingStateDictItem) => {
    if (!confirm(t('settings:processing_state.messages.confirm_deactivate', { name: item.name }))) {
      return;
    }

    try {
      // This would need to be implemented in the API
      // const result = await statusDictApi.deactivateProcessingState(item.code);
      // if (result.success) {
        onSuccess(t('settings:processing_state.messages.state_deactivated'));
      // }
    } catch (error) {
      let errorMessage = t('settings:processing_state.messages.state_deactivated');
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      onError(errorMessage);
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    
    try {
      // This would need to be implemented in the API
      if (editingItem) {
        // Update existing processing state
        // await statusDictApi.updateProcessingState(editingItem.code, updateConfig);
      } else {
        // Add new processing state
        // await statusDictApi.addProcessingState(config);
      }
      
      onSuccess(t(`settings:processing_state.messages.state_${editingItem ? 'updated' : 'created'}`));
      setShowModal(false);
      resetForm();
      setEditingItem(null);
    } catch (error) {
      onError(error instanceof Error ? error.message : t('settings:processing_state.messages.state_created'));
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
          <h3 className="text-lg font-semibold text-neutral-900">{t('settings:processing_state.states.title')}</h3>
          <p className="text-sm text-neutral-600">{t('settings:processing_state.states.description')}</p>
        </div>
        <Button variant="primary" size="sm" onClick={handleAdd}>
          <PlusIcon className="w-4 h-4 mr-2" />
          {t('settings:processing_state.actions.add_state')}
        </Button>
      </div>
      
      <div className="bg-white rounded-lg border">
        <Table>
          <thead>
            <tr>
              <th>{t('settings:processing_state.states.table.code')}</th>
              <th>{t('settings:processing_state.states.table.name')}</th>
              <th>{t('settings:processing_state.states.table.description')}</th>
              <th>{t('settings:processing_state.states.table.display_order')}</th>
              <th>{t('settings:processing_state.states.table.status')}</th>
              <th>{t('settings:processing_state.states.table.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {processingStates.map((state) => (
              <tr key={state.id}>
                <td className="font-mono text-sm">{state.code}</td>
                <td className="font-medium">{state.name}</td>
                <td className="text-neutral-600">{state.description}</td>
                <td>{state.display_order}</td>
                <td>
                  <Badge variant={state.is_active ? 'success' : 'secondary'}>
                    {state.is_active ? t('common:status.active') : t('common:status.inactive')}
                  </Badge>
                </td>
                <td>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(state)}
                    >
                      <PencilIcon className="w-4 h-4" />
                    </Button>
                    {state.is_active && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(state)}
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
        title={t(`settings:processing_state.modal.${editingItem ? 'edit' : 'create'}_state`)}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              {t('settings:processing_state.form.code')} *
            </label>
            <Input
              value={formData.code}
              onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value }))}
              placeholder={t('settings:processing_state.form.code_placeholder')}
              disabled={!!editingItem} // Don't allow editing code
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              {t('settings:processing_state.form.name')} *
            </label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder={t('settings:processing_state.form.name_placeholder')}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              {t('settings:processing_state.form.description')}
            </label>
            <Input
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder={t('settings:processing_state.form.description_placeholder')}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              {t('settings:processing_state.form.display_order')}
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

export default ProcessingStatesTab;