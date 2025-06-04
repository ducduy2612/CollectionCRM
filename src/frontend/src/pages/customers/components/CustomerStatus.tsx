import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Spinner } from '../../../components/ui/Spinner';
import { Alert } from '../../../components/ui/Alert';
import { workflowApi, StatusHistoryItem } from '../../../services/api/workflow.api';
import { StatusDictItem, StatusUpdateRequest } from '../types';
import StatusHistoryModal from './StatusHistoryModal';
import StatusUpdateModal from './StatusUpdateModal';

interface CustomerStatusProps {
  cif: string;
}

interface StatusDictionaries {
  customer: StatusDictItem[];
  collateral: StatusDictItem[];
  processingState: StatusDictItem[];
  lendingViolation: StatusDictItem[];
  recoveryAbility: StatusDictItem[];
}

interface CurrentStatuses {
  customer?: StatusHistoryItem;
  collateral?: StatusHistoryItem;
  processingState?: StatusHistoryItem;
  lendingViolation?: StatusHistoryItem;
  recoveryAbility?: StatusHistoryItem;
}

type StatusType = 'customer' | 'collateral' | 'processingState' | 'lendingViolation' | 'recoveryAbility';

interface ModalState {
  showHistory: boolean;
  showUpdate: boolean;
  statusType: StatusType | null;
}

const CustomerStatus: React.FC<CustomerStatusProps> = ({ cif }) => {
  // State management
  const [statusDictionaries, setStatusDictionaries] = useState<StatusDictionaries | null>(null);
  const [currentStatuses, setCurrentStatuses] = useState<CurrentStatuses>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalState, setModalState] = useState<ModalState>({ showHistory: false, showUpdate: false, statusType: null });
  const [statusHistory, setStatusHistory] = useState<StatusHistoryItem[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  // Load status dictionaries on component mount
  const loadStatusDictionaries = useCallback(async () => {
    try {
      console.log('Loading status dictionaries...');
      const [
        customerDict,
        collateralDict,
        processingStateDict,
        lendingViolationDict,
        recoveryAbilityDict
      ] = await Promise.all([
        workflowApi.getCustomerStatusDict(),
        workflowApi.getCollateralStatusDict(),
        workflowApi.getProcessingStateDict(),
        workflowApi.getLendingViolationStatusDict(),
        workflowApi.getRecoveryAbilityStatusDict()
      ]);

      console.log('Status dictionaries loaded successfully');
      setStatusDictionaries({
        customer: customerDict,
        collateral: collateralDict,
        processingState: processingStateDict,
        lendingViolation: lendingViolationDict,
        recoveryAbility: recoveryAbilityDict
      });
    } catch (err) {
      console.error('Error loading status dictionaries:', err);
      throw new Error(`Failed to load status dictionaries: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  }, []);

  // Load current status data for the customer
  const loadCurrentStatuses = useCallback(async () => {
    try {
      console.log(`Loading current statuses for CIF: ${cif}`);
      const [
        customerHistory,
        collateralHistory,
        processingStateHistory,
        lendingViolationHistory,
        recoveryAbilityHistory
      ] = await Promise.all([
        workflowApi.getCustomerStatusHistory(cif, { page: 1, pageSize: 1 }).catch(err => {
          console.warn('Customer status history not available:', err);
          return { items: [], pagination: { page: 1, pageSize: 1, totalPages: 0, totalItems: 0 } };
        }),
        workflowApi.getCollateralStatusHistory(cif, { page: 1, pageSize: 1 }).catch(err => {
          console.warn('Collateral status history not available:', err);
          return { items: [], pagination: { page: 1, pageSize: 1, totalPages: 0, totalItems: 0 } };
        }),
        workflowApi.getProcessingStateStatusHistory(cif, { page: 1, pageSize: 1 }).catch(err => {
          console.warn('Processing state status history not available:', err);
          return { items: [], pagination: { page: 1, pageSize: 1, totalPages: 0, totalItems: 0 } };
        }),
        workflowApi.getLendingViolationStatusHistory(cif, { page: 1, pageSize: 1 }).catch(err => {
          console.warn('Lending violation status history not available:', err);
          return { items: [], pagination: { page: 1, pageSize: 1, totalPages: 0, totalItems: 0 } };
        }),
        workflowApi.getRecoveryAbilityStatusHistory(cif, { page: 1, pageSize: 1 }).catch(err => {
          console.warn('Recovery ability status history not available:', err);
          return { items: [], pagination: { page: 1, pageSize: 1, totalPages: 0, totalItems: 0 } };
        })
      ]);

      console.log('Current statuses loaded successfully');
      setCurrentStatuses({
        customer: customerHistory.items?.[0] || undefined,
        collateral: collateralHistory.items?.[0] || undefined,
        processingState: processingStateHistory.items?.[0] || undefined,
        lendingViolation: lendingViolationHistory.items?.[0] || undefined,
        recoveryAbility: recoveryAbilityHistory.items?.[0] || undefined
      });
      console.log(currentStatuses.customer)
    } catch (err) {
      console.error('Error loading current statuses:', err);
      throw new Error(`Failed to load current status data: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  }, [cif]);

  // Initialize component data
  useEffect(() => {
    const initializeData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        await Promise.all([
          loadStatusDictionaries(),
          loadCurrentStatuses()
        ]);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    if (cif) {
      initializeData();
    }
  }, [cif, loadStatusDictionaries, loadCurrentStatuses]);

  // Get status display information
  const getStatusInfo = (statusType: keyof CurrentStatuses) => {
    const currentStatus = currentStatuses[statusType];
    if (!currentStatus || !statusDictionaries) {
      return { name: 'No Status', color: '#6B7280' };
    }

    // const dictKey = statusType === 'processingState' ? 'processingState' : statusType;
    // const dictionary = statusDictionaries[dictKey as keyof StatusDictionaries];
    // const statusItem = dictionary.find(item => item.id === currentStatus.status_id);
    // console.log(dictionary)
    // console.log(statusItem)
    return {
      name: currentStatus.status?.name || 'Unknown',
      color: currentStatus.status?.color || '#6B7280'
    };
  };

  // Handle status box click to show history
  const handleStatusClick = async (statusType: StatusType) => {
    setIsLoadingHistory(true);
    setModalState({ showHistory: true, showUpdate: false, statusType });

    try {
      let historyResponse;
      // Fetch records with a large page size to get more data for client-side pagination
      const paginationParams = { page: 1, pageSize: 200 };
      
      switch (statusType) {
        case 'customer':
          historyResponse = await workflowApi.getCustomerStatusHistory(cif, paginationParams);
          break;
        case 'collateral':
          historyResponse = await workflowApi.getCollateralStatusHistory(cif, paginationParams);
          break;
        case 'processingState':
          historyResponse = await workflowApi.getProcessingStateStatusHistory(cif, paginationParams);
          break;
        case 'lendingViolation':
          historyResponse = await workflowApi.getLendingViolationStatusHistory(cif, paginationParams);
          break;
        case 'recoveryAbility':
          historyResponse = await workflowApi.getRecoveryAbilityStatusHistory(cif, paginationParams);
          break;
      }
      setStatusHistory(historyResponse.items || []);
    } catch (err) {
      console.error('Error loading status history:', err);
      setStatusHistory([]);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  // Handle update button click
  const handleUpdateClick = () => {
    setModalState({ showHistory: false, showUpdate: true, statusType: 'customer' }); // Default to customer status
  };

  // Handle status box click for update
  const handleStatusUpdateClick = (statusType: StatusType) => {
    setModalState({ showHistory: false, showUpdate: true, statusType });
  };

  // Handle update status from history modal
  const handleUpdateStatusFromHistory = (statusType: StatusType) => {
    setModalState({ showHistory: true, showUpdate: true, statusType });
  };

  // Handle status update submission
  const handleStatusUpdate = async (data: StatusUpdateRequest) => {
    try {
      switch (data.statusType) {
        case 'customer':
          await workflowApi.recordCustomerStatus({
            cif: data.cif,
            statusId: data.statusId,
            actionDate: data.actionDate,
            notes: data.notes
          });
          break;
        case 'collateral':
          await workflowApi.recordCollateralStatus({
            cif: data.cif,
            statusId: data.statusId,
            actionDate: data.actionDate,
            notes: data.notes
          });
          break;
        case 'processingState':
          await workflowApi.recordProcessingStateStatus({
            cif: data.cif,
            statusId: data.statusId,
            actionDate: data.actionDate,
            notes: data.notes
          });
          break;
        case 'lendingViolation':
          await workflowApi.recordLendingViolationStatus({
            cif: data.cif,
            statusId: data.statusId,
            actionDate: data.actionDate,
            notes: data.notes
          });
          break;
        case 'recoveryAbility':
          await workflowApi.recordRecoveryAbilityStatus({
            cif: data.cif,
            statusId: data.statusId,
            actionDate: data.actionDate,
            notes: data.notes
          });
          break;
      }

      // Refresh current statuses after successful update
      await loadCurrentStatuses();
      
      // Close the update modal
      closeUpdateModal();
      
      // If history modal is open, refresh the history data
      if (modalState.showHistory && modalState.statusType) {
        await handleStatusClick(modalState.statusType);
      }
    } catch (err) {
      console.error('Error updating status:', err);
      throw err;
    }
  };

  // Close modals
  const closeModal = () => {
    setModalState({ showHistory: false, showUpdate: false, statusType: null });
    setStatusHistory([]);
  };

  // Close only the update modal, keep history modal open
  const closeUpdateModal = () => {
    setModalState(prev => ({ ...prev, showUpdate: false }));
  };

  // Close only the history modal
  const closeHistoryModal = () => {
    setModalState(prev => ({ ...prev, showHistory: false }));
    setStatusHistory([]);
  };

  // Create status dictionary for modal
  const getStatusDictForModal = (): Record<string, StatusDictItem> => {
    if (!statusDictionaries || !modalState.statusType) return {};

    const dictKey = modalState.statusType;
    const dictionary = statusDictionaries[dictKey as keyof StatusDictionaries];
    
    if (!dictionary || !Array.isArray(dictionary)) return {};
    
    return dictionary.reduce((acc, item) => {
      acc[item.id] = item;
      return acc;
    }, {} as Record<string, StatusDictItem>);
  };

  // Get status options for update modal
  const getStatusOptionsForUpdate: () => StatusDictItem[] = useCallback(() => {
    if (!statusDictionaries || !modalState.statusType) return [];
    const dictKey = modalState.statusType
    const dictionary = statusDictionaries[dictKey as keyof StatusDictionaries];
    if (!dictionary || !Array.isArray(dictionary)) return [];
    return dictionary;
  }, [statusDictionaries, modalState.statusType]);

  if (isLoading) {
    return (
      <Card className="col-span-2">
        <CardHeader>
          <CardTitle>Customer Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Spinner size="md" />
            <span className="ml-2 text-neutral-600">Loading status data...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="col-span-2">
        <CardHeader>
          <CardTitle>Customer Status</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="danger" title="Error Loading Status Data">
            {error}
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="col-span-2">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Customer Status</CardTitle>
          <Button variant="secondary" size="sm" onClick={handleUpdateClick}>
            <i className="bi bi-pencil mr-2"></i>
            Update
          </Button>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-5 gap-4">
            {/* Customer Status */}
            <div 
              className="bg-neutral-50 rounded-md p-4 text-center border border-neutral-200 cursor-pointer hover:bg-neutral-100 transition-colors"
              onClick={() => handleStatusClick('customer')}
            >
              <div className="text-xs text-neutral-600 mb-2 font-medium">Customer Status</div>
              <div 
                className="font-bold text-sm"
                style={{ color: getStatusInfo('customer').color }}
              >
                {getStatusInfo('customer').name}
              </div>
            </div>
            
            {/* Collateral Status */}
            <div 
              className="bg-neutral-50 rounded-md p-4 text-center border border-neutral-200 cursor-pointer hover:bg-neutral-100 transition-colors"
              onClick={() => handleStatusClick('collateral')}
            >
              <div className="text-xs text-neutral-600 mb-2 font-medium">Collateral Status</div>
              <div 
                className="font-bold text-sm"
                style={{ color: getStatusInfo('collateral').color }}
              >
                {getStatusInfo('collateral').name}
              </div>
            </div>
            
            {/* Processing State */}
            <div 
              className="bg-neutral-50 rounded-md p-4 text-center border border-neutral-200 cursor-pointer hover:bg-neutral-100 transition-colors"
              onClick={() => handleStatusClick('processingState')}
            >
              <div className="text-xs text-neutral-600 mb-2 font-medium">Processing State</div>
              <div 
                className="font-bold text-sm"
                style={{ color: getStatusInfo('processingState').color }}
              >
                {getStatusInfo('processingState').name}
              </div>
            </div>
            
            {/* Lending Violation */}
            <div 
              className="bg-neutral-50 rounded-md p-4 text-center border border-neutral-200 cursor-pointer hover:bg-neutral-100 transition-colors"
              onClick={() => handleStatusClick('lendingViolation')}
            >
              <div className="text-xs text-neutral-600 mb-2 font-medium">Lending Violation</div>
              <div 
                className="font-bold text-sm"
                style={{ color: getStatusInfo('lendingViolation').color }}
              >
                {getStatusInfo('lendingViolation').name}
              </div>
            </div>
            
            {/* Recovery Ability */}
            <div 
              className="bg-neutral-50 rounded-md p-4 text-center border border-neutral-200 cursor-pointer hover:bg-neutral-100 transition-colors"
              onClick={() => handleStatusClick('recoveryAbility')}
            >
              <div className="text-xs text-neutral-600 mb-2 font-medium">Recovery Ability</div>
              <div 
                className="font-bold text-sm"
                style={{ color: getStatusInfo('recoveryAbility').color }}
              >
                {getStatusInfo('recoveryAbility').name}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Status History Modal */}
      {modalState.showHistory && modalState.statusType && (
        <StatusHistoryModal
          isOpen={true}
          onClose={closeHistoryModal}
          statusType={modalState.statusType}
          statusHistory={isLoadingHistory ? [] : statusHistory as any}
          statusDict={getStatusDictForModal()}
          onUpdateStatus={handleUpdateStatusFromHistory}
        />
      )}

      {/* Status Update Modal */}
      {modalState.showUpdate && modalState.statusType && (
        <StatusUpdateModal
          isOpen={true}
          onClose={closeUpdateModal}
          statusType={modalState.statusType}
          statusOptions={getStatusOptionsForUpdate()}
          cif={cif}
          onSubmit={handleStatusUpdate}
        />
      )}
    </>
  );
};

export default CustomerStatus;