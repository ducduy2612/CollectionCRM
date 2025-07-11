import React, { useState, useRef, useEffect } from 'react';
import { Card } from '../../../../components/ui/Card';
import { Button } from '../../../../components/ui/Button';
import { Alert } from '../../../../components/ui/Alert';
import { Spinner } from '../../../../components/ui/Spinner';
import { workflowApi } from '../../../../services/api/workflow.api';
import { BulkAssignmentResponse, BatchStatusResponse } from '../../../../services/api/workflow/types';
import { useNamespacedTranslation } from '../../../../i18n/hooks/useTranslation';
import { 
  ArrowUpTrayIcon, 
  DocumentArrowDownIcon, 
  CheckCircleIcon, 
  ExclamationTriangleIcon,
  InformationCircleIcon,
  ClockIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';

interface UploadError {
  message: string;
  details?: string;
}

type ProcessingStage = 'idle' | 'uploading' | 'processing' | 'completed' | 'error';

interface ProcessingProgress {
  stage: ProcessingStage;
  message: string;
  percentage: number;
}

const CustomerAssignmentUpload: React.FC = () => {
  const { t } = useNamespacedTranslation('settings');
  const { t: tCommon } = useNamespacedTranslation('common');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [processingProgress, setProcessingProgress] = useState<ProcessingProgress>({ stage: 'idle', message: '', percentage: 0 });
  const [batchResult, setBatchResult] = useState<BulkAssignmentResponse | null>(null);
  const [uploadError, setUploadError] = useState<UploadError | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [currentBatchId, setCurrentBatchId] = useState<string | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const [isClearingStaging, setIsClearingStaging] = useState(false);

  // Polling mechanism for batch status (useful for async processing)
  const pollBatchStatus = async (batchId: string) => {
    if (!batchId || isPolling) return;
    
    setIsPolling(true);
    let attempts = 0;
    const maxAttempts = 30; // Maximum 30 attempts (5 minutes with 10s intervals)
    
    const poll = async () => {
      try {
        const status = await workflowApi.getBatchStatus(batchId);
        
        // Update progress based on batch status
        const totalRows = status.totalRows || 0;
        const processedRows = status.processedRows || 0;
        const failedRows = status.failedRows || 0;
        const completedRows = processedRows + failedRows;
        
        if (totalRows > 0) {
          const percentage = Math.round((completedRows / totalRows) * 100);
          setProcessingProgress({ 
            stage: 'processing', 
            message: `Processing batch: ${completedRows}/${totalRows} rows completed`, 
            percentage: Math.min(percentage, 95) // Cap at 95% until fully complete
          });
        }
        
        // Check if processing is complete
        if (completedRows >= totalRows) {
          setBatchResult(status);
          setProcessingProgress({ stage: 'completed', message: 'Processing completed successfully', percentage: 100 });
          setIsPolling(false);
          return;
        }
        
        attempts++;
        if (attempts >= maxAttempts) {
          setProcessingProgress({ stage: 'error', message: 'Batch processing timeout', percentage: 0 });
          setIsPolling(false);
          return;
        }
        
        // Continue polling
        setTimeout(poll, 10000); // Poll every 10 seconds
      } catch (error) {
        console.error('Error polling batch status:', error);
        setProcessingProgress({ stage: 'error', message: 'Failed to check batch status', percentage: 0 });
        setIsPolling(false);
      }
    };
    
    poll();
  };

  // Effect to start polling when a batch is created (for async processing)
  useEffect(() => {
    if (currentBatchId && processingProgress.stage === 'processing') {
      pollBatchStatus(currentBatchId);
    }
  }, [currentBatchId, processingProgress.stage]);

  const handleFileSelect = (file: File) => {
    // Validate file type
    if (!file.name.toLowerCase().endsWith('.csv')) {
      setUploadError({
        message: 'Invalid file type',
        details: 'Please select a CSV file (.csv)'
      });
      return;
    }

    // Validate file size (max 50MB)
    if (file.size > 50 * 1024 * 1024) {
      setUploadError({
        message: 'File too large',
        details: 'Please select a file smaller than 50MB'
      });
      return;
    }

    setSelectedFile(file);
    setUploadError(null);
    setBatchResult(null);
    setProcessingProgress({ stage: 'idle', message: '', percentage: 0 });
  };

  const handleFileInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (event: React.DragEvent) => {
    event.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    setDragOver(false);
    
    const file = event.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setProcessingProgress({ stage: 'uploading', message: 'Uploading file and validating data...', percentage: 20 });
    setUploadError(null);
    setBatchResult(null);

    try {
      const result = await workflowApi.createBulkAssignments(selectedFile);
      setBatchResult(result);
      setCurrentBatchId(result.batchId);
      setProcessingProgress({ stage: 'completed', message: 'Processing completed successfully', percentage: 100 });
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error: any) {
      console.error('Upload error:', error);
      
      let errorMessage = 'Upload failed';
      let errorDetails = 'An unexpected error occurred';
      
      if (error) {
        // Handle different error types
        if (error.response) {
          // Server responded with error status
          const status = error.response.status;
          const data = error.response.data;
          
          if (status === 400) {
            errorMessage = 'Invalid Request';
            errorDetails = data?.message || data?.error || 'The uploaded file or data format is invalid';
          } else if (status === 413) {
            errorMessage = 'File Too Large';
            errorDetails = 'The uploaded file exceeds the maximum size limit';
          } else if (status === 415) {
            errorMessage = 'Unsupported File Type';
            errorDetails = 'Please upload a valid CSV file';
          } else if (status >= 400 && status < 500) {
            errorMessage = 'Client Error';
            errorDetails = data?.message || data?.error || `Request failed with status ${status}`;
          } else if (status === 500) {
            errorMessage = 'Server Error';
            errorDetails = 'Internal server error occurred while processing the file';
          } else if (status === 503) {
            errorMessage = 'Service Unavailable';
            errorDetails = 'The server is temporarily unavailable. Please try again later.';
          } else if (status >= 500) {
            errorMessage = 'Server Error';
            errorDetails = data?.message || data?.error || 'Internal server error occurred';
          } else {
            errorMessage = 'Request Failed';
            errorDetails = data?.message || data?.error || `Request failed with status ${status}`;
          }
        } else if (error.request) {
          // Network error - request was made but no response received
          errorMessage = 'Network Error';
          errorDetails = 'Unable to connect to the server. Please check your internet connection and try again.';
        } else if (error.message) {
          // Other error with message
          errorMessage = 'Upload Error';
          errorDetails = error.message;
        }
      }
      
      setUploadError({
        message: errorMessage,
        details: errorDetails
      });
      setProcessingProgress({ stage: 'error', message: errorMessage, percentage: 0 });
    }
  };

  const handleClearFile = () => {
    setSelectedFile(null);
    setUploadError(null);
    setBatchResult(null);
    setProcessingProgress({ stage: 'idle', message: '', percentage: 0 });
    setCurrentBatchId(null);
    setIsPolling(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const refreshBatchStatus = async () => {
    if (!currentBatchId) return;
    
    try {
      const status = await workflowApi.getBatchStatus(currentBatchId);
      setBatchResult(status);
    } catch (error) {
      console.error('Error refreshing batch status:', error);
      setUploadError({
        message: 'Failed to refresh batch status',
        details: 'Unable to fetch the latest batch processing status'
      });
    }
  };

  const handleClearStagingTable = async () => {
    if (!window.confirm('Are you sure you want to clear all staging table data? This action cannot be undone.')) {
      return;
    }

    setIsClearingStaging(true);
    setUploadError(null);

    try {
      const result = await workflowApi.clearStagingTable();
      
      // Clear current batch result and reset state
      setBatchResult(null);
      setCurrentBatchId(null);
      setProcessingProgress({ stage: 'idle', message: '', percentage: 0 });
      
      // Show success message
      setUploadError({
        message: 'Staging table cleared successfully',
        details: result.message
      });
      
      // Auto-hide success message after 3 seconds
      setTimeout(() => {
        setUploadError(null);
      }, 3000);
    } catch (error: any) {
      console.error('Error clearing staging table:', error);
      setUploadError({
        message: 'Failed to clear staging table',
        details: error.message || 'An unexpected error occurred'
      });
    } finally {
      setIsClearingStaging(false);
    }
  };

  const renderProgressBar = () => {
    const { stage, message, percentage } = processingProgress;
    
    if (stage === 'idle') return null;
    
    const getProgressColor = () => {
      switch (stage) {
        case 'uploading':
        case 'processing':
          return 'bg-blue-500';
        case 'completed':
          return 'bg-green-500';
        case 'error':
          return 'bg-red-500';
        default:
          return 'bg-gray-500';
      }
    };

    const getIcon = () => {
      switch (stage) {
        case 'uploading':
        case 'processing':
          return <Spinner size="sm" className="mr-2" />;
        case 'completed':
          return <CheckCircleIcon className="w-5 h-5 text-green-500 mr-2" />;
        case 'error':
          return <XCircleIcon className="w-5 h-5 text-red-500 mr-2" />;
        default:
          return <ClockIcon className="w-5 h-5 text-gray-500 mr-2" />;
      }
    };

    return (
      <div className="mb-4">
        <div className="flex items-center mb-2">
          {getIcon()}
          <span className="text-sm font-medium text-gray-700">{message}</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className={`h-2 rounded-full transition-all duration-300 ${getProgressColor()}`}
            style={{ width: `${percentage}%` }}
          ></div>
        </div>
        <div className="text-right text-xs text-gray-500 mt-1">
          {percentage}%
        </div>
      </div>
    );
  };

  const downloadTemplate = () => {
    const csvContent = 'CIF,AssignedCallAgentName,AssignedFieldAgentName\n' +
                      'EXAMPLE001,John Smith,Jane Doe\n' +
                      'EXAMPLE002,Alice Johnson,Bob Wilson\n' +
                      'EXAMPLE003,Carol Brown,';
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'customer-assignment-template.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-center mb-4">
          <ArrowUpTrayIcon className="w-6 h-6 text-primary-600 mr-2" />
          <h2 className="text-xl font-semibold text-neutral-800">
            {t('customerAssignmentUpload.title')}
          </h2>
        </div>
        
        <p className="text-neutral-600 mb-6">
          {t('customerAssignmentUpload.description')}
        </p>

        {/* Template Download and Clear Staging */}
        <div className="mb-6 flex gap-3">
          <Button
            variant="secondary"
            onClick={downloadTemplate}
            className="flex items-center gap-2"
          >
            <DocumentArrowDownIcon className="w-4 h-4" />
            {t('customerAssignmentUpload.downloadTemplate')}
          </Button>
          <Button
            variant="danger"
            onClick={handleClearStagingTable}
            disabled={isClearingStaging || processingProgress.stage === 'uploading' || processingProgress.stage === 'processing'}
            className="flex items-center gap-2"
          >
            {isClearingStaging ? (
              <>
                <Spinner size="sm" />
                Clearing...
              </>
            ) : (
              <>
                <XCircleIcon className="w-4 h-4" />
                Clear Staging Table
              </>
            )}
          </Button>
        </div>

        {/* Progress Bar */}
        {renderProgressBar()}

        {/* File Upload Area */}
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            dragOver
              ? 'border-primary-400 bg-primary-50'
              : selectedFile
              ? 'border-green-400 bg-green-50'
              : 'border-neutral-300 hover:border-neutral-400'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {selectedFile ? (
            <div className="space-y-4">
              <CheckCircleIcon className="w-12 h-12 text-green-500 mx-auto" />
              <div>
                <p className="text-lg font-medium text-neutral-800">{selectedFile.name}</p>
                <p className="text-sm text-neutral-600">
                  {formatFileSize(selectedFile.size)} • CSV File
                </p>
              </div>
              <div className="flex justify-center gap-3">
                <Button onClick={handleUpload} disabled={processingProgress.stage === 'uploading' || processingProgress.stage === 'processing'}>
                  {processingProgress.stage === 'uploading' || processingProgress.stage === 'processing' ? (
                    <>
                      <Spinner size="sm" className="mr-2" />
                      {tCommon('uploading')}
                    </>
                  ) : (
                    tCommon('upload')
                  )}
                </Button>
                <Button variant="secondary" onClick={handleClearFile} disabled={processingProgress.stage === 'uploading' || processingProgress.stage === 'processing'}>
                  {tCommon('cancel')}
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <ArrowUpTrayIcon className="w-12 h-12 text-neutral-400 mx-auto" />
              <div>
                <p className="text-lg font-medium text-neutral-800">
                  {t('customerAssignmentUpload.dropZone.title')}
                </p>
                <p className="text-sm text-neutral-600">
                  {t('customerAssignmentUpload.dropZone.subtitle')}
                </p>
              </div>
              <Button
                variant="secondary"
                onClick={() => fileInputRef.current?.click()}
                className="mx-auto"
              >
                {tCommon('selectFile')}
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileInputChange}
                className="hidden"
              />
            </div>
          )}
        </div>

        {/* File Requirements */}
        <div className="mt-4 p-4 bg-blue-50 rounded-lg">
          <div className="flex items-start">
            <InformationCircleIcon className="w-5 h-5 text-blue-500 mt-0.5 mr-2 flex-shrink-0" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-2">
                {t('customerAssignmentUpload.requirements.title')}
              </p>
              <ul className="space-y-1 list-disc list-inside">
                <li>{t('customerAssignmentUpload.requirements.format')}</li>
                <li>{t('customerAssignmentUpload.requirements.size')}</li>
                <li>{t('customerAssignmentUpload.requirements.columns')}</li>
                <li>{t('customerAssignmentUpload.requirements.agents')}</li>
                <li>{t('customerAssignmentUpload.requirements.validation')}</li>
              </ul>
            </div>
          </div>
        </div>
      </Card>

      {/* Upload Error */}
      {uploadError && (
        <Alert variant="danger" className="flex items-start">
          <ExclamationTriangleIcon className="w-5 h-5 mt-0.5 mr-2 flex-shrink-0" />
          <div>
            <p className="font-medium">{uploadError.message}</p>
            {uploadError.details && (
              <p className="text-sm mt-1">{uploadError.details}</p>
            )}
          </div>
        </Alert>
      )}

      {/* Batch Processing Results */}
      {batchResult && (
        <Card className="p-6 border-green-200 bg-green-50">
          <div className="flex items-start">
            <CheckCircleIcon className="w-6 h-6 text-green-500 mt-0.5 mr-3 flex-shrink-0" />
            <div className="flex-1">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-lg font-semibold text-green-800">
                  Batch Processing Results
                </h3>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={refreshBatchStatus}
                  disabled={!currentBatchId}
                >
                  Refresh
                </Button>
              </div>
              <div className="mb-4">
                <p className="text-sm text-green-700 mb-2">
                  <span className="font-medium">Batch ID:</span> {batchResult.batchId}
                </p>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div className="bg-white rounded-lg p-4 border border-green-200">
                  <p className="text-2xl font-bold text-blue-600">{batchResult.totalRows}</p>
                  <p className="text-sm text-blue-700">Total Rows</p>
                </div>
                <div className="bg-white rounded-lg p-4 border border-green-200">
                  <p className="text-2xl font-bold text-green-600">{batchResult.processedRows}</p>
                  <p className="text-sm text-green-700">Processed</p>
                </div>
                <div className="bg-white rounded-lg p-4 border border-green-200">
                  <p className="text-2xl font-bold text-orange-600">{batchResult.skippedRows}</p>
                  <p className="text-sm text-orange-700">Skipped</p>
                </div>
                <div className="bg-white rounded-lg p-4 border border-green-200">
                  <p className="text-2xl font-bold text-red-600">{batchResult.failedRows}</p>
                  <p className="text-sm text-red-700">Failed</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="bg-white rounded-lg p-4 border border-green-200">
                  <p className="text-2xl font-bold text-green-600">{batchResult.validRows}</p>
                  <p className="text-sm text-green-700">Valid Rows</p>
                </div>
                <div className="bg-white rounded-lg p-4 border border-green-200">
                  <p className="text-2xl font-bold text-amber-600">{batchResult.invalidRows}</p>
                  <p className="text-sm text-amber-700">Invalid Rows</p>
                </div>
              </div>
              
              {/* Success Rate */}
              <div className="bg-white rounded-lg p-4 border border-green-200 mb-4">
                <p className="text-2xl font-bold text-green-600">
                  {batchResult.totalRows > 0 ? Math.round((batchResult.processedRows / batchResult.totalRows) * 100) : 0}%
                </p>
                <p className="text-sm text-green-700">Success Rate</p>
              </div>
              
              {/* Errors */}
              {batchResult.errors.length > 0 && (
                <div className="bg-white rounded-lg p-4 border border-red-200">
                  <h4 className="font-medium text-red-800 mb-2">Processing Errors:</h4>
                  <div className="max-h-48 overflow-y-auto">
                    <ul className="text-sm text-red-700 space-y-1">
                      {batchResult.errors.map((error, index) => (
                        <li key={index} className="border-b border-red-100 pb-1">
                          {error}
                        </li>
                      ))}
                    </ul>
                  </div>
                  {batchResult.hasMoreErrors && (
                    <p className="text-xs text-red-600 mt-2">
                      * Additional errors not shown. Check server logs for complete details.
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* CSV Format Guide */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-neutral-800 mb-4">
          {t('customerAssignmentUpload.guide.title')}
        </h3>
        
        <div className="space-y-4">
          <div>
            <h4 className="font-medium text-neutral-700 mb-2">
              {t('customerAssignmentUpload.guide.columns')}
            </h4>
            <div className="bg-neutral-50 rounded-lg p-4">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-neutral-200">
                    <th className="text-left py-2 font-medium">
                      {t('customerAssignmentUpload.guide.columnName')}
                    </th>
                    <th className="text-left py-2 font-medium">
                      {t('customerAssignmentUpload.guide.description')}
                    </th>
                    <th className="text-left py-2 font-medium">
                      {t('customerAssignmentUpload.guide.required')}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-neutral-100">
                    <td className="py-2 font-mono text-xs bg-neutral-100 rounded px-2">CIF</td>
                    <td className="py-2">Customer Identification Number</td>
                    <td className="py-2 text-red-600">Yes</td>
                  </tr>
                  <tr className="border-b border-neutral-100">
                    <td className="py-2 font-mono text-xs bg-neutral-100 rounded px-2">AssignedCallAgentName</td>
                    <td className="py-2">Name of the call agent to assign</td>
                    <td className="py-2 text-amber-600">Optional*</td>
                  </tr>
                  <tr>
                    <td className="py-2 font-mono text-xs bg-neutral-100 rounded px-2">AssignedFieldAgentName</td>
                    <td className="py-2">Name of the field agent to assign</td>
                    <td className="py-2 text-amber-600">Optional*</td>
                  </tr>
                </tbody>
              </table>
              <p className="text-xs text-amber-600 mt-2">
                * At least one agent name (call or field) must be provided per row
              </p>
            </div>
          </div>

          <div>
            <h4 className="font-medium text-neutral-700 mb-2">
              {t('customerAssignmentUpload.guide.example')}
            </h4>
            <div className="bg-neutral-900 text-green-400 rounded-lg p-4 font-mono text-sm overflow-x-auto">
              <div>CIF,AssignedCallAgentName,AssignedFieldAgentName</div>
              <div>CUST001,John Smith,Jane Doe</div>
              <div>CUST002,Alice Johnson,Bob Wilson</div>
              <div>CUST003,Carol Brown,</div>
              <div>CUST004,,David Lee</div>
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <h4 className="font-medium text-amber-800 mb-2">
              {t('customerAssignmentUpload.guide.notes')}
            </h4>
            <ul className="text-sm text-amber-700 space-y-1 list-disc list-inside">
              <li>{t('customerAssignmentUpload.guide.note1')}</li>
              <li>{t('customerAssignmentUpload.guide.note2')}</li>
              <li>{t('customerAssignmentUpload.guide.note3')}</li>
              <li>{t('customerAssignmentUpload.guide.note4')}</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default CustomerAssignmentUpload;