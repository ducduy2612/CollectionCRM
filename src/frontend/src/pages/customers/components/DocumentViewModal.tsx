import React from 'react';
import { Document } from '../../../types/document';
import { useTranslation } from '../../../i18n/hooks/useTranslation';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';

interface DocumentViewModalProps {
  document: Document;
  onClose: () => void;
  onDownload: () => void;
  onDelete: () => void;
}

const DocumentViewModal: React.FC<DocumentViewModalProps> = ({
  document,
  onClose,
  onDownload,
  onDelete,
}) => {
  const { t } = useTranslation(['customers', 'common']);

  // Format file size
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PROCESSED':
        return 'success';
      case 'PENDING':
        return 'warning';
      case 'FAILED':
        return 'danger';
      default:
        return 'neutral';
    }
  };

  // Get file type icon
  const getFileIcon = (mimeType: string) => {
    if (mimeType.includes('pdf')) {
      return (
        <svg className="w-16 h-16 text-red-500" fill="currentColor" viewBox="0 0 24 24">
          <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
        </svg>
      );
    }
    if (mimeType.includes('image')) {
      return (
        <svg className="w-16 h-16 text-blue-500" fill="currentColor" viewBox="0 0 24 24">
          <path d="M8.5,13.5L11,16.5L14.5,12L19,18H5M21,19V5C21,3.89 20.1,3 19,3H5A2,2 0 0,0 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19Z" />
        </svg>
      );
    }
    if (mimeType.includes('word') || mimeType.includes('document')) {
      return (
        <svg className="w-16 h-16 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
          <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
        </svg>
      );
    }
    if (mimeType.includes('sheet') || mimeType.includes('excel')) {
      return (
        <svg className="w-16 h-16 text-green-600" fill="currentColor" viewBox="0 0 24 24">
          <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
        </svg>
      );
    }
    // Default file icon
    return (
      <svg className="w-16 h-16 text-neutral-500" fill="currentColor" viewBox="0 0 24 24">
        <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
      </svg>
    );
  };

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={t('customers:documents.actions.view')}
      size="lg"
    >
      <div className="space-y-6">
        {/* Document header */}
        <div className="text-center">
          <div className="flex justify-center mb-4">
            {getFileIcon(document.mimeType)}
          </div>
          <h3 className="text-xl font-semibold text-neutral-900 mb-2">
            {document.originalFileName}
          </h3>
          <Badge variant={getStatusColor(document.status)}>
            {t(`customers:documents.status.${document.status}`)}
          </Badge>
        </div>

        {/* Document details */}
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                {t('customers:documents.filters.document_type')}
              </label>
              <p className="text-sm text-neutral-900">
                {t(`customers:documents.document_types.${document.documentType}`)}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                {t('customers:documents.filters.document_category')}
              </label>
              <p className="text-sm text-neutral-900">
                {t(`customers:documents.document_categories.${document.documentCategory}`)}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                {t('common:file_size')}
              </label>
              <p className="text-sm text-neutral-900">
                {formatFileSize(document.fileSize)}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                {t('common:file_type')}
              </label>
              <p className="text-sm text-neutral-900">
                {document.mimeType}
              </p>
            </div>
          </div>

          {document.loanAccountNumber && (
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                {t('customers:documents.filters.loan_account')}
              </label>
              <p className="text-sm text-neutral-900">
                {document.loanAccountNumber}
              </p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                {t('common:uploaded_by')}
              </label>
              <p className="text-sm text-neutral-900">
                {document.uploadedByAgent?.name || document.uploadedBy}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                {t('common:uploaded_at')}
              </label>
              <p className="text-sm text-neutral-900">
                {formatDate(document.createdAt)}
              </p>
            </div>
          </div>

          {document.tags && document.tags.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                {t('customers:documents.upload.tags')}
              </label>
              <div className="flex flex-wrap gap-2">
                {document.tags.map((tag, index) => (
                  <Badge key={index} variant="secondary">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {document.metadata && Object.keys(document.metadata).length > 0 && (
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                {t('common:metadata')}
              </label>
              <div className="bg-neutral-50 p-3 rounded-lg">
                <pre className="text-sm text-neutral-900 whitespace-pre-wrap">
                  {JSON.stringify(document.metadata, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 pt-4 border-t border-neutral-200">
          <Button
            variant="secondary"
            onClick={onClose}
            className="flex-1"
          >
            {t('common:close')}
          </Button>
          <Button
            variant="primary"
            onClick={onDownload}
            className="flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            {t('customers:documents.actions.download')}
          </Button>
          <Button
            variant="danger"
            onClick={() => {
              onDelete();
              onClose();
            }}
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            {t('customers:documents.actions.delete')}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default DocumentViewModal;