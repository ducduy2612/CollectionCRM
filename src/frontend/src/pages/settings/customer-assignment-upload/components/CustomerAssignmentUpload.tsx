import React, { useState, useRef } from 'react';
import { Card } from '../../../../components/ui/Card';
import { Button } from '../../../../components/ui/Button';
import { Alert } from '../../../../components/ui/Alert';
import { Spinner } from '../../../../components/ui/Spinner';
import { workflowApi } from '../../../../services/api/workflow.api';
import { useNamespacedTranslation } from '../../../../i18n/hooks/useTranslation';
import { 
  ArrowUpTrayIcon, 
  DocumentArrowDownIcon, 
  CheckCircleIcon, 
  ExclamationTriangleIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';

interface UploadResult {
  assignments: any[];
  count: number;
  processed: number;
}

interface UploadError {
  message: string;
  details?: string;
}

const CustomerAssignmentUpload: React.FC = () => {
  const { t } = useNamespacedTranslation('settings');
  const { t: tCommon } = useNamespacedTranslation('common');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [uploadError, setUploadError] = useState<UploadError | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleFileSelect = (file: File) => {
    // Validate file type
    if (!file.name.toLowerCase().endsWith('.csv')) {
      setUploadError({
        message: 'Invalid file type',
        details: 'Please select a CSV file (.csv)'
      });
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setUploadError({
        message: 'File too large',
        details: 'Please select a file smaller than 10MB'
      });
      return;
    }

    setSelectedFile(file);
    setUploadError(null);
    setUploadResult(null);
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

    setIsUploading(true);
    setUploadError(null);
    setUploadResult(null);

    try {
      const result = await workflowApi.createBulkAssignments(selectedFile);
      setUploadResult(result);
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Upload error:', error);
      setUploadError({
        message: 'Upload failed',
        details: error instanceof Error ? error.message : 'An unexpected error occurred'
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleClearFile = () => {
    setSelectedFile(null);
    setUploadError(null);
    setUploadResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
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

        {/* Template Download */}
        <div className="mb-6">
          <Button
            variant="secondary"
            onClick={downloadTemplate}
            className="flex items-center gap-2"
          >
            <DocumentArrowDownIcon className="w-4 h-4" />
            {t('customerAssignmentUpload.downloadTemplate')}
          </Button>
        </div>

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
                <Button onClick={handleUpload} disabled={isUploading}>
                  {isUploading ? (
                    <>
                      <Spinner size="sm" className="mr-2" />
                      {tCommon('uploading')}
                    </>
                  ) : (
                    tCommon('upload')
                  )}
                </Button>
                <Button variant="secondary" onClick={handleClearFile} disabled={isUploading}>
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

      {/* Upload Success */}
      {uploadResult && (
        <Card className="p-6 border-green-200 bg-green-50">
          <div className="flex items-start">
            <CheckCircleIcon className="w-6 h-6 text-green-500 mt-0.5 mr-3 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-green-800 mb-2">
                {t('customerAssignmentUpload.success.title')}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="bg-white rounded-lg p-4 border border-green-200">
                  <p className="text-2xl font-bold text-green-600">{uploadResult.processed}</p>
                  <p className="text-sm text-green-700">
                    {t('customerAssignmentUpload.success.processed')}
                  </p>
                </div>
                <div className="bg-white rounded-lg p-4 border border-green-200">
                  <p className="text-2xl font-bold text-green-600">{uploadResult.count}</p>
                  <p className="text-sm text-green-700">
                    {t('customerAssignmentUpload.success.created')}
                  </p>
                </div>
                <div className="bg-white rounded-lg p-4 border border-green-200">
                  <p className="text-2xl font-bold text-green-600">
                    {uploadResult.processed > 0 ? Math.round((uploadResult.count / uploadResult.processed) * 100) : 0}%
                  </p>
                  <p className="text-sm text-green-700">
                    {t('customerAssignmentUpload.success.successRate')}
                  </p>
                </div>
              </div>
              <p className="text-sm text-green-700">
                {t('customerAssignmentUpload.success.message')}
              </p>
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