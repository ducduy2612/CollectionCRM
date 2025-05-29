import React, { useState, useEffect } from 'react';
import { CustomerAction } from '../types';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { Spinner } from '../../../components/ui/Spinner';
import { workflowApi } from '../../../services/api/workflow.api';

interface ActionHistoryProps {
  actions?: CustomerAction[];
  cif?: string;
  limit?: number;
}

const ActionHistory: React.FC<ActionHistoryProps> = ({ actions: initialActions, cif, limit = 5 }) => {
  const [actions, setActions] = useState<CustomerAction[]>(initialActions || []);
  const [loading, setLoading] = useState<boolean>(!initialActions && !!cif);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState<number>(1);
  const [hasMore, setHasMore] = useState<boolean>(false);
  const [actionType, setActionType] = useState<string | undefined>(undefined);

  useEffect(() => {
    // If actions are provided directly, use them
    if (initialActions) {
      setActions(initialActions);
      setLoading(false);
      return;
    }

    // Otherwise, fetch actions if cif is provided
    if (cif) {
      fetchActions();
    }
  }, [cif, initialActions, page, actionType]);

  const fetchActions = async () => {
    if (!cif) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const params: any = {
        page,
        pageSize: limit
      };
      
      if (actionType) {
        params.type = actionType;
      }
      
      const response = await workflowApi.getCustomerActions(cif, params);
      
      setActions(response.actions);
      setHasMore(response.pagination.page < response.pagination.totalPages);
    } catch (err) {
      console.error('Error fetching customer actions:', err);
      setError('Failed to load action history');
    } finally {
      setLoading(false);
    }
  };

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

  const handleLoadMore = () => {
    setPage(prevPage => prevPage + 1);
  };

  const handleFilterClick = () => {
    // Toggle between showing all actions and filtering by type
    setActionType(actionType ? undefined : 'CALL');
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Action History</CardTitle>
        <Button variant="secondary" size="sm" onClick={handleFilterClick}>
          <i className="bi bi-filter mr-2"></i>
          {actionType ? `Filtering: ${actionType}` : 'Filter'}
        </Button>
      </CardHeader>
      
      <CardContent>
        {loading && (
          <div className="flex justify-center py-8">
            <Spinner size="md" />
          </div>
        )}
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-md">
            <p>{error}</p>
          </div>
        )}
        
        {!loading && !error && actions.length === 0 && (
          <div className="text-center py-8 text-neutral-500">
            No actions found
          </div>
        )}
        
        {!loading && !error && actions.length > 0 && (
          <div className="space-y-4">
            {actions.slice(0, limit).map((action, index) => (
              <div key={action.id || index} className="p-3 border-l-4 border-primary-500 bg-neutral-50 rounded-r-md">
                <div className="flex justify-between mb-2">
                  <div className="font-semibold flex items-center">
                    <i className={`bi ${getActionTypeIcon(action.type)} mr-2 text-primary-600`}></i>
                    <Badge variant={getActionBadgeVariant(action.type)}>
                      {action.type}
                    </Badge>
                    {action.subtype && (
                      <span className="ml-2 text-sm text-neutral-600">
                        {action.subtype}
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
                    <Badge variant={getResultBadgeVariant(action.actionResult)}>
                      {action.actionResult}
                    </Badge>
                  )}
                </div>
              </div>
            ))}
            
            {hasMore && (
              <div className="text-center pt-2">
                <Button variant="secondary" size="sm" onClick={handleLoadMore}>
                  Load More
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ActionHistory;
