import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { UserGroupIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { Card } from '../../../../../components/ui/Card';
import { Badge } from '../../../../../components/ui/Badge';
import { Button } from '../../../../../components/ui/Button';
import type { CampaignResult } from '../../../../../services/api/campaign/types';

interface ResultsTabProps {
  campaignResults: CampaignResult[];
  onLoadCampaignAssignments: (campaignResultId: string) => void;
}

export const ResultsTab: React.FC<ResultsTabProps> = ({ 
  campaignResults, 
  onLoadCampaignAssignments 
}) => {
  const { t } = useTranslation('settings');
  const [searchTerm, setSearchTerm] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  // Get unique campaign names for suggestions
  const campaignNames = useMemo(() => {
    return Array.from(new Set(campaignResults.map(result => result.campaign_name)));
  }, [campaignResults]);

  // Filter campaigns based on search term
  const filteredResults = useMemo(() => {
    if (!searchTerm.trim()) return campaignResults;
    return campaignResults.filter(result => 
      result.campaign_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      result.campaign_group_name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [campaignResults, searchTerm]);

  // Group campaigns by campaign_group_name
  const groupedResults = useMemo(() => {
    return filteredResults.reduce((groups, result) => {
      const groupName = result.campaign_group_name;
      if (!groups[groupName]) {
        groups[groupName] = [];
      }
      groups[groupName].push(result);
      return groups;
    }, {} as Record<string, CampaignResult[]>);
  }, [filteredResults]);

  // Get suggestions based on search term
  const suggestions = useMemo(() => {
    if (!searchTerm.trim()) return [];
    return campaignNames.filter(name => 
      name.toLowerCase().includes(searchTerm.toLowerCase()) && name !== searchTerm
    ).slice(0, 5);
  }, [campaignNames, searchTerm]);

  if (campaignResults.length === 0) {
    return (
      <div className="text-center py-8 text-neutral-500">
        {t('campaign_config.processing.modal.no_results')}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search Box */}
      <Card className="p-4">
        <div className="relative">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400" />
              <input
                type="text"
                placeholder="Search campaigns..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                className="w-full pl-10 pr-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            {searchTerm && (
              <Button
                size="sm"
                variant="secondary"
                onClick={() => setSearchTerm('')}
              >
                Clear
              </Button>
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
      </Card>

      {/* Grouped Results */}
      {Object.keys(groupedResults).length === 0 ? (
        <div className="text-center py-8 text-neutral-500">
          No campaigns found matching "{searchTerm}"
        </div>
      ) : (
        Object.entries(groupedResults).map(([groupName, results]) => (
          <div key={groupName} className="space-y-3">
            {/* Group Header */}
            <div className="flex items-center gap-2">
              <h4 className="font-medium text-neutral-800">{groupName}</h4>
              <Badge variant="secondary">{results.length} campaigns</Badge>
            </div>
            
            {/* Group Results */}
            <div className="space-y-3 ml-4">
              {results.map(result => (
                <Card key={result.id} className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h5 className="font-medium text-neutral-800">{result.campaign_name}</h5>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-3">
                    <div>
                      <span className="text-neutral-500">{t('campaign_config.processing.modal.customers_assigned')}:</span>
                      <div className="font-medium">{result.customers_assigned}</div>
                    </div>
                    <div>
                      <span className="text-neutral-500">{t('campaign_config.processing.modal.customers_with_contacts')}:</span>
                      <div className="font-medium text-blue-600">{result.customers_with_contacts}</div>
                    </div>
                    <div>
                      <span className="text-neutral-500">{t('campaign_config.processing.modal.contacts_selected')}:</span>
                      <div className="font-medium text-green-600">{result.total_contacts_selected}</div>
                    </div>
                    <div>
                      <span className="text-neutral-500">{t('campaign_config.processing.modal.duration')}:</span>
                      <div className="font-medium text-orange-600">{result.processing_duration_ms}ms</div>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => onLoadCampaignAssignments(result.id)}
                    className="flex items-center gap-1"
                  >
                    <UserGroupIcon className="w-4 h-4" />
                    {t('campaign_config.processing.modal.view_assignments')}
                  </Button>
                </Card>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
};