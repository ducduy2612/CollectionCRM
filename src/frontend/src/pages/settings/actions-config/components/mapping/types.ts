import { ActionType, ActionSubtype, ActionResult } from '../../../../customers/types';

// Removed unused MappingData and DragItem interfaces

export interface ViewingMappings {
  type: 'type-subtype' | 'subtype-result';
  sourceItem: ActionType | ActionSubtype;
  mappedItems: ActionSubtype[] | ActionResult[];
}

export interface MappingConnection {
  sourceCode: string;
  targetCode: string;
  isExisting: boolean; // true if it exists in DB, false if it's new
  isDeleted: boolean;  // true if marked for deletion
}

export interface SelectedSourceMapping {
  sourceItem: ActionType | ActionSubtype;
  mappingType: 'type-subtype' | 'subtype-result';
  connections: MappingConnection[];
}

export interface MappingTabProps {
  actionTypes: ActionType[];
  actionSubtypes: ActionSubtype[];
  actionResults: ActionResult[];
  loading: boolean;
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
}