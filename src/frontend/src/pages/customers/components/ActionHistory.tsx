import React, { useState, useEffect } from 'react';
import { CustomerAction } from '../types';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { Spinner } from '../../../components/ui/Spinner';
import ActionSearchModal, { ActionSearchFilters } from './ActionSearchModal';
import { workflowApi } from '../../../services/api/workflow.api';

interface ActionHistoryProps {
  cif?: string;
  limit?: number;
  onActionRefresh?: () => void; // Callback to notify parent when actions are refreshed
  onLastContactDateChange?: (date: string | undefined) => void; // Callback to pass last contact date to parent
}

const ActionHistory: React.FC<ActionHistoryProps> = ({
  cif,
  limit = 10,
  onActionRefresh,
  onLastContactDateChange
}) => {
  // Internal state for actions and pagination
  const [actions, setActions] = useState<CustomerAction[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 10,
    totalPages: 1,
    totalItems: 0
  });
  const [currentFilters, setCurrentFilters] = useState<ActionSearchFilters>({});
  const [loading, setLoading] = useState<boolean>(false);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState<boolean>(false);
  const [initialLoad, setInitialLoad] = useState<boolean>(true);

  // Load actions when component mounts or CIF changes
  useEffect(() => {
    if (cif) {
      loadActions(1, {});
    }
  }, [cif]);

  const loadActions = async (page: number, filters: ActionSearchFilters) => {
    if (!cif) return;

    setLoading(true);
    try {
      const actionsData = await workflowApi.getCustomerActions(cif, {
        page,
        pageSize: limit,
        ...filters
      });
      
      setActions(actionsData.actions);
      setPagination(actionsData.pagination);
      setCurrentFilters(filters);
      
      // Update last contact date from the most recent action (only on first page with no filters)
      if (page === 1 && Object.keys(filters).length === 0 && onLastContactDateChange) {
        if (actionsData.actions && actionsData.actions.length > 0) {
          const sortedActions = [...actionsData.actions].sort(
            (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
          onLastContactDateChange(sortedActions[0].createdAt);
        } else {
          onLastContactDateChange(undefined);
        }
      }
      
      // Notify parent component if this is a refresh
      if (!initialLoad && onActionRefresh) {
        onActionRefresh();
      }
      
      if (initialLoad) {
        setInitialLoad(false);
      }
    } catch (error) {
      console.error('Error loading actions:', error);
    } finally {
      setLoading(false);
    }
  };

  // Expose refresh method for external use
  const refreshActions = () => {
    if (cif) {
      loadActions(pagination.page, currentFilters);
    }
  };

  // Expose this method to parent component
  useEffect(() => {
    if (cif && window) {
      // Store refresh function globally so parent can call it
      (window as any).refreshActionHistory = refreshActions;
    }
    
    return () => {
      if (window) {
        delete (window as any).refreshActionHistory;
      }
    };
  }, [cif, pagination.page, currentFilters]);

  // Helper function to get action type icon
  const getActionTypeIcon = (type: string) => {
    switch (type) {
      case 'CALL': return 'bi-telephone';
      case 'SMS': return 'bi-chat';
      case 'EMAIL': return 'bi-envelope';
      case 'VISIT': return 'bi-geo-alt';
      case 'PAYMENT': return 'bi-cash-coin';
      case 'NOTE': return 'bi-journal-text';
      default: return 'bi-info-circle';
    }
  };

  // Helper function to get badge variant for action type
  const getActionBadgeVariant = (type: string): 'primary' | 'secondary' | 'info' | 'warning' | 'success' | 'danger' | 'neutral' => {
    switch (type) {
      case 'CALL': return 'primary';
      case 'SMS': return 'secondary';
      case 'EMAIL': return 'info';
      case 'VISIT': return 'warning';
      case 'PAYMENT': return 'success';
      case 'NOTE': return 'neutral';
      default: return 'neutral';
    }
  };

  // Helper function to get badge variant for result
  const getResultBadgeVariant = (result: string | undefined): 'primary' | 'secondary' | 'info' | 'warning' | 'success' | 'danger' | 'neutral' => {
    if (!result) {
      return 'neutral';
    }
    if (result.includes('SUCCESS') || result.includes('PROMISE') || result.includes('COMPLETED')) {
      return 'success';
    }
    if (result.includes('FAIL') || result.includes('NO ANSWER') || result.includes('REJECTED')) {
      return 'danger';
    }
    return 'secondary';
  };

  // Helper function to format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      hour12: true
    });
  };

  // Helper function to format currency
  const formatCurrency = (amount: number | string) => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      maximumFractionDigits: 0
    }).format(numAmount || 0);
  };

  // Helper function to get DPD badge variant
  const getDpdBadgeVariant = (dpd: number): 'primary' | 'secondary' | 'info' | 'warning' | 'success' | 'danger' | 'neutral' => {
    if (dpd === 0) return 'success';
    if (dpd <= 30) return 'warning';
    return 'danger';
  };

  const handlePageChange = async (newPage: number) => {
    await loadActions(newPage, currentFilters);
  };

  const handleSearch = async (filters: ActionSearchFilters) => {
    await loadActions(1, filters); // Reset to first page with new filters
  };

  const handleClearFilters = async () => {
    await loadActions(1, {}); // Clear all filters
  };

  // Check if there are active filters
  const hasActiveFilters = Object.values(currentFilters).some(value => value && value.trim() !== '');

  // Generate page numbers for pagination
  const generatePageNumbers = () => {
    const totalPages = pagination.totalPages || 1;
    const currentPage = pagination.page || 1;
    const pages = [];
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      const startPage = Math.max(1, currentPage - 2);
      const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
      
      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }
    }
    
    return pages;
  };

  const totalPages = pagination.totalPages || 1;
  const totalItems = pagination.totalItems || 0;
  const currentPage = pagination.page || 1;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Action History</CardTitle>
        <div className="flex items-center space-x-2">
          {hasActiveFilters && (
            <div className="flex items-center space-x-2">
              <span className="text-sm text-neutral-600">
                {Object.keys(currentFilters).length} filter{Object.keys(currentFilters).length !== 1 ? 's' : ''} active
              </span>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleClearFilters}
                disabled={loading}
              >
                <i className="bi bi-x-circle mr-1"></i>
                Clear
              </Button>
            </div>
          )}
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsSearchModalOpen(true)}
            disabled={loading}
          >
            <i className="bi bi-search mr-1"></i>
            Search
          </Button>
        </div>
      </CardHeader>
      
      <CardContent>
        {(loading || initialLoad) && (
          <div className="flex justify-center py-8">
            <Spinner size="md" />
          </div>
        )}
        
        {!loading && !initialLoad && actions.length === 0 && (
          <div className="text-center py-8 text-neutral-500">
            {hasActiveFilters ? 'No actions match the current filters' : 'No actions found'}
          </div>
        )}
        
        {!loading && !initialLoad && actions.length > 0 && (
          <div className="space-y-4">
            <div className="max-h-96 overflow-y-auto space-y-4 pr-2">
              {actions.map((action, index) => (
                <div key={action.id || index} className="p-3 border-l-4 border-primary-500 bg-neutral-50 rounded-r-md">
                  <div className="flex justify-between mb-2">
                    <div className="font-semibold flex items-center">
                      <i className={`bi ${getActionTypeIcon(action.actionType?.code || '')} mr-2 text-primary-600`}></i>
                      <Badge variant={getActionBadgeVariant(action.actionType?.code || '')}>
                        {action.actionType?.name || action.actionType?.code || 'Unknown'}
                      </Badge>
                      {action.actionSubtype && (
                        <span className="ml-2 text-sm text-neutral-600">
                          {action.actionSubtype.name || action.actionSubtype.code}
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-neutral-500">
                      {formatDate(action.actionDate || action.createdAt)}
                    </div>
                  </div>
                  
                  {/* Additional Information Section */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3 text-sm bg-white p-3 rounded border">
                    <div className="space-y-2">
                      {action.loanAccountNumber && (
                        <div className="flex items-center">
                          <i className="bi bi-credit-card mr-2 text-neutral-500"></i>
                          <span className="text-neutral-600 font-medium">Loan Account:</span>
                          <span className="ml-2 font-semibold text-primary-700">{action.loanAccountNumber}</span>
                        </div>
                      )}
                      {action.agent?.name && (
                        <div className="flex items-center">
                          <i className="bi bi-person mr-2 text-neutral-500"></i>
                          <span className="text-neutral-600 font-medium">Agent:</span>
                          <span className="ml-2 font-semibold">{action.agent.name}</span>
                        </div>
                      )}
                      {action.fUpdate && (
                        <div className="flex items-center">
                          <i className="bi bi-calendar-event mr-2 text-neutral-500"></i>
                          <span className="text-neutral-600 font-medium">Follow-up:</span>
                          <span className="ml-2 font-semibold text-info-700">
                            {formatDate(action.fUpdate)}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="space-y-2">
                      {action.dueAmount !== undefined && action.dueAmount !== null && (
                        <div className="flex items-center">
                          <i className="bi bi-currency-dollar mr-2 text-neutral-500"></i>
                          <span className="text-neutral-600 font-medium">Due Amount:</span>
                          <span className="ml-2 font-semibold text-danger-600">
                            {formatCurrency(action.dueAmount)}
                          </span>
                        </div>
                      )}
                      {action.dpd !== undefined && action.dpd !== null && (
                        <div className="flex items-center">
                          <i className="bi bi-clock mr-2 text-neutral-500"></i>
                          <span className="text-neutral-600 font-medium">DPD:</span>
                          <Badge variant={getDpdBadgeVariant(action.dpd)} className="ml-2">
                            {action.dpd} days
                          </Badge>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <p className="text-neutral-700 mb-2">{action.notes || 'No notes provided'}</p>
                    {action.actionResult && (
                      <Badge variant={getResultBadgeVariant(action.actionResult.code)}>
                        {action.actionResult.name || action.actionResult.code}
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
            
            {totalPages > 1 && (
              <div className="flex flex-col items-center space-y-2 pt-4 border-t">
                <div className="text-sm text-neutral-600">
                  Showing {actions.length} actions on this page
                  {totalItems > 0 && ` (${totalItems} total)`}
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1 || loading}
                  >
                    <i className="bi bi-chevron-left mr-1"></i>
                    Previous
                  </Button>
                  
                  {generatePageNumbers().map((pageNum) => (
                    <Button
                      key={pageNum}
                      variant={pageNum === currentPage ? "primary" : "secondary"}
                      size="sm"
                      onClick={() => handlePageChange(pageNum)}
                      disabled={loading}
                      className="min-w-[2rem]"
                    >
                      {pageNum}
                    </Button>
                  ))}
                  
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages || loading}
                  >
                    Next
                    <i className="bi bi-chevron-right ml-1"></i>
                  </Button>
                </div>
                <div className="text-xs text-neutral-500">
                  Page {currentPage} of {totalPages}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
      
      {/* Search Modal */}
      <ActionSearchModal
        isOpen={isSearchModalOpen}
        onClose={() => setIsSearchModalOpen(false)}
        onSearch={handleSearch}
        currentFilters={currentFilters}
      />
    </Card>
  );
};

export default React.memo(ActionHistory, (prevProps, nextProps) => {
  // Only re-render if cif or callback functions change
  return (
    prevProps.cif === nextProps.cif &&
    prevProps.limit === nextProps.limit &&
    prevProps.onActionRefresh === nextProps.onActionRefresh &&
    prevProps.onLastContactDateChange === nextProps.onLastContactDateChange
  );
});
