import React from 'react';
import { Button } from '../../../../../components/ui/Button';
import { ActionType, ActionSubtype } from '../../../../customers/types';

interface MappingCardProps {
  item: ActionType | ActionSubtype;
  mappingType: 'type-subtype' | 'subtype-result';
  onViewMappings: (type: 'type-subtype' | 'subtype-result', item: ActionType | ActionSubtype) => void;
}

const MappingCard: React.FC<MappingCardProps> = ({
  item,
  mappingType,
  onViewMappings
}) => {
  return (
    <div className="p-3 border rounded-lg">
      <div className="flex items-center justify-between">
        <div>
          <div className="font-medium text-sm">{item.name}</div>
          <div className="text-xs text-neutral-500">Code: {item.code}</div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onViewMappings(mappingType, item)}
          className="text-xs"
        >
          View Mappings
        </Button>
      </div>
      <div className="text-xs text-neutral-400 mt-2">
        Connected to mapped {mappingType === 'type-subtype' ? 'subtypes' : 'results'}
      </div>
    </div>
  );
};

export default MappingCard;