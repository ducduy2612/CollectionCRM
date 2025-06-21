import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../../../../components/ui/Card';
import { Button } from '../../../../../components/ui/Button';
import { useToast } from '../../../../../components/ui/ToastProvider';
import { LinkIcon, ArrowRightIcon, CheckIcon, XMarkIcon, TrashIcon } from '@heroicons/react/24/outline';
import { ProcessingStateDictItem, ProcessingSubstateDictItem } from '../../../../customers/types';
import { statusDictApi } from '../../../../../services/api/workflow/status-dict.api';

interface MappingConnection {
  sourceCode: string;
  targetCode: string;
  isExisting: boolean;
  isDeleted: boolean;
}

interface SelectedSourceMapping {
  sourceItem: ProcessingStateDictItem;
  connections: MappingConnection[];
}

interface ProcessingStateMappingInterfaceProps {
  sourceItems: ProcessingStateDictItem[];
  targetItems: ProcessingSubstateDictItem[];
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
  title: string;
}

const OneToManyMappingInterface: React.FC<ProcessingStateMappingInterfaceProps> = ({
  sourceItems,
  targetItems,
  onSuccess,
  onError,
  title
}) => {
  const { showToast } = useToast();
  const [selectedSource, setSelectedSource] = useState<SelectedSourceMapping | null>(null);
  const [originalConnections, setOriginalConnections] = useState<MappingConnection[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleSourceClick = async (sourceItem: ProcessingStateDictItem) => {
    setIsLoading(true);
    try {
      // Get substates that are already mapped to this processing state
      const mappedSubstates = await statusDictApi.getProcessingSubstates(false, sourceItem.code);

      const connections: MappingConnection[] = targetItems.map(targetItem => {
        // Check if this substate is in the mapped list
        // The API returns substate_code field from the SQL function
        const isExisting = mappedSubstates.some(mapped => 
          mapped.substate_code === targetItem.code
        );

        return {
          sourceCode: sourceItem.code,
          targetCode: targetItem.code,
          isExisting,
          isDeleted: false
        };
      });

      setSelectedSource({
        sourceItem,
        connections
      });
      
      // Store original state for comparison
      setOriginalConnections(connections.map(conn => ({ ...conn })));
    } catch (error) {
      onError('Failed to load existing mappings');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleConnection = (targetCode: string) => {
    if (!selectedSource) return;

    setSelectedSource(prev => {
      if (!prev) return null;
      
      return {
        ...prev,
        connections: prev.connections.map(conn => {
          if (conn.targetCode === targetCode) {
            if (conn.isExisting && !conn.isDeleted) {
              // If it's an existing mapping, mark for deletion
              return { ...conn, isDeleted: true };
            } else if (conn.isExisting && conn.isDeleted) {
              // If it's marked for deletion, unmark it
              return { ...conn, isDeleted: false };
            } else {
              // If it's not existing, toggle to create new mapping
              return { ...conn, isExisting: true };
            }
          }
          return conn;
        })
      };
    });
  };

  const handleConfirm = async () => {
    if (!selectedSource) return;

    setIsSaving(true);
    let successCount = 0;
    let errorCount = 0;

    try {
      for (const connection of selectedSource.connections) {
        const originalConnection = originalConnections.find(c => c.targetCode === connection.targetCode);
        
        if (!originalConnection) continue;

        try {
          // Check if connection was deleted (was existing, now marked as deleted)
          if (originalConnection.isExisting && connection.isDeleted) {
            // Remove existing mapping
            await statusDictApi.removeStateSubstateMapping(connection.sourceCode, connection.targetCode);
            successCount++;
          }
          // Check if connection was added (was not existing, now is existing and not deleted)
          else if (!originalConnection.isExisting && connection.isExisting && !connection.isDeleted) {
            // Create new mapping
            await statusDictApi.mapStateToSubstate(connection.sourceCode, connection.targetCode);
            successCount++;
          }
        } catch (error) {
          console.error(`Failed to process mapping ${connection.sourceCode} -> ${connection.targetCode}:`, error);
          errorCount++;
        }
      }

      if (successCount > 0) {
        onSuccess(`Successfully updated ${successCount} mapping(s)`);
        showToast(`✅ Successfully updated ${successCount} mapping(s)!`, 'success');
      }
      if (errorCount > 0) {
        onError(`Failed to update ${errorCount} mapping(s)`);
        showToast(`❌ Failed to update ${errorCount} mapping(s)`, 'error');
      }
      if (successCount === 0 && errorCount === 0) {
        showToast('ℹ️ No changes to save', 'success');
      }

      // Refresh the current selection
      await handleSourceClick(selectedSource.sourceItem);
    } catch (error) {
      onError('Failed to save mappings');
      showToast('❌ Failed to save mappings', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const getTargetItemByCode = (code: string) => {
    return targetItems.find(item => item.code === code);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <LinkIcon className="w-5 h-5" />
          <span>{title}</span>
          {selectedSource && (
            <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
              {selectedSource.sourceItem.name} selected
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Source Items (Left) */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-neutral-700">
              Processing States
            </h4>
            <div className="space-y-2">
              {sourceItems.filter(item => item.is_active).map(item => (
                <div
                  key={item.id}
                  onClick={() => handleSourceClick(item)}
                  className={`
                    p-3 border rounded-lg cursor-pointer transition-all duration-200
                    ${selectedSource?.sourceItem.id === item.id
                      ? 'border-blue-500 bg-blue-50 shadow-md'
                      : 'border-neutral-200 hover:border-blue-300 hover:bg-blue-25'
                    }
                  `}
                >
                  <div className="font-medium text-sm">{item.name}</div>
                  <div className="text-xs text-neutral-500">Code: {item.code}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Arrows and Connections (Center) */}
          <div className="flex flex-col items-center justify-center space-y-4">
            {selectedSource ? (
              <>
                <div className="text-sm font-medium text-neutral-700 text-center">
                  Mappings for<br />
                  <span className="text-blue-600">{selectedSource.sourceItem.name}</span>
                </div>
                
                {/* Show connection arrows */}
                <div className="space-y-2 max-h-64 overflow-y-auto w-full">
                  {selectedSource.connections
                    .filter(conn => conn.isExisting && !conn.isDeleted)
                    .map(conn => {
                      const targetItem = getTargetItemByCode(conn.targetCode);
                      if (!targetItem) return null;
                      
                      return (
                        <div key={conn.targetCode} className="flex items-center space-x-2 bg-green-50 p-2 rounded border border-green-200">
                          <ArrowRightIcon className="w-4 h-4 text-green-600" />
                          <div className="text-xs text-green-700 font-medium flex-1">
                            {targetItem.name}
                          </div>
                          <button
                            onClick={() => toggleConnection(conn.targetCode)}
                            className="text-red-500 hover:text-red-700 text-xs"
                          >
                            <TrashIcon className="w-3 h-3" />
                          </button>
                        </div>
                      );
                    })}
                </div>

                {/* Confirm Button */}
                <Button
                  variant="primary"
                  onClick={handleConfirm}
                  loading={isSaving || isLoading}
                  size="sm"
                  className="w-full"
                >
                  <CheckIcon className="w-4 h-4 mr-2" />
                  Confirm Changes
                </Button>
              </>
            ) : (
              <div className="text-center text-neutral-500">
                <ArrowRightIcon className="w-8 h-8 mx-auto mb-2 text-neutral-300" />
                <div className="text-sm">Click a state on the left to view its mappings</div>
              </div>
            )}
          </div>

          {/* Target Items (Right) */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-neutral-700">
              Processing Substates
            </h4>
            <div className="space-y-2">
              {targetItems.filter(item => item.is_active).map(item => {
                const connection = selectedSource?.connections.find(conn => conn.targetCode === item.code);
                const isConnected = connection && connection.isExisting && !connection.isDeleted;
                const isDeleted = connection?.isDeleted;

                return (
                  <div
                    key={item.id}
                    onClick={() => selectedSource && toggleConnection(item.code)}
                    className={`
                      p-3 border rounded-lg transition-all duration-200
                      ${selectedSource ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'}
                      ${isConnected
                        ? 'border-green-500 bg-green-50'
                        : isDeleted
                        ? 'border-red-300 bg-red-50 opacity-60'
                        : selectedSource
                        ? 'border-neutral-200 hover:border-green-300 hover:bg-green-25'
                        : 'border-neutral-200'
                      }
                    `}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-sm">{item.name}</div>
                        <div className="text-xs text-neutral-500">Code: {item.code}</div>
                      </div>
                      {isConnected && (
                        <CheckIcon className="w-4 h-4 text-green-600" />
                      )}
                      {isDeleted && (
                        <XMarkIcon className="w-4 h-4 text-red-600" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
          <div className="text-sm text-blue-800">
            <strong>How to use:</strong> Click a processing state on the left to view its current substates. Click substates on the right to add/remove connections. Use "Confirm Changes" to save.
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default OneToManyMappingInterface;