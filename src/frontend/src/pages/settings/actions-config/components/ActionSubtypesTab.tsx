import React, { useState } from 'react';
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
import { ActionSubtype } from '../../../customers/types';
import { actionConfigApi, ActionSubtypeConfig } from '../../../../services/api/workflow/action-config.api';

interface ActionSubtypesTabProps {
  actionSubtypes: ActionSubtype[];
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

const ActionSubtypesTab: React.FC<ActionSubtypesTabProps> = ({
  actionSubtypes,
  loading,
  onSuccess,
  onError
}) => {
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<ActionSubtype | null>(null);
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

  const handleEdit = (item: ActionSubtype) => {
    setFormData({
      code: item.code,
      name: item.name,
      description: item.description || '',
      display_order: item.displayOrder.toString()
    });
    setEditingItem(item);
    setShowModal(true);
  };

  const handleDelete = async (item: ActionSubtype) => {
    if (!confirm(`Are you sure you want to deactivate "${item.name}"?`)) {
      return;
    }

    try {
      const result = await actionConfigApi.deactivateActionSubtype(item.code);
      if (result.success) {
        onSuccess('Action subtype deactivated successfully');
      }
    } catch (error) {
      // Extract detailed error message from API response
      let errorMessage = 'Failed to deactivate action subtype';
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      onError(errorMessage);
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    
    try {
      const config: ActionSubtypeConfig = {
        code: formData.code,
        name: formData.name,
        description: formData.description,
        display_order: parseInt(formData.display_order) || 0
      };

      if (editingItem) {
        // Update existing action subtype
        const updateConfig: Partial<ActionSubtypeConfig> = {
          name: formData.name,
          description: formData.description,
          display_order: parseInt(formData.display_order) || 0
        };
        await actionConfigApi.updateActionSubtype(editingItem.code, updateConfig);
      } else {
        // Add new action subtype
        await actionConfigApi.addActionSubtype(config);
      }
      
      onSuccess(`Action subtype ${editingItem ? 'updated' : 'added'} successfully`);
      setShowModal(false);
      resetForm();
      setEditingItem(null);
    } catch (error) {
      onError(error instanceof Error ? error.message : 'Failed to save action subtype');
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
          <h3 className="text-lg font-semibold text-neutral-900">Action Subtypes</h3>
          <p className="text-sm text-neutral-600">Manage action subtype configurations</p>
        </div>
        <Button variant="primary" size="sm" onClick={handleAdd}>
          <PlusIcon className="w-4 h-4 mr-2" />
          Add Subtype
        </Button>
      </div>
      
      <div className="bg-white rounded-lg border">
        <Table>
          <thead>
            <tr>
              <th>Code</th>
              <th>Name</th>
              <th>Description</th>
              <th>Display Order</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {actionSubtypes.map((subtype) => (
              <tr key={subtype.id}>
                <td className="font-mono text-sm">{subtype.code}</td>
                <td className="font-medium">{subtype.name}</td>
                <td className="text-neutral-600">{subtype.description}</td>
                <td>{subtype.displayOrder}</td>
                <td>
                  <Badge variant={subtype.isActive ? 'success' : 'secondary'}>
                    {subtype.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </td>
                <td>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(subtype)}
                    >
                      <PencilIcon className="w-4 h-4" />
                    </Button>
                    {subtype.isActive && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(subtype)}
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
        title={`${editingItem ? 'Edit' : 'Add'} Action Subtype`}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              Code *
            </label>
            <Input
              value={formData.code}
              onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value }))}
              placeholder="Enter code"
              disabled={!!editingItem} // Don't allow editing code
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              Name *
            </label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Enter name"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              Description
            </label>
            <Input
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Enter description"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              Display Order
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
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleSubmit}
              loading={submitting}
              disabled={!formData.code || !formData.name}
            >
              {editingItem ? 'Update' : 'Add'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ActionSubtypesTab;