import React from 'react';
import { Document } from '../../../types/document';
import { useTranslation } from '../../../i18n/hooks/useTranslation';
import { Button } from '../../../components/ui/Button';

interface DocumentCardProps {
  document: Document;
  onView: () => void;
  onDownload: () => void;
  onDelete: () => void;
}

const DocumentCard: React.FC<DocumentCardProps> = ({
  document,
  onView,
  onDownload,
  onDelete,
}) => {
  const { t } = useTranslation(['customers', 'common']);

  // Get file type icon
  const getFileIcon = (mimeType: string) => {
    if (mimeType.includes('pdf')) {
      return (
        <svg className="w-6 h-6 text-red-500" fill="currentColor" viewBox="0 0 24 24">
          <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
        </svg>
      );
    }
    if (mimeType.includes('image')) {
      return (
        <svg className="w-6 h-6 text-blue-500" fill="currentColor" viewBox="0 0 24 24">
          <path d="M8.5,13.5L11,16.5L14.5,12L19,18H5M21,19V5C21,3.89 20.1,3 19,3H5A2,2 0 0,0 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19Z" />
        </svg>
      );
    }
    if (mimeType.includes('word') || mimeType.includes('document')) {
      return (
        <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
          <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
        </svg>
      );
    }
    if (mimeType.includes('sheet') || mimeType.includes('excel')) {
      return (
        <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 24 24">
          <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
        </svg>
      );
    }
    // Default file icon
    return (
      <svg className="w-6 h-6 text-neutral-500" fill="currentColor" viewBox="0 0 24 24">
        <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
      </svg>
    );
  };

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
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="border border-neutral-200 rounded-lg p-3 hover:shadow-md transition-shadow bg-white">
      {/* Header with icon and name */}
      <div className="flex items-start gap-2 mb-2">
        <div className="flex-shrink-0">
          {getFileIcon(document.mimeType)}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-neutral-900 truncate">
            {document.originalFileName}
          </h4>
          <p className="text-sm text-neutral-500">
            {t(`customers:documents.document_types.${document.documentType}`)}
          </p>
        </div>
      </div>

      {/* File info */}
      <div className="text-sm text-neutral-500 mb-3">
        <p>
          {formatFileSize(document.fileSize)} • {formatDate(document.createdAt)}
        </p>
        <p className="truncate">
          {t('common:uploaded_by')}: {document.uploadedByAgent?.name || document.uploadedBy}
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <Button
          variant="secondary"
          size="sm"
          onClick={onView}
          className="flex-1"
        >
          {t('customers:documents.actions.view')}
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={onDownload}
          className="flex-1"
        >
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          {t('customers:documents.actions.download')}
        </Button>
        <Button
          variant="danger"
          size="sm"
          onClick={onDelete}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </Button>
      </div>
    </div>
  );
};

export default DocumentCard;