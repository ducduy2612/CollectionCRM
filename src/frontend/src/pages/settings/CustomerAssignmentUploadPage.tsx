import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { Button } from '../../components/ui/Button';
import { CustomerAssignmentUpload } from './customer-assignment-upload';
import { useTranslation } from '../../i18n/hooks/useTranslation';

const CustomerAssignmentUploadPage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation(['settings', 'common']);

  const handleGoBack = () => {
    navigate('/settings');
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="secondary"
            size="sm"
            onClick={handleGoBack}
            leftIcon={<ArrowLeftIcon className="w-4 h-4" />}
            aria-label={t('settings:messages.back_to_settings')}
          >
            {t('settings:messages.back_to_settings')}
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-neutral-900">{t('settings:customerAssignmentUpload.title')}</h1>
            <p className="text-neutral-600 mt-1">
              {t('settings:customerAssignmentUpload.description')}
            </p>
          </div>
        </div>
      </div>

      {/* Customer Assignment Upload Component */}
      <CustomerAssignmentUpload />
    </div>
  );
};

export default CustomerAssignmentUploadPage;