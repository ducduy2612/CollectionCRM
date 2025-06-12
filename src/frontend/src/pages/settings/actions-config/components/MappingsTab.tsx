import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../../../components/ui/Card';
import { Button } from '../../../../components/ui/Button';
import { Modal } from '../../../../components/ui/Modal';
import { Select } from '../../../../components/ui/Select';
import { 
  PlusIcon, 
  LinkIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
import { ActionType, ActionSubtype, ActionResult } from '../../../customers/types';
import { actionConfigApi } from '../../../../services/api/workflow/action-config.api';

interface MappingsTabProps {
  actionTypes: ActionType[];
  actionSubtypes: ActionSubtype[];
  actionResults: ActionResult[];
  loading: boolean;
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
}

interface MappingData {
  type: 'type-subtype' | 'subtype-result';
  sourceCode: string;
  targetCode: string;
}

const MappingsTab: React.FC<MappingsTabProps> = ({
  actionTypes,
  actionSubtypes,
  actionResults,
  loading,
  onSuccess,
  onError
}) => {
  const [showMappingModal, setShowMappingModal] = useState(false);
  const [showViewMappingsModal, setShowViewMappingsModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [mappingData, setMappingData] = useState<MappingData>({
    type: 'type-subtype',
    sourceCode: '',
    targetCode: ''
  });
  const [viewingMappings, setViewingMappings] = useState<{
    type: 'type-subtype' | 'subtype-result';
    sourceItem: ActionType | ActionSubtype;
    mappedItems: ActionSubtype[] | ActionResult[];
  } | null>(null);

  const resetMappingForm = () => {
    setMappingData({
      type: 'type-subtype',
      sourceCode: '',
      targetCode: ''
    });
  };

  const handleCreateMapping = async () => {
    if (!mappingData.sourceCode || !mappingData.targetCode) {
      onError('Please select both source and target items');
      return;
    }

    setSubmitting(true);
    
    try {
      if (mappingData.type === 'type-subtype') {
        await actionConfigApi.mapTypeToSubtype(mappingData.sourceCode, mappingData.targetCode);
      } else {
        await actionConfigApi.mapSubtypeToResult(mappingData.sourceCode, mappingData.targetCode);
      }
      
      onSuccess('Mapping created successfully');
      setShowMappingModal(false);
      resetMappingForm();
    } catch (error) {
      onError(error instanceof Error ? error.message : 'Failed to create mapping');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemoveMapping = async (type: 'type-subtype' | 'subtype-result', sourceCode: string, targetCode: string) => {
    if (!confirm('Are you sure you want to remove this mapping?')) {
      return;
    }

    try {
      if (type === 'type-subtype') {
        await actionConfigApi.removeTypeSubtypeMapping(sourceCode, targetCode);
      } else {
        await actionConfigApi.removeSubtypeResultMapping(sourceCode, targetCode);
      }
      
      onSuccess('Mapping removed successfully');
    } catch (error) {
      onError(error instanceof Error ? error.message : 'Failed to remove mapping');
    }
  };

  const handleCloseMappingModal = () => {
    setShowMappingModal(false);
    resetMappingForm();
  };

  const openMappingModal = (type: 'type-subtype' | 'subtype-result') => {
    setMappingData(prev => ({ ...prev, type, sourceCode: '', targetCode: '' }));
    setShowMappingModal(true);
  };

  const handleViewMappings = async (type: 'type-subtype' | 'subtype-result', sourceItem: ActionType | ActionSubtype) => {
    try {
      let mappedItems: ActionSubtype[] | ActionResult[] = [];
      
      if (type === 'type-subtype') {
        mappedItems = await actionConfigApi.getSubtypesForType(sourceItem.code);
      } else {
        mappedItems = await actionConfigApi.getResultsForSubtype(sourceItem.code);
      }
      
      setViewingMappings({
        type,
        sourceItem,
        mappedItems
      });
      setShowViewMappingsModal(true);
    } catch (error) {
      onError(error instanceof Error ? error.message : 'Failed to load mappings');
    }
  };

  const handleCloseViewMappingsModal = () => {
    setShowViewMappingsModal(false);
    setViewingMappings(null);
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-neutral-900">Configuration Mappings</h3>
        <p className="text-sm text-neutral-600">Manage relationships between types, subtypes, and results</p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Type-Subtype Mappings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <LinkIcon className="w-5 h-5" />
              <span>Type-Subtype Mappings</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => openMappingModal('type-subtype')}
              >
                <PlusIcon className="w-4 h-4 mr-2" />
                Add Mapping
              </Button>
              
              <div className="space-y-2">
                {actionTypes.filter(type => type.isActive).map(type => (
                  <div key={type.id} className="p-3 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-sm">{type.name}</div>
                        <div className="text-xs text-neutral-500">Code: {type.code}</div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewMappings('type-subtype', type)}
                        className="text-xs"
                      >
                        View Mappings
                      </Button>
                    </div>
                    <div className="text-xs text-neutral-400 mt-2">
                      Connected to mapped subtypes
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Subtype-Result Mappings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <LinkIcon className="w-5 h-5" />
              <span>Subtype-Result Mappings</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => openMappingModal('subtype-result')}
              >
                <PlusIcon className="w-4 h-4 mr-2" />
                Add Mapping
              </Button>
              
              <div className="space-y-2">
                {actionSubtypes.filter(subtype => subtype.isActive).map(subtype => (
                  <div key={subtype.id} className="p-3 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-sm">{subtype.name}</div>
                        <div className="text-xs text-neutral-500">Code: {subtype.code}</div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewMappings('subtype-result', subtype)}
                        className="text-xs"
                      >
                        View Mappings
                      </Button>
                    </div>
                    <div className="text-xs text-neutral-400 mt-2">
                      Connected to mapped results
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Mapping Modal */}
      <Modal
        isOpen={showMappingModal}
        onClose={handleCloseMappingModal}
        title={`Create ${mappingData.type === 'type-subtype' ? 'Type-Subtype' : 'Subtype-Result'} Mapping`}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              {mappingData.type === 'type-subtype' ? 'Action Type' : 'Action Subtype'}
            </label>
            <select
              className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              value={mappingData.sourceCode}
              onChange={(e) => setMappingData(prev => ({ ...prev, sourceCode: e.target.value }))}
            >
              <option value="">Select...</option>
              {(mappingData.type === 'type-subtype' ? actionTypes : actionSubtypes)
                .filter(item => item.isActive)
                .map(item => (
                  <option key={item.id} value={item.code}>
                    {item.name} ({item.code})
                  </option>
                ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              {mappingData.type === 'type-subtype' ? 'Action Subtype' : 'Action Result'}
            </label>
            <select
              className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              value={mappingData.targetCode}
              onChange={(e) => setMappingData(prev => ({ ...prev, targetCode: e.target.value }))}
            >
              <option value="">Select...</option>
              {(mappingData.type === 'type-subtype' ? actionSubtypes : actionResults)
                .filter(item => item.isActive)
                .map(item => (
                  <option key={item.id} value={item.code}>
                    {item.name} ({item.code})
                  </option>
                ))}
            </select>
          </div>
          
          <div className="flex justify-end space-x-3 pt-4">
            <Button
              variant="secondary"
              onClick={handleCloseMappingModal}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleCreateMapping}
              loading={submitting}
              disabled={!mappingData.sourceCode || !mappingData.targetCode}
            >
              Create Mapping
            </Button>
          </div>
        </div>
      </Modal>

      {/* View Mappings Modal */}
      <Modal
        isOpen={showViewMappingsModal}
        onClose={handleCloseViewMappingsModal}
        title={`${viewingMappings?.sourceItem.name} - ${viewingMappings?.type === 'type-subtype' ? 'Mapped Subtypes' : 'Mapped Results'}`}
      >
        <div className="space-y-4">
          {viewingMappings && (
            <>
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
                          onClick={() => handleRemoveMapping(
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
                      Use "Add Mapping" to create relationships
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end pt-4">
                <Button
                  variant="secondary"
                  onClick={handleCloseViewMappingsModal}
                >
                  Close
                </Button>
              </div>
            </>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default MappingsTab;