import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../../../../components/ui/Card';
import { LinkIcon } from '@heroicons/react/24/outline';
import { ActionType, ActionSubtype } from '../../../../customers/types';
import MappingCard from './MappingCard';

interface MappingSectionProps {
  title: string;
  items: ActionType[] | ActionSubtype[];
  mappingType: 'type-subtype' | 'subtype-result';
  onViewMappings: (type: 'type-subtype' | 'subtype-result', item: ActionType | ActionSubtype) => void;
}

const MappingSection: React.FC<MappingSectionProps> = ({
  title,
  items,
  mappingType,
  onViewMappings
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <LinkIcon className="w-5 h-5" />
          <span>{title}</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {items.filter(item => item.isActive).map(item => (
            <MappingCard
              key={item.id}
              item={item}
              mappingType={mappingType}
              onViewMappings={onViewMappings}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default MappingSection;