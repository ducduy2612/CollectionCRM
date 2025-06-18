import React from 'react';
import { useTranslation } from 'react-i18next';
import { 
  OneToManyMappingInterface,
  MappingTabProps
} from './mapping';

const MappingsTab: React.FC<MappingTabProps> = ({
  actionTypes,
  actionSubtypes,
  actionResults,
  loading,
  onSuccess,
  onError
}) => {
  const { t } = useTranslation(['settings', 'common']);
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-neutral-900">{t('settings:actions_config.mappings.title')}</h3>
        <p className="text-sm text-neutral-600">
          {t('settings:actions_config.mappings.description')}
        </p>
      </div>
      
      <div className="space-y-8">
        <OneToManyMappingInterface
          mappingType="type-subtype"
          sourceItems={actionTypes}
          targetItems={actionSubtypes}
          onSuccess={onSuccess}
          onError={onError}
          title={t('settings:actions_config.mappings.type_subtype_title', { defaultValue: 'Type-Subtype Mappings' })}
        />
        
        <OneToManyMappingInterface
          mappingType="subtype-result"
          sourceItems={actionSubtypes}
          targetItems={actionResults}
          onSuccess={onSuccess}
          onError={onError}
          title={t('settings:actions_config.mappings.subtype_result_title', { defaultValue: 'Subtype-Result Mappings' })}
        />
      </div>
    </div>
  );
  // Note: loading is not used in this component directly
};

export default MappingsTab;