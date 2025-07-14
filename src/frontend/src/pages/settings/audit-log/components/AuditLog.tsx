import React, { useState, useEffect } from 'react';
import { useTranslation } from '../../../../i18n/hooks/useTranslation';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/ui/Card';
import { Input } from '../../../../components/ui/Input';
import { Button } from '../../../../components/ui/Button';
import { Select } from '../../../../components/ui/Select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../../components/ui/Table';
import { Spinner } from '../../../../components/ui/Spinner';
import { Alert } from '../../../../components/ui/Alert';
import { auditApi } from '../../../../services/api/audit.api';
import { AuditLog as IAuditLog, AuditLogFilters } from '../../../../types/audit';

const AuditLog: React.FC = () => {
  const { t } = useTranslation(['settings', 'common']);
  const [logs, setLogs] = useState<IAuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  });

  const [filters, setFilters] = useState<AuditLogFilters>({
    page: 1,
    limit: 20,
    sortBy: 'createdAt',
    sortOrder: 'DESC',
    startDate: '',
    endDate: ''
  });

  const [tempFilters, setTempFilters] = useState<AuditLogFilters>({
    page: 1,
    limit: 20,
    sortBy: 'createdAt',
    sortOrder: 'DESC',
    startDate: '',
    endDate: ''
  });

  const fetchLogs = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await auditApi.getLogs(filters);
      console.log('Fetched audit logs:', response);
      setLogs(response.data || []);
      setPagination({
        page: response.page || 1,
        limit: response.limit || 20,
        total: response.total || 0,
        totalPages: response.totalPages || 0
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch audit logs');
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const updateFilter = (key: keyof AuditLogFilters, value: string | number) => {
    setTempFilters(prev => ({
      ...prev,
      [key]: value || undefined,
      page: key !== 'page' ? 1 : (typeof value === 'number' ? value : parseInt(value.toString()) || 1)
    }));
  };

  const applyFilters = async () => {
    setFilters(tempFilters);
    try {
      setLoading(true);
      setError(null);
      const response = await auditApi.getLogs(tempFilters);
      console.log('Fetched audit logs:', response);
      setLogs(response.data || []);
      setPagination({
        page: response.page || 1,
        limit: response.limit || 20,
        total: response.total || 0,
        totalPages: response.totalPages || 0
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch audit logs');
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  const clearFilters = async () => {
    const clearedFilters: AuditLogFilters = {
      page: 1,
      limit: 20,
      sortBy: 'createdAt',
      sortOrder: 'DESC',
      startDate: '',
      endDate: ''
    };
    setTempFilters(clearedFilters);
    setFilters(clearedFilters);
    
    try {
      setLoading(true);
      setError(null);
      const response = await auditApi.getLogs(clearedFilters);
      console.log('Fetched audit logs:', response);
      setLogs(response.data || []);
      setPagination({
        page: response.page || 1,
        limit: response.limit || 20,
        total: response.total || 0,
        totalPages: response.totalPages || 0
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch audit logs');
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  const hasActiveFilters = tempFilters.startDate || tempFilters.endDate || tempFilters.eventType || tempFilters.serviceName || tempFilters.action;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const handlePageChange = async (newPage: number) => {
    const newFilters = { ...filters, page: newPage };
    setFilters(newFilters);
    setTempFilters(newFilters);
    
    try {
      setLoading(true);
      setError(null);
      const response = await auditApi.getLogs(newFilters);
      console.log('Fetched audit logs:', response);
      setLogs(response.data || []);
      setPagination({
        page: response.page || 1,
        limit: response.limit || 20,
        total: response.total || 0,
        totalPages: response.totalPages || 0
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch audit logs');
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center gap-4">
          <div className="flex-1">
            <CardTitle className="flex items-center gap-2">
              <i className="bi bi-clipboard-data text-xl"></i>
              Audit Log
            </CardTitle>
            <p className="text-sm text-neutral-600 mt-1">
              View and analyze system audit logs with date-based filtering for security monitoring and compliance.
            </p>
          </div>
          <Button
            variant="primary"
            onClick={fetchLogs}
            disabled={loading}
            className="flex items-center gap-2"
          >
            {loading ? (
              <Spinner className="w-4 h-4" />
            ) : (
              <i className="bi bi-arrow-clockwise"></i>
            )}
            Refresh
          </Button>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="bg-white border border-neutral-200 rounded-lg p-4 space-y-4 mb-6">
            <div className="flex items-center gap-4 flex-wrap">
              {/* Date Range Filters */}
              <div className="min-w-[200px]">
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Start Date
                </label>
                <Input
                  type="date"
                  value={tempFilters.startDate || ''}
                  onChange={(e) => updateFilter('startDate', e.target.value)}
                />
              </div>

              <div className="min-w-[200px]">
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  End Date
                </label>
                <Input
                  type="date"
                  value={tempFilters.endDate || ''}
                  onChange={(e) => updateFilter('endDate', e.target.value)}
                />
              </div>

              {/* Service Name Filter */}
              <div className="min-w-[200px]">
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Service
                </label>
                <Input
                  type="text"
                  value={tempFilters.serviceName || ''}
                  onChange={(e) => updateFilter('serviceName', e.target.value)}
                  placeholder="Filter by service name"
                />
              </div>

              {/* Event Type Filter */}
              <div className="min-w-[200px]">
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Event Type
                </label>
                <Input
                  type="text"
                  value={tempFilters.eventType || ''}
                  onChange={(e) => updateFilter('eventType', e.target.value)}
                  placeholder="Filter by event type"
                />
              </div>

              {/* Action Filter */}
              <div className="min-w-[200px]">
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Action
                </label>
                <Input
                  type="text"
                  value={tempFilters.action || ''}
                  onChange={(e) => updateFilter('action', e.target.value)}
                  placeholder="Filter by action"
                />
              </div>
            </div>

            {/* Sort Options */}
            <div className="flex items-center gap-4 flex-wrap">
              <div className="min-w-[200px]">
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Sort By
                </label>
                <Select
                  value={tempFilters.sortBy || 'createdAt'}
                  onChange={(e) => updateFilter('sortBy', e.target.value)}
                  options={[
                    { value: 'createdAt', label: 'Created At' },
                    { value: 'timestamp', label: 'Timestamp' },
                    { value: 'eventType', label: 'Event Type' },
                    { value: 'serviceName', label: 'Service Name' },
                    { value: 'action', label: 'Action' }
                  ]}
                />
              </div>

              <div className="min-w-[150px]">
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Sort Order
                </label>
                <Select
                  value={tempFilters.sortOrder || 'DESC'}
                  onChange={(e) => updateFilter('sortOrder', e.target.value)}
                  options={[
                    { value: 'DESC', label: 'Descending' },
                    { value: 'ASC', label: 'Ascending' }
                  ]}
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-end gap-2">
                <Button
                  variant="primary"
                  onClick={applyFilters}
                  className="flex items-center gap-2"
                >
                  <i className="bi bi-funnel"></i>
                  Apply Filters
                </Button>
                {hasActiveFilters && (
                  <Button
                    variant="secondary"
                    onClick={clearFilters}
                    className="flex items-center gap-2"
                  >
                    <i className="bi bi-x-lg"></i>
                    Clear Filters
                  </Button>
                )}
              </div>
            </div>

            {/* Active Filters Summary */}
            {hasActiveFilters && (
              <div className="pt-3 border-t border-neutral-200">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium text-neutral-700">
                    Active Filters:
                  </span>
                  {tempFilters.startDate && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      Start: {tempFilters.startDate}
                    </span>
                  )}
                  {tempFilters.endDate && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      End: {tempFilters.endDate}
                    </span>
                  )}
                  {tempFilters.serviceName && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Service: {tempFilters.serviceName}
                    </span>
                  )}
                  {tempFilters.eventType && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                      Event: {tempFilters.eventType}
                    </span>
                  )}
                  {tempFilters.action && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                      Action: {tempFilters.action}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Error State */}
          {error && (
            <Alert variant="danger" className="mb-4">
              <i className="bi bi-exclamation-triangle"></i>
              <div>
                <strong>Error:</strong> {error}
              </div>
            </Alert>
          )}

          {/* Loading State */}
          {loading && (
            <div className="flex justify-center items-center py-8">
              <Spinner className="w-8 h-8" />
              <span className="ml-2">Loading audit logs...</span>
            </div>
          )}

          {/* Audit Logs Table */}
          {!loading && !error && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div className="text-sm text-neutral-600">
                  Showing {logs.length} of {pagination.total} logs
                </div>
                <div className="flex items-center gap-2">
                  <Select
                    value={filters.limit?.toString() || '20'}
                    onChange={async (e) => {
                      const newLimit = parseInt(e.target.value);
                      const newFilters = { ...filters, limit: newLimit, page: 1 };
                      setFilters(newFilters);
                      setTempFilters(newFilters);
                      
                      try {
                        setLoading(true);
                        setError(null);
                        const response = await auditApi.getLogs(newFilters);
                        console.log('Fetched audit logs:', response);
                        setLogs(response.data || []);
                        setPagination({
                          page: response.page || 1,
                          limit: response.limit || 20,
                          total: response.total || 0,
                          totalPages: response.totalPages || 0
                        });
                      } catch (err) {
                        setError(err instanceof Error ? err.message : 'Failed to fetch audit logs');
                        setLogs([]);
                      } finally {
                        setLoading(false);
                      }
                    }}
                    options={[
                      { value: '10', label: '10 per page' },
                      { value: '20', label: '20 per page' },
                      { value: '50', label: '50 per page' },
                      { value: '100', label: '100 per page' }
                    ]}
                  />
                </div>
              </div>

              <div className="border border-neutral-200 rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Timestamp</TableHead>
                      <TableHead>Service</TableHead>
                      <TableHead>Event Type</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>User Agent</TableHead>
                      <TableHead>Entity</TableHead>
                      <TableHead>Metadata</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="font-mono text-sm">
                          {formatDate(log.timestamp)}
                        </TableCell>
                        <TableCell>
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {log.serviceName}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            {log.eventType}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                            {log.action}
                          </span>
                        </TableCell>
                        <TableCell>
                          {log.userAgent || '-'}
                        </TableCell>
                        <TableCell>
                          {log.entityType && log.entityId ? (
                            <div className="text-sm">
                              <div className="font-medium">{log.entityType}</div>
                              <div className="text-neutral-500 font-mono text-xs truncate max-w-[200px]" title={log.entityId}>
                                {log.entityId}
                              </div>
                            </div>
                          ) : '-'}
                        </TableCell>
                        <TableCell>
                          {log.metadata ? (
                            <div className="max-w-[300px]">
                              <details className="cursor-pointer">
                                <summary className="text-sm text-blue-600 hover:text-blue-800">
                                  View metadata
                                </summary>
                                <pre className="mt-2 text-xs bg-gray-50 p-2 rounded overflow-auto max-h-[200px]">
                                  {JSON.stringify(log.metadata, null, 2)}
                                </pre>
                              </details>
                            </div>
                          ) : '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="flex justify-center items-center gap-2 mt-4">
                  <Button
                    variant="secondary"
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={pagination.page <= 1}
                  >
                    <i className="bi bi-chevron-left"></i>
                    Previous
                  </Button>
                  
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                      const pageNumber = i + 1;
                      return (
                        <Button
                          key={pageNumber}
                          variant={pagination.page === pageNumber ? "primary" : "secondary"}
                          onClick={() => handlePageChange(pageNumber)}
                          className="w-10 h-10"
                        >
                          {pageNumber}
                        </Button>
                      );
                    })}
                  </div>
                  
                  <Button
                    variant="secondary"
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={pagination.page >= pagination.totalPages}
                  >
                    Next
                    <i className="bi bi-chevron-right"></i>
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AuditLog;