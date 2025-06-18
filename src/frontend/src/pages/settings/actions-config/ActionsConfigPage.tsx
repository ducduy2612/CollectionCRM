import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { Button } from '../../../components/ui/Button';
import { ActionsConfig } from './components/ActionsConfig';
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
            Back to Settings
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-neutral-900">Actions Configuration</h1>
            <p className="text-neutral-600 mt-1">
              Configure action types, subtypes, results, and their mappings for collection workflows
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