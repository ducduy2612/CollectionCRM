import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { Button } from '../../../../components/ui/Button';
import { Spinner } from '../../../../components/ui/Spinner';
import { Alert } from '../../../../components/ui/Alert';
import { PlusIcon, PencilIcon, TrashIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { useToast } from '../../../../components/ui/ToastProvider';
import { campaignGroupsApi, campaignsApi } from '../../../../services/api/campaign';
import type { Campaign, CampaignGroup } from '../../../../services/api/campaign';
import CampaignDetailsModal from './CampaignDetailsModal';

const CampaignsSection: React.FC = () => {
  const { t } = useTranslation('settings');
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [selectedGroupId, setSelectedGroupId] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | undefined>();
  const [searchTerm, setSearchTerm] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Fetch campaign groups for the filter dropdown
  const { data: groups } = useQuery(
    ['campaign-groups'],
    () => campaignGroupsApi.getCampaignGroups()
  );

  // Fetch campaigns based on selected group
  const { data: allCampaigns, isLoading, error } = useQuery(
    ['campaigns', selectedGroupId],
    () => campaignsApi.getCampaigns(selectedGroupId || undefined)
  );

  // Get unique campaign names for suggestions
  const campaignNames = useMemo(() => {
    if (!allCampaigns) return [];
    return Array.from(new Set(allCampaigns.map(campaign => campaign.name)));
  }, [allCampaigns]);

  // Filter campaigns based on search term
  const campaigns = useMemo(() => {
    if (!allCampaigns) return [];
    if (!searchTerm.trim()) return allCampaigns;
    return allCampaigns.filter(campaign => {
      const group = groups?.find(g => g.id === campaign.campaign_group_id);
      return campaign.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
             (group?.name || '').toLowerCase().includes(searchTerm.toLowerCase());
    });
  }, [allCampaigns, searchTerm, groups]);

  // Get suggestions based on search term
  const suggestions = useMemo(() => {
    if (!searchTerm.trim()) return [];
    return campaignNames.filter(name => 
      name.toLowerCase().includes(searchTerm.toLowerCase()) && name !== searchTerm
    ).slice(0, 5);
  }, [campaignNames, searchTerm]);

  const deleteMutation = useMutation({
    mutationFn: (id: string) => campaignsApi.deleteCampaign(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['campaigns']);
      showToast(t('campaign_config.campaigns.messages.deleted'), 'success');
    },
    onError: (error: Error) => {
      showToast(error.message, 'error');
    }
  });

  const handleEdit = (campaign: Campaign) => {
    setSelectedCampaign(campaign);
    setIsModalOpen(true);
  };

  const handleDelete = (campaign: Campaign) => {
    if (window.confirm(t('campaign_config.campaigns.messages.confirm_delete', { name: campaign.name }))) {
      deleteMutation.mutate(campaign.id);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedCampaign(undefined);
  };

  const handleCreateNew = () => {
    if (!groups || groups.length === 0) {
      showToast('Please create a campaign group first', 'error');
      return;
    }
    setIsModalOpen(true);
  };

  if (error) {
    return <Alert variant="danger">{error instanceof Error ? error.message : 'An error occurred'}</Alert>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <h3 className="text-lg font-medium text-neutral-900">
            {t('campaign_config.campaigns.title')}
          </h3>
          <p className="mt-1 text-sm text-neutral-500">
            {t('campaign_config.campaigns.description')}
          </p>
        </div>
        <Button
          onClick={handleCreateNew}
          className="flex items-center"
          disabled={!groups || groups.length === 0}
        >
          <PlusIcon className="w-4 h-4 mr-2" />
          {t('campaign_config.campaigns.add_campaign')}
        </Button>
      </div>

      {/* Filter and Search */}
      <div className="flex items-end space-x-4">
        <div className="w-64">
          <label htmlFor="group-filter" className="block text-sm font-medium text-neutral-700 mb-1">
            {t('campaign_config.campaigns.filter.group_placeholder')}
          </label>
          <select
            id="group-filter"
            value={selectedGroupId}
            onChange={(e) => setSelectedGroupId(e.target.value)}
            className="w-full px-3 py-2 border border-neutral-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="">{t('campaign_config.campaigns.filter.all_groups')}</option>
            {groups?.map((group) => (
              <option key={group.id} value={group.id}>
                {group.name}
              </option>
            ))}
          </select>
        </div>
        
        {/* Search Box */}
        <div className="flex-1 max-w-md relative">
          <label htmlFor="campaign-search" className="block text-sm font-medium text-neutral-700 mb-1">
            Search Campaigns
          </label>
          <div className="relative">
            <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400" />
            <input
              id="campaign-search"
              type="text"
              placeholder="Search by campaign name or group..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              className="w-full pl-10 pr-3 py-2 border border-neutral-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
              >
                ×
              </button>
            )}
          </div>
          
          {/* Suggestions Dropdown */}
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-neutral-200 rounded-md shadow-lg z-10">
              {suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  className="w-full text-left px-3 py-2 hover:bg-neutral-50 text-sm border-b border-neutral-100 last:border-b-0"
                  onClick={() => {
                    setSearchTerm(suggestion);
                    setShowSuggestions(false);
                  }}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      {!groups || groups.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-neutral-500 mb-4">
            Please create campaign groups first before creating campaigns.
          </div>
        </div>
      ) : isLoading ? (
        <div className="flex justify-center py-8">
          <Spinner size="lg" />
        </div>
      ) : !campaigns || campaigns.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-neutral-500 mb-4">
            {searchTerm 
              ? `No campaigns found matching "${searchTerm}"`
              : selectedGroupId 
                ? t('campaign_config.campaigns.empty.no_campaigns_for_group')
                : t('campaign_config.campaigns.empty.no_campaigns')
            }
          </div>
          {!searchTerm && (
            <p className="text-sm text-neutral-400">
              {t('campaign_config.campaigns.empty.create_first')}
            </p>
          )}
        </div>
      ) : (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-neutral-200">
            {campaigns.map((campaign) => {
              const group = groups?.find(g => g.id === campaign.campaign_group_id);
              return (
                <li key={campaign.id}>
                  <div className="px-4 py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center">
                          <div className="flex-1">
                            <p className="text-sm font-medium text-neutral-900">
                              {campaign.name}
                            </p>
                            <div className="mt-1 flex items-center space-x-4 text-sm text-neutral-500">
                              <span>
                                {t('campaign_config.campaigns.table.group')}: {group?.name || 'Unknown'}
                              </span>
                              <span>
                                {t('campaign_config.campaigns.table.priority')}: {campaign.priority}
                              </span>
                              <span>
                                {t('campaign_config.campaigns.table.created_at')}: {new Date(campaign.created_at).toLocaleDateString()}
                              </span>
                            </div>
                            <div className="mt-1 flex items-center space-x-4 text-sm text-neutral-400">
                              <span>
                                {t('campaign_config.campaigns.table.conditions')}: {campaign.base_conditions?.length || 0}
                              </span>
                              <span>
                                {t('campaign_config.campaigns.table.contact_rules')}: {campaign.contact_selection_rules?.length || 0}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleEdit(campaign)}
                        >
                          <PencilIcon className="w-4 h-4 mr-1" />
                          {t('campaign_config.common.actions.edit')}
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleDelete(campaign)}
                          disabled={deleteMutation.isLoading}
                        >
                          <TrashIcon className="w-4 h-4 mr-1" />
                          {t('campaign_config.common.actions.delete')}
                        </Button>
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {/* Campaign Details Modal */}
      <CampaignDetailsModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        campaign={selectedCampaign}
        campaignGroups={groups || []}
      />
    </div>
  );
};

export default CampaignsSection;