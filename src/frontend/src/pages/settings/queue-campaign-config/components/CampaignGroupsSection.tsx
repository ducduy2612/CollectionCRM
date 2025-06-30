import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { Button } from '../../../../components/ui/Button';
import { Modal } from '../../../../components/ui/Modal';
import { Spinner } from '../../../../components/ui/Spinner';
import { Alert } from '../../../../components/ui/Alert';
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { useToast } from '../../../../components/ui/ToastProvider';
import { campaignGroupsApi } from '../../../../services/api/campaign';
import type { CampaignGroup, CreateCampaignGroupRequest, UpdateCampaignGroupRequest } from '../../../../services/api/campaign';

interface CampaignGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  group?: CampaignGroup;
}

const CampaignGroupModal: React.FC<CampaignGroupModalProps> = ({ isOpen, onClose, group }) => {
  const { t } = useTranslation('settings');
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [name, setName] = useState('');
  const [errors, setErrors] = useState<{ name?: string }>({});

  const isEditing = Boolean(group);

  useEffect(() => {
    if (group) {
      setName(group.name);
    } else {
      setName('');
    }
    setErrors({});
  }, [group, isOpen]);

  const createMutation = useMutation({
    mutationFn: (data: CreateCampaignGroupRequest) => campaignGroupsApi.createCampaignGroup(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['campaign-groups']);
      showToast(t('campaign_config.campaign_groups.messages.created'), 'success');
      onClose();
    },
    onError: (error: Error) => {
      showToast(error.message, 'error');
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateCampaignGroupRequest }) =>
      campaignGroupsApi.updateCampaignGroup(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['campaign-groups']);
      showToast(t('campaign_config.campaign_groups.messages.updated'), 'success');
      onClose();
    },
    onError: (error: Error) => {
      showToast(error.message, 'error');
    }
  });

  const validateForm = () => {
    const newErrors: { name?: string } = {};
    
    if (!name.trim()) {
      newErrors.name = t('campaign_config.campaign_groups.validation.name_required');
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    if (isEditing && group) {
      updateMutation.mutate({ id: group.id, data: { name: name.trim() } });
    } else {
      createMutation.mutate({ name: name.trim() });
    }
  };

  const isLoading = createMutation.isLoading || updateMutation.isLoading;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t(isEditing ? 'campaign_config.campaign_groups.modal.edit_title' : 'campaign_config.campaign_groups.modal.create_title')}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-neutral-700 mb-1">
            {t('campaign_config.campaign_groups.form.name')}
          </label>
          <input
            type="text"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t('campaign_config.campaign_groups.form.name_placeholder')}
            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
              errors.name ? 'border-red-300' : 'border-neutral-300'
            }`}
          />
          {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
          <p className="mt-1 text-sm text-neutral-500">
            {t('campaign_config.campaign_groups.form.name_help')}
          </p>
        </div>

        <div className="flex justify-end space-x-3 pt-4">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={isLoading}
          >
            {t('campaign_config.common.actions.cancel')}
          </Button>
          <Button
            type="submit"
            disabled={isLoading}
          >
            {isLoading && <Spinner size="sm" className="mr-2" />}
            {t(isEditing ? 'campaign_config.common.actions.save' : 'campaign_config.common.actions.create')}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

const CampaignGroupsSection: React.FC = () => {
  const { t } = useTranslation('settings');
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<CampaignGroup | undefined>();

  const { data: groups, isLoading, error } = useQuery(
    ['campaign-groups'],
    () => campaignGroupsApi.getCampaignGroups()
  );

  const deleteMutation = useMutation({
    mutationFn: (id: string) => campaignGroupsApi.deleteCampaignGroup(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['campaign-groups']);
      showToast(t('campaign_config.campaign_groups.messages.deleted'), 'success');
    },
    onError: (error: Error) => {
      showToast(error.message, 'error');
    }
  });

  const handleEdit = (group: CampaignGroup) => {
    setSelectedGroup(group);
    setIsModalOpen(true);
  };

  const handleDelete = (group: CampaignGroup) => {
    if (window.confirm(t('campaign_config.campaign_groups.messages.confirm_delete', { name: group.name }))) {
      deleteMutation.mutate(group.id);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedGroup(undefined);
  };

  if (error) {
    return <Alert variant="danger">{error instanceof Error ? error.message : 'An error occurred'}</Alert>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium text-neutral-900">
            {t('campaign_config.campaign_groups.title')}
          </h3>
          <p className="mt-1 text-sm text-neutral-500">
            {t('campaign_config.campaign_groups.description')}
          </p>
        </div>
        <Button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center"
        >
          <PlusIcon className="w-4 h-4 mr-2" />
          {t('campaign_config.campaign_groups.add_group')}
        </Button>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex justify-center py-8">
          <Spinner size="lg" />
        </div>
      ) : !groups || groups.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-neutral-500 mb-4">
            {t('campaign_config.campaign_groups.empty.no_groups')}
          </div>
          <p className="text-sm text-neutral-400">
            {t('campaign_config.campaign_groups.empty.create_first')}
          </p>
        </div>
      ) : (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-neutral-200">
            {groups.map((group) => (
              <li key={group.id}>
                <div className="px-4 py-4 flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-neutral-900">
                          {group.name}
                        </p>
                        <p className="text-sm text-neutral-500">
                          {t('campaign_config.campaign_groups.table.created_at')}: {new Date(group.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleEdit(group)}
                    >
                      <PencilIcon className="w-4 h-4 mr-1" />
                      {t('campaign_config.common.actions.edit')}
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleDelete(group)}
                      disabled={deleteMutation.isLoading}
                    >
                      <TrashIcon className="w-4 h-4 mr-1" />
                      {t('campaign_config.common.actions.delete')}
                    </Button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Modal */}
      <CampaignGroupModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        group={selectedGroup}
      />
    </div>
  );
};

export default CampaignGroupsSection;