import React from 'react';
import { useTranslation } from 'react-i18next';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { Card } from '../../../../../components/ui/Card';
import { Badge } from '../../../../../components/ui/Badge';
import { Button } from '../../../../../components/ui/Button';
import type { CustomerAssignment } from '../../../../../services/api/campaign/types';
import { formatDateTime } from '../../../../../utils/date-time';

interface AssignmentsTabProps {
  assignments: CustomerAssignment[];
  searchCif: string;
  onSearchCifChange: (value: string) => void;
  onSearchAssignments: () => void;
  isLoading: boolean;
}

export const AssignmentsTab: React.FC<AssignmentsTabProps> = ({
  assignments,
  searchCif,
  onSearchCifChange,
  onSearchAssignments,
  isLoading
}) => {
  const { t } = useTranslation('settings');

  return (
    <div className="space-y-4">
      {/* Search */}
      <Card className="p-4">
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder={t('campaign_config.processing.modal.search_cif_placeholder')}
            value={searchCif}
            onChange={(e) => onSearchCifChange(e.target.value)}
            className="flex-1 px-3 py-2 border border-neutral-300 rounded-md"
            onKeyDown={(e) => e.key === 'Enter' && onSearchAssignments()}
          />
          <Button
            onClick={onSearchAssignments}
            disabled={!searchCif.trim() || isLoading}
            className="flex items-center gap-1"
          >
            <MagnifyingGlassIcon className="w-4 h-4" />
            {t('campaign_config.processing.modal.search')}
          </Button>
        </div>
      </Card>

      {/* Assignments */}
      {assignments.length === 0 ? (
        <div className="text-center py-8 text-neutral-500">
          {t('campaign_config.processing.modal.no_assignments')}
        </div>
      ) : (
        <div className="space-y-4">
          {assignments.map(assignment => (
            <Card key={assignment.id} className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="font-medium text-neutral-800">
                  CIF: {assignment.cif}
                </div>
                <div className="text-xs text-neutral-500">
                  {formatDateTime(assignment.assigned_at)}
                </div>
              </div>
              
              {/* Campaign Info */}
              {assignment.campaign_name && (
                <div className="mb-3">
                  <div className="text-sm font-medium text-neutral-700">
                    {assignment.campaign_name}
                  </div>
                  {assignment.campaign_group_name && (
                    <div className="text-xs text-neutral-500">
                      Group: {assignment.campaign_group_name}
                    </div>
                  )}
                </div>
              )}
              
              {/* Selected Contacts */}
              {assignment.selected_contacts && assignment.selected_contacts.length > 0 && (
                <div>
                  <div className="text-sm font-medium text-neutral-700 mb-2">
                    {t('campaign_config.processing.modal.selected_contacts')} ({assignment.selected_contacts.length})
                  </div>
                  <div className="space-y-2">
                    {assignment.selected_contacts.map(contact => (
                      <div key={contact.id} className="bg-neutral-50 p-2 rounded text-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{contact.contact_type}: {contact.contact_value}</span>
                          <span className="text-neutral-500">Priority: {contact.rule_priority}</span>
                        </div>
                        <div className="text-neutral-600 mt-1">
                          {contact.related_party_type} - {contact.related_party_name || contact.related_party_cif}
                          {contact.is_primary && (
                            <Badge variant="success" className="ml-2 text-xs">Primary</Badge>
                          )}
                          {contact.is_verified && (
                            <Badge variant="info" className="ml-1 text-xs">Verified</Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* No contacts message */}
              {(!assignment.selected_contacts || assignment.selected_contacts.length === 0) && (
                <div className="text-sm text-neutral-500 italic">
                  {t('campaign_config.processing.modal.no_contacts_selected')}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};