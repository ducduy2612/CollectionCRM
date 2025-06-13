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
    if (!confirm(`Are you sure you want to deactivate "${item.name}"?`)) {
      return;
    }

    try {
      const result = await actionConfigApi.deactivateActionResult(item.code);
      if (result.success) {
        onSuccess('Action result deactivated successfully');
      }
    } catch (error) {
      // Extract detailed error message from API response
      let errorMessage = 'Failed to deactivate action result';
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
      
      onSuccess(`Action result ${editingItem ? 'updated' : 'added'} successfully`);
      setShowModal(false);
      resetForm();
      setEditingItem(null);
    } catch (error) {
      onError(error instanceof Error ? error.message : 'Failed to save action result');
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
          <h3 className="text-lg font-semibold text-neutral-900">Action Results</h3>
          <p className="text-sm text-neutral-600">Manage action result configurations</p>
        </div>
        <Button variant="primary" size="sm" onClick={handleAdd}>
          <PlusIcon className="w-4 h-4 mr-2" />
          Add Result
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
              <th>Is Promise</th>
              <th>Status</th>
              <th>Actions</th>
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
                    {result.isPromise ? 'Yes' : 'No'}
                  </Badge>
                </td>
                <td>
                  <Badge variant={result.isActive ? 'success' : 'secondary'}>
                    {result.isActive ? 'Active' : 'Inactive'}
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
        title={`${editingItem ? 'Edit' : 'Add'} Action Result`}
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
          
          <div>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formData.is_promise}
                onChange={(e) => setFormData(prev => ({ ...prev, is_promise: e.target.checked }))}
                className="rounded border-neutral-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-neutral-700">Is Promise</span>
            </label>
            <p className="text-xs text-neutral-500 mt-1">
              Mark this result as a promise for future follow-up
            </p>
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

export default ActionResultsTab;