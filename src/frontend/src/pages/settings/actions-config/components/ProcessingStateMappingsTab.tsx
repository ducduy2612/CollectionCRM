import React from 'react';
import { useTranslation } from 'react-i18next';
import { ProcessingStateDictItem, ProcessingSubstateDictItem } from '../../../customers/types';

interface ProcessingStateMappingsTabProps {
  processingStates: ProcessingStateDictItem[];
  processingSubstates: ProcessingSubstateDictItem[];
  loading: boolean;
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
}

const ProcessingStateMappingsTab: React.FC<ProcessingStateMappingsTabProps> = ({
  processingStates,
  processingSubstates,
  loading,
  onSuccess,
  onError
}) => {
  const { t } = useTranslation(['settings', 'common']);
  
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-neutral-900">{t('settings:processing_state.mappings.title')}</h3>
        <p className="text-sm text-neutral-600">
          {t('settings:processing_state.mappings.description')}
        </p>
      </div>
      
      <div className="bg-neutral-50 rounded-lg p-8 text-center">
        <p className="text-neutral-500">
          Mappings functionality will be implemented when the API endpoints are available.
        </p>
        <p className="text-sm text-neutral-400 mt-2">
          States: {processingStates.length} | Substates: {processingSubstates.length}
        </p>
      </div>
    </div>
  );
  // Note: loading, onSuccess, onError are not used in this simplified component
};

export default ProcessingStateMappingsTab;