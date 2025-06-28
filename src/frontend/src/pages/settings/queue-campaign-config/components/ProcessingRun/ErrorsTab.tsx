import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from '../../../../../components/ui/Card';
import type { ProcessingError } from '../../../../../services/api/campaign/types';
import { formatDateTime } from '../../../../../utils/date-time';

interface ErrorsTabProps {
  errors: ProcessingError[];
}

export const ErrorsTab: React.FC<ErrorsTabProps> = ({ errors }) => {
  const { t } = useTranslation('settings');

  if (errors.length === 0) {
    return (
      <div className="text-center py-8 text-neutral-500">
        {t('campaign_config.processing.modal.no_errors')}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {errors.map(error => (
        <Card key={error.id} className="p-4 border-l-4 border-l-red-500">
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1">
              <div className="font-medium text-red-800">{error.error_type}</div>
              <div className="text-sm text-neutral-600 mt-1">{error.error_message}</div>
            </div>
            <div className="text-xs text-neutral-500">
              {formatDateTime(error.created_at)}
            </div>
          </div>
          {error.customer_cif && (
            <div className="text-sm text-neutral-600">
              <span className="font-medium">CIF:</span> {error.customer_cif}
            </div>
          )}
        </Card>
      ))}
    </div>
  );
};