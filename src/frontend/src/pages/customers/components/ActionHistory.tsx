import React, { useState, useEffect } from 'react';
import { CustomerAction } from '../types';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { Spinner } from '../../../components/ui/Spinner';

interface ActionHistoryProps {
  actions?: CustomerAction[];
  cif?: string;
  limit?: number;
  pagination?: {
    page: number;
    pageSize: number;
    totalPages?: number;
    totalItems?: number;
  };
  onPageChange?: (page: number, actionType?: string) => Promise<void>;
}

const ActionHistory: React.FC<ActionHistoryProps> = ({ 
  actions = [], 
  cif, 
  limit = 10, 
  pagination,
  onPageChange 
}) => {
  const [currentPage, setCurrentPage] = useState<number>(pagination?.page || 1);
  const [loading, setLoading] = useState<boolean>(false);
  const [filters, setFilters] = useState({
    actionType: '',
    actionSubType: '',
    actionResult: ''
  });

  // Update current page when pagination prop changes
  useEffect(() => {
    if (pagination?.page) {
      setCurrentPage(pagination.page);
    }
  }, [pagination?.page]);

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

  const handlePageChange = async (newPage: number) => {
    if (onPageChange && newPage !== currentPage) {
      setLoading(true);
      try {
        await onPageChange(newPage);
        setCurrentPage(newPage);
      } catch (error) {
        console.error('Error changing page:', error);
      } finally {
        setLoading(false);
      }
    }
  };

  // Get unique filter options from current actions
  const getFilterOptions = () => {
    const types = new Set<string>();
    const subTypes = new Set<string>();
    const results = new Set<string>();
    
    actions.forEach(action => {
      if (action.actionType?.code) types.add(action.actionType.code);
      if (action.actionSubtype?.code) subTypes.add(action.actionSubtype.code);
      if (action.actionResult?.code) results.add(action.actionResult.code);
    });
    
    return {
      actionTypes: Array.from(types),
      actionSubTypes: Array.from(subTypes),
      actionResults: Array.from(results)
    };
  };
  
  const filterOptions = getFilterOptions();
  
  // Apply client-side filters
  const filteredActions = actions.filter(action => {
    if (filters.actionType && action.actionType?.code !== filters.actionType) return false;
    if (filters.actionSubType && action.actionSubtype?.code !== filters.actionSubType) return false;
    if (filters.actionResult && action.actionResult?.code !== filters.actionResult) return false;
    return true;
  });
  
  const handleFilterChange = (filterName: string, value: string) => {
    setFilters(prev => ({ ...prev, [filterName]: value }));
  };

  // Generate page numbers for pagination
  const generatePageNumbers = () => {
    const totalPages = pagination?.totalPages || 1;
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

  const totalPages = pagination?.totalPages || 1;
  const totalItems = pagination?.totalItems || 0;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Action History</CardTitle>
        <div className="flex space-x-2">
          <select
            value={filters.actionType}
            onChange={(e) => handleFilterChange('actionType', e.target.value)}
            className="border rounded p-1 text-sm"
          >
            <option value="">All Types</option>
            {filterOptions.actionTypes.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
          
          <select
            value={filters.actionSubType}
            onChange={(e) => handleFilterChange('actionSubType', e.target.value)}
            className="border rounded p-1 text-sm"
          >
            <option value="">All Subtypes</option>
            {filterOptions.actionSubTypes.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
          
          <select
            value={filters.actionResult}
            onChange={(e) => handleFilterChange('actionResult', e.target.value)}
            className="border rounded p-1 text-sm"
          >
            <option value="">All Results</option>
            {filterOptions.actionResults.map(result => (
              <option key={result} value={result}>{result}</option>
            ))}
          </select>
        </div>
      </CardHeader>
      
      <CardContent>
        {loading && (
          <div className="flex justify-center py-8">
            <Spinner size="md" />
          </div>
        )}
        
        {!loading && filteredActions.length === 0 && (
          <div className="text-center py-8 text-neutral-500">
            No actions match the current filters
          </div>
        )}
        
        {!loading && filteredActions.length > 0 && (
          <div className="space-y-4">
            <div className="max-h-96 overflow-y-auto space-y-4 pr-2">
              {filteredActions.map((action, index) => (
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
                  Showing {filteredActions.length} of {actions.length} actions on this page
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
    </Card>
  );
};

export default ActionHistory;
