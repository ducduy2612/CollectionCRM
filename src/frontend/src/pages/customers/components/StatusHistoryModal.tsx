import React, { useState, useMemo } from 'react';
import { Modal, ModalFooter } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../../components/ui/Table';
import { Badge } from '../../../components/ui/Badge';
import {
  BaseStatusHistoryItem,
  CustomerStatusHistoryItem,
  CollateralStatusHistoryItem,
  ProcessingStateStatusHistoryItem,
  LendingViolationStatusHistoryItem,
  RecoveryAbilityStatusHistoryItem,
  StatusDictItem
} from '../types';

type StatusHistoryItem = 
  | CustomerStatusHistoryItem 
  | CollateralStatusHistoryItem 
  | ProcessingStateStatusHistoryItem 
  | LendingViolationStatusHistoryItem 
  | RecoveryAbilityStatusHistoryItem;

interface StatusHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  statusType: 'customer' | 'collateral' | 'processing_state' | 'lending_violation' | 'recovery_ability';
  statusHistory: StatusHistoryItem[];
  statusDict: Record<string, StatusDictItem>;
  onUpdateStatus?: (statusType: 'customer' | 'collateral' | 'processing_state' | 'lending_violation' | 'recovery_ability') => void;
}

const StatusHistoryModal: React.FC<StatusHistoryModalProps> = ({
  isOpen,
  onClose,
  statusType,
  statusHistory,
  statusDict,
  onUpdateStatus
}) => {
  const [sortField, setSortField] = useState<'actionDate' | 'status'>('actionDate');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Get status type display name
  const getStatusTypeDisplayName = (type: string) => {
    switch (type) {
      case 'customer': return 'Customer Status';
      case 'collateral': return 'Collateral Status';
      case 'processing_state': return 'Processing State';
      case 'lending_violation': return 'Lending Violation';
      case 'recovery_ability': return 'Recovery Ability';
      default: return 'Status';
    }
  };

  // Get status name from dictionary
  const getStatusName = (item: StatusHistoryItem): string => {
    if ('statusId' in item) {
      return statusDict[item.statusId]?.name || 'Unknown Status';
    }
    if ('stateId' in item) {
      const stateName = statusDict[item.stateId]?.name || 'Unknown State';
      if (item.substateId && statusDict[item.substateId]) {
        return `${stateName} - ${statusDict[item.substateId].name}`;
      }
      return stateName;
    }
    return 'Unknown Status';
  };

  // Get status color
  const getStatusColor = (item: StatusHistoryItem): string => {
    if ('statusId' in item) {
      return statusDict[item.statusId]?.color || '#6B7280';
    }
    if ('stateId' in item) {
      return statusDict[item.stateId]?.color || '#6B7280';
    }
    return '#6B7280';
  };

  // Sort and paginate data
  const sortedAndPaginatedHistory = useMemo(() => {
    const sorted = [...statusHistory].sort((a, b) => {
      let aValue: string;
      let bValue: string;

      if (sortField === 'actionDate') {
        aValue = a.actionDate;
        bValue = b.actionDate;
      } else {
        aValue = getStatusName(a);
        bValue = getStatusName(b);
      }

      const comparison = aValue.localeCompare(bValue);
      return sortDirection === 'asc' ? comparison : -comparison;
    });

    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return sorted.slice(startIndex, endIndex);
  }, [statusHistory, sortField, sortDirection, currentPage]);

  // Handle sort
  const handleSort = (field: 'actionDate' | 'status') => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
    setCurrentPage(1);
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Calculate pagination
  const totalPages = Math.ceil(statusHistory.length / itemsPerPage);
  const hasNextPage = currentPage < totalPages;
  const hasPrevPage = currentPage > 1;

  // Sort icon component
  const SortIcon: React.FC<{ field: 'actionDate' | 'status' }> = ({ field }) => {
    if (sortField !== field) {
      return (
        <svg className="w-4 h-4 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
        </svg>
      );
    }
    
    return sortDirection === 'asc' ? (
      <svg className="w-4 h-4 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
      </svg>
    ) : (
      <svg className="w-4 h-4 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    );
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`${getStatusTypeDisplayName(statusType)} History`}
      description={`View the complete history of ${getStatusTypeDisplayName(statusType).toLowerCase()} changes`}
      size="xl"
    >
      <div className="space-y-4">
        {statusHistory.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-neutral-400 mb-2">
              <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p className="text-neutral-600">No status history available</p>
          </div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead 
                    className="cursor-pointer hover:bg-neutral-100 select-none"
                    onClick={() => handleSort('actionDate')}
                  >
                    <div className="flex items-center gap-2">
                      Date
                      <SortIcon field="actionDate" />
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-neutral-100 select-none"
                    onClick={() => handleSort('status')}
                  >
                    <div className="flex items-center gap-2">
                      Status
                      <SortIcon field="status" />
                    </div>
                  </TableHead>
                  <TableHead>Agent</TableHead>
                  <TableHead>Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedAndPaginatedHistory.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div className="text-sm">
                        {formatDate(item.actionDate)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant="secondary"
                        style={{ backgroundColor: `${getStatusColor(item)}20`, color: getStatusColor(item) }}
                      >
                        {getStatusName(item)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {item.agent?.name || 'Unknown Agent'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-neutral-600 max-w-xs truncate" title={item.notes || ''}>
                        {item.notes || '-'}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-4 border-t border-neutral-200">
                <div className="text-sm text-neutral-600">
                  Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, statusHistory.length)} of {statusHistory.length} entries
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setCurrentPage(currentPage - 1)}
                    disabled={!hasPrevPage}
                  >
                    Previous
                  </Button>
                  <span className="text-sm text-neutral-600">
                    Page {currentPage} of {totalPages}
                  </span>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={!hasNextPage}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <ModalFooter>
        <Button variant="secondary" onClick={onClose}>
          Close
        </Button>
        {onUpdateStatus && (
          <Button
            variant="primary"
            onClick={() => onUpdateStatus(statusType)}
          >
            <i className="bi bi-plus-circle mr-2"></i>
            Update Status
          </Button>
        )}
      </ModalFooter>
    </Modal>
  );
};

export default StatusHistoryModal;