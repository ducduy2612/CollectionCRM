import React, { useState, useEffect, useMemo } from 'react';
import { CustomerAction } from '../types';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { Spinner } from '../../../components/ui/Spinner';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../../components/ui/Table';
import ActionSearchModal, { ActionSearchFilters } from './ActionSearchModal';
import { workflowApi } from '../../../services/api/workflow.api';
import { useTranslation, useLocalization } from '../../../i18n/hooks/useTranslation';

interface ActionHistoryProps {
  cif?: string;
  limit?: number;
  onActionRefresh?: () => void; // Callback to notify parent when actions are refreshed
  onLastContactDateChange?: (date: string | undefined) => void; // Callback to pass last contact date to parent
}

type SortField = 'actionType' | 'actionDate' | 'loanAccountNumber' | 'agent' | 'dueAmount' | 'dpd' | 'fUpdate' | 'actionResult';
type SortDirection = 'asc' | 'desc';

const ActionHistory: React.FC<ActionHistoryProps> = ({
  cif,
  limit = 10,
  onActionRefresh,
  onLastContactDateChange
}) => {
  const { t } = useTranslation(['customers', 'tables', 'common']);
  const { formatDate: formatLocalizedDate, formatCurrency: formatLocalizedCurrency } = useLocalization();
  // Internal state for actions and pagination
  const [actions, setActions] = useState<CustomerAction[]>([]);
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
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

  // Helper function to format date with localization
  const formatDate = (dateString: string) => {
    return formatLocalizedDate(dateString, {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  // Helper function to format currency with localization
  const formatCurrency = (amount: number | string) => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    return formatLocalizedCurrency(numAmount || 0, 'VND');
  };

  // Helper function to get DPD badge variant
  const getDpdBadgeVariant = (dpd: number): 'primary' | 'secondary' | 'info' | 'warning' | 'success' | 'danger' | 'neutral' => {
    if (dpd === 0) return 'success';
    if (dpd <= 30) return 'warning';
    return 'danger';
  };

  // Sorting function
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Helper function to render sort icon
  const renderSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <i className="bi bi-arrow-down-up text-neutral-400 ml-1"></i>;
    }
    return sortDirection === 'asc'
      ? <i className="bi bi-arrow-up text-blue-600 ml-1"></i>
      : <i className="bi bi-arrow-down text-blue-600 ml-1"></i>;
  };

  // Sort actions based on current sort field and direction
  const sortedActions = useMemo(() => {
    if (!sortField) return actions;

    return [...actions].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortField) {
        case 'actionType':
          aValue = a.actionType?.name || a.actionType?.code || '';
          bValue = b.actionType?.name || b.actionType?.code || '';
          break;
        case 'actionDate':
          aValue = new Date(a.actionDate || a.createdAt).getTime();
          bValue = new Date(b.actionDate || b.createdAt).getTime();
          break;
        case 'loanAccountNumber':
          aValue = a.loanAccountNumber || '';
          bValue = b.loanAccountNumber || '';
          break;
        case 'agent':
          aValue = a.agent?.name || '';
          bValue = b.agent?.name || '';
          break;
        case 'dueAmount':
          aValue = typeof a.dueAmount === 'string' ? parseFloat(a.dueAmount) || 0 : Number(a.dueAmount) || 0;
          bValue = typeof b.dueAmount === 'string' ? parseFloat(b.dueAmount) || 0 : Number(b.dueAmount) || 0;
          break;
        case 'dpd':
          aValue = a.dpd || 0;
          bValue = b.dpd || 0;
          break;
        case 'fUpdate':
          aValue = a.fUpdate ? new Date(a.fUpdate).getTime() : 0;
          bValue = b.fUpdate ? new Date(b.fUpdate).getTime() : 0;
          break;
        case 'actionResult':
          aValue = a.actionResult?.name || a.actionResult?.code || '';
          bValue = b.actionResult?.name || b.actionResult?.code || '';
          break;
        default:
          return 0;
      }

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [actions, sortField, sortDirection]);

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
        <CardTitle>{t('customers:tabs.actions')}</CardTitle>
        <div className="flex items-center space-x-2">
          {hasActiveFilters && (
            <div className="flex items-center space-x-2">
              <span className="text-sm text-neutral-600">
                {Object.keys(currentFilters).length} {t('tables:filters.filters_active')}
              </span>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleClearFilters}
                disabled={loading}
              >
                <i className="bi bi-x-circle mr-1"></i>
                {t('tables:filters.clear_filters')}
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
            {t('common:buttons.search')}
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
            {hasActiveFilters ? t('tables:search.no_results') : t('customers:messages.no_customers')}
          </div>
        )}
        
        {!loading && !initialLoad && actions.length > 0 && (
          <div className="space-y-4">
            <div className="max-h-96 overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>
                      <button
                        onClick={() => handleSort('actionType')}
                        className="text-left text-xs font-medium text-neutral-700 hover:text-blue-600 flex items-center"
                      >
                        {t('tables:headers.action_type')}
                        {renderSortIcon('actionType')}
                      </button>
                    </TableHead>
                    <TableHead>
                      <button
                        onClick={() => handleSort('actionDate')}
                        className="text-left text-xs font-medium text-neutral-700 hover:text-blue-600 flex items-center"
                      >
                        {t('tables:headers.date')}
                        {renderSortIcon('actionDate')}
                      </button>
                    </TableHead>
                    <TableHead>
                      <button
                        onClick={() => handleSort('loanAccountNumber')}
                        className="text-left text-xs font-medium text-neutral-700 hover:text-blue-600 flex items-center"
                      >
                        {t('tables:headers.loan_account_number')}
                        {renderSortIcon('loanAccountNumber')}
                      </button>
                    </TableHead>
                    <TableHead>
                      <button
                        onClick={() => handleSort('agent')}
                        className="text-left text-xs font-medium text-neutral-700 hover:text-blue-600 flex items-center"
                      >
                        {t('tables:headers.agent')}
                        {renderSortIcon('agent')}
                      </button>
                    </TableHead>
                    <TableHead>
                      <button
                        onClick={() => handleSort('dueAmount')}
                        className="text-left text-xs font-medium text-neutral-700 hover:text-blue-600 flex items-center"
                      >
                        {t('tables:headers.amount')}
                        {renderSortIcon('dueAmount')}
                      </button>
                    </TableHead>
                    <TableHead>
                      <button
                        onClick={() => handleSort('dpd')}
                        className="text-left text-xs font-medium text-neutral-700 hover:text-blue-600 flex items-center"
                      >
                        {t('tables:headers.delinquency_days')}
                        {renderSortIcon('dpd')}
                      </button>
                    </TableHead>
                    <TableHead>
                      <button
                        onClick={() => handleSort('fUpdate')}
                        className="text-left text-xs font-medium text-neutral-700 hover:text-blue-600 flex items-center"
                      >
                        {t('customers:fields.follow_up')}
                        {renderSortIcon('fUpdate')}
                      </button>
                    </TableHead>
                    <TableHead>
                      <button
                        onClick={() => handleSort('actionResult')}
                        className="text-left text-xs font-medium text-neutral-700 hover:text-blue-600 flex items-center"
                      >
                        {t('tables:headers.result')}
                        {renderSortIcon('actionResult')}
                      </button>
                    </TableHead>
                    <TableHead>{t('tables:headers.notes')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedActions.map((action, index) => (
                    <TableRow key={action.id || index}>
                      <TableCell className="whitespace-nowrap">
                        <div className="flex items-center">
                          <i className={`bi ${getActionTypeIcon(action.actionType?.code || '')} mr-2 text-primary-600`}></i>
                          <div>
                            <Badge variant={getActionBadgeVariant(action.actionType?.code || '')}>
                              {action.actionType?.name || action.actionType?.code || t('common:status.unknown')}
                            </Badge>
                            {action.actionSubtype && (
                              <div className="text-xs text-neutral-600 mt-1">
                                {action.actionSubtype.name || action.actionSubtype.code}
                              </div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-sm text-neutral-900">
                        {formatDate(action.actionDate || action.createdAt)}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-sm">
                        {action.loanAccountNumber ? (
                          <span className="font-semibold text-primary-700">{action.loanAccountNumber}</span>
                        ) : (
                          <span className="text-neutral-400">-</span>
                        )}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-sm">
                        {action.agent?.name ? (
                          <span className="font-semibold">{action.agent.name}</span>
                        ) : (
                          <span className="text-neutral-400">-</span>
                        )}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-sm">
                        {action.dueAmount !== undefined && action.dueAmount !== null ? (
                          <span className="font-semibold text-danger-600">
                            {formatCurrency(action.dueAmount)}
                          </span>
                        ) : (
                          <span className="text-neutral-400">-</span>
                        )}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {action.dpd !== undefined && action.dpd !== null ? (
                          <Badge variant={getDpdBadgeVariant(action.dpd)}>
                            {action.dpd} {t('common:time.days')}
                          </Badge>
                        ) : (
                          <span className="text-neutral-400">-</span>
                        )}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-sm">
                        {action.fUpdate ? (
                          <span className="text-info-700">
                            {formatDate(action.fUpdate)}
                          </span>
                        ) : (
                          <span className="text-neutral-400">-</span>
                        )}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {action.actionResult ? (
                          <Badge variant={getResultBadgeVariant(action.actionResult.code)}>
                            {action.actionResult.name || action.actionResult.code}
                          </Badge>
                        ) : (
                          <span className="text-neutral-400">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-neutral-700 max-w-xs">
                        <div className="truncate" title={action.notes || t('customers:messages.no_notes')}>
                          {action.notes || t('customers:messages.no_notes')}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            
            {totalPages > 1 && (
              <div className="flex flex-col items-center space-y-2 pt-4 border-t">
                <div className="text-sm text-neutral-600">
                  {t('tables:pagination.showing')} {actions.length} {t('customers:titles.actions')}
                  {totalItems > 0 && ` (${totalItems} ${t('tables:pagination.total')})`}
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1 || loading}
                  >
                    <i className="bi bi-chevron-left mr-1"></i>
                    {t('tables:pagination.previous')}
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
                    {t('tables:pagination.next')}
                    <i className="bi bi-chevron-right ml-1"></i>
                  </Button>
                </div>
                <div className="text-xs text-neutral-500">
                  {t('tables:pagination.page')} {currentPage} {t('tables:pagination.of')} {totalPages}
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
