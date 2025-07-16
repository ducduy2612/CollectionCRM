import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from '../../../../../components/ui/Card';
import { Button } from '../../../../../components/ui/Button';
import { ArrowDownTrayIcon } from '@heroicons/react/24/outline';

interface ExportTabProps {
  processingRunId: string;
  isLoading: boolean;
  onExport: () => Promise<void>;
}

export const ExportTab: React.FC<ExportTabProps> = ({ processingRunId, isLoading, onExport }) => {
  const { t } = useTranslation('settings');
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      await onExport();
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h4 className="font-medium text-neutral-800 mb-4">
          {t('campaign_config.processing.modal.export.title')}
        </h4>
        
        <div className="space-y-4">
          <p className="text-sm text-neutral-600">
            {t('campaign_config.processing.modal.export.description')}
          </p>
          
          <div className="bg-neutral-50 rounded-lg p-4">
            <h5 className="text-sm font-medium text-neutral-700 mb-2">
              {t('campaign_config.processing.modal.export.included_data')}
            </h5>
            <ul className="list-disc list-inside text-sm text-neutral-600 space-y-1">
              <li>{t('campaign_config.processing.modal.export.campaign_info')}</li>
              <li>{t('campaign_config.processing.modal.export.customer_cif')}</li>
              <li>{t('campaign_config.processing.modal.export.contact_details')}</li>
              <li>{t('campaign_config.processing.modal.export.related_party_info')}</li>
              <li>{t('campaign_config.processing.modal.export.contact_verification_status')}</li>
            </ul>
          </div>
          
          <div className="flex items-center justify-center pt-4">
            <Button
              onClick={handleExport}
              disabled={isLoading || isExporting}
              className="flex items-center gap-2"
            >
              <ArrowDownTrayIcon className="h-4 w-4" />
              {isExporting 
                ? t('campaign_config.processing.modal.export.exporting')
                : t('campaign_config.processing.modal.export.export_csv')
              }
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};