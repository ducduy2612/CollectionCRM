import React from 'react';
import { Modal } from '../../../../../components/ui/Modal';
import { Button } from '../../../../../components/ui/Button';
import { TrashIcon } from '@heroicons/react/24/outline';
import { ViewingMappings } from './types';
import { ActionSubtype, ActionResult } from '../../../../customers/types';

interface ViewMappingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  viewingMappings: ViewingMappings | null;
  onRemoveMapping: (type: 'type-subtype' | 'subtype-result', sourceCode: string, targetCode: string) => void;
}

const ViewMappingsModal: React.FC<ViewMappingsModalProps> = ({
  isOpen,
  onClose,
  viewingMappings,
  onRemoveMapping
}) => {
  if (!viewingMappings) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`${viewingMappings.sourceItem.name} - ${viewingMappings.type === 'type-subtype' ? 'Mapped Subtypes' : 'Mapped Results'}`}
    >
      <div className="space-y-4">
        <div className="bg-neutral-50 p-3 rounded-lg">
          <div className="text-sm font-medium text-neutral-700">
            {viewingMappings.type === 'type-subtype' ? 'Action Type' : 'Action Subtype'}
          </div>
          <div className="text-lg font-semibold">{viewingMappings.sourceItem.name}</div>
          <div className="text-sm text-neutral-500">Code: {viewingMappings.sourceItem.code}</div>
        </div>

        <div>
          <div className="text-sm font-medium text-neutral-700 mb-3">
            {viewingMappings.type === 'type-subtype' ? 'Mapped Subtypes' : 'Mapped Results'} ({viewingMappings.mappedItems.length})
          </div>
          
          {viewingMappings.mappedItems.length > 0 ? (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {viewingMappings.mappedItems.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <div className="font-medium text-sm">{item.name}</div>
                    <div className="text-xs text-neutral-500">
                      Code: {viewingMappings.type === 'type-subtype'
                        ? (item as ActionSubtype).subtype_code 
                        : (item as ActionResult).result_code 
                      }
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onRemoveMapping(
                      viewingMappings.type,
                      viewingMappings.sourceItem.code,
                      viewingMappings.type === 'type-subtype'
                        ? (item as ActionSubtype).subtype_code!
                        : (item as ActionResult).result_code!
                    )}
                    className="text-red-600 hover:text-red-700"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-neutral-500">
              <div className="text-sm">No mappings found</div>
              <div className="text-xs mt-1">
                Use drag and drop to create relationships
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end pt-4">
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default ViewMappingsModal;