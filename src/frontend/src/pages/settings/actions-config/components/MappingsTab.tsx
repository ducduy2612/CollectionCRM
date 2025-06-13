import React from 'react';
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
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-neutral-900">Configuration Mappings</h3>
        <p className="text-sm text-neutral-600">
          Click on source items to view and edit their mappings. Add or remove connections by clicking target items.
        </p>
      </div>
      
      <div className="space-y-8">
        <OneToManyMappingInterface
          mappingType="type-subtype"
          sourceItems={actionTypes}
          targetItems={actionSubtypes}
          onSuccess={onSuccess}
          onError={onError}
          title="Type-Subtype Mappings"
        />
        
        <OneToManyMappingInterface
          mappingType="subtype-result"
          sourceItems={actionSubtypes}
          targetItems={actionResults}
          onSuccess={onSuccess}
          onError={onError}
          title="Subtype-Result Mappings"
        />
      </div>
    </div>
  );
};

export default MappingsTab;