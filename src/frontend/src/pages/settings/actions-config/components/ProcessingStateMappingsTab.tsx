import React from 'react';
import { useTranslation } from 'react-i18next';
import { ProcessingStateDictItem, ProcessingSubstateDictItem } from '../../../customers/types';
import OneToManyMappingInterface from './ProcessingStateMapping/OneToManyMappingInterface';

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
      
      <OneToManyMappingInterface
        sourceItems={processingStates}
        targetItems={processingSubstates}
        onSuccess={onSuccess}
        onError={onError}
        title={t('settings:processing_state.mappings.state_substate_title', { defaultValue: 'State-Substate Mappings' })}
      />
    </div>
  );
  // Note: loading is not used in this component directly
};

export default ProcessingStateMappingsTab;