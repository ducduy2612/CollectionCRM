import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { AssignmentHistoryItem } from '../../../services/api/workflow/types';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Spinner } from '../../../components/ui/Spinner';
import { agentsApi } from '../../../services/api/workflow/agents.api';
import { useTranslation, useLocalization } from '../../../i18n/hooks/useTranslation';

interface AssignmentHistoryProps {
  cif: string;
}

const AssignmentHistory: React.FC<AssignmentHistoryProps> = React.memo(({ cif }) => {
  const { t } = useTranslation(['customers', 'tables', 'common']);
  const { formatDate: formatDateLocalized } = useLocalization();
  const [assignments, setAssignments] = useState<AssignmentHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const errorMessage = useMemo(() => t('customers:messages.failed_to_load_assignments'), [t]);

  useEffect(() => {
    let isMounted = true;
    
    const fetchAssignmentHistory = async () => {
      if (!cif) return;

      setLoading(true);
      setError(null);

      try {
        const response = await agentsApi.getAssignmentHistory(cif);
        // The API returns { history: any[] }, so we need to access the history property
        if (isMounted) {
          const sortedAssignments = (response.history || []).sort((a, b) => {
            // Sort by endDate descending (most recent first)
            // Current assignments (endDate = null) should appear first
            if (a.endDate === null && b.endDate === null) {
              // Both are current, sort by startDate descending
              return new Date(b.startDate).getTime() - new Date(a.startDate).getTime();
            }
            if (a.endDate === null) return -1; // a is current, should come first
            if (b.endDate === null) return 1;  // b is current, should come first
            
            // Both have endDate, sort by endDate descending
            return new Date(b.endDate).getTime() - new Date(a.endDate).getTime();
          });
          setAssignments(sortedAssignments);
        }
      } catch (err) {
        console.error('Error fetching assignment history:', err);
        if (isMounted) {
          setError(errorMessage);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchAssignmentHistory();

    return () => {
      isMounted = false;
    };
  }, [cif, errorMessage]);

  const formatDate = (dateString: string) => {
    return formatDateLocalized(dateString, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getAgentDisplay = (agent: any) => {
    if (!agent) return t('common:labels.unassigned');
    return `${agent.name} (${agent.employeeId})`;
  };

  const getAssignmentPeriod = (startDate: string, endDate: string | null, isCurrent: boolean) => {
    const start = formatDate(startDate);
    if (isCurrent) {
      return `${start} - ${t('common:labels.current')}`;
    }
    return endDate ? `${start} - ${formatDate(endDate)}` : start;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t('customers:tabs.assignment_history')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center items-center h-32">
            <Spinner size="md" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t('customers:tabs.assignment_history')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-md">
            <p>{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>{t('customers:tabs.assignment_history')}</CardTitle>
        <Button variant="secondary" size="sm">
          <i className="bi bi-download mr-2"></i>
          {t('tables:actions.export')}
        </Button>
      </CardHeader>
      <CardContent>
        {assignments.length === 0 ? (
          <div className="text-center py-8 text-neutral-500">
            <p>{t('customers:messages.no_assignment_history')}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {assignments.map((assignment, index) => (
              <div 
                key={assignment.id || index} 
                className={`assignment-item p-4 border rounded-lg ${
                  assignment.isCurrent 
                    ? 'border-primary-200 bg-primary-50' 
                    : 'border-neutral-200 bg-white'
                }`}
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm font-medium text-neutral-600">
                        {t('customers:labels.assignment_period')}:
                      </span>
                      <span className="text-sm text-neutral-800">
                        {getAssignmentPeriod(assignment.startDate, assignment.endDate, assignment.isCurrent)}
                      </span>
                      {assignment.isCurrent && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          {t('common:labels.current')}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Call Agent */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <i className="bi bi-telephone text-blue-500"></i>
                      <span className="text-sm font-medium text-neutral-600">
                        {t('customers:labels.call_agent')}:
                      </span>
                    </div>
                    <div className="ml-6">
                      <div className="text-sm text-neutral-800">
                        {getAgentDisplay(assignment.assignedCallAgent)}
                      </div>
                      {assignment.assignedCallAgent && (
                        <div className="text-xs text-neutral-500">
                          {assignment.assignedCallAgent.team} • {assignment.assignedCallAgent.type}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Field Agent */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <i className="bi bi-geo-alt text-green-500"></i>
                      <span className="text-sm font-medium text-neutral-600">
                        {t('customers:labels.field_agent')}:
                      </span>
                    </div>
                    <div className="ml-6">
                      <div className="text-sm text-neutral-800">
                        {getAgentDisplay(assignment.assignedFieldAgent)}
                      </div>
                      {assignment.assignedFieldAgent && (
                        <div className="text-xs text-neutral-500">
                          {assignment.assignedFieldAgent.team} • {assignment.assignedFieldAgent.type}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Assignment metadata */}
                <div className="mt-3 pt-3 border-t border-neutral-100">
                  <div className="text-xs text-neutral-400">
                    {t('common:labels.created_at')}: {formatDate(assignment.createdAt)}
                    {assignment.updatedAt !== assignment.createdAt && (
                      <span className="ml-4">
                        {t('common:labels.updated_at')}: {formatDate(assignment.updatedAt)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
});

AssignmentHistory.displayName = 'AssignmentHistory';

export default AssignmentHistory;