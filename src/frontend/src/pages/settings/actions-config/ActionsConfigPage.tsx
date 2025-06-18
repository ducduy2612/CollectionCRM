import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { Button } from '../../../components/ui/Button';
import ActionsConfig from './components/ActionsConfig';
import { useTranslation } from '../../../i18n/hooks/useTranslation';

const ActionsConfigPage: React.FC = () => {
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
            aria-label="Back to Settings"
          >
            {t('settings:actions_config.back_to_settings')}
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-neutral-900">{t('settings:actions_config.title')}</h1>
            <p className="text-neutral-600 mt-1">
              {t('settings:actions_config.description')}
            </p>
          </div>
        </div>
      </div>

      {/* Actions Config Component */}
      <ActionsConfig />
    </div>
  );
};

export default ActionsConfigPage;