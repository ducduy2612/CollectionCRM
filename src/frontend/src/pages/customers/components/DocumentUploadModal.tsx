import React, { useState, useRef, useCallback } from 'react';
import { DocumentType, DocumentCategory, UploadFormData } from '../../../types/document';
import { Loan } from '../types';
import { documentsApi } from '../../../services/api/documents.api';
import { useTranslation } from '../../../i18n/hooks/useTranslation';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import { Select } from '../../../components/ui/Select';
import { Input } from '../../../components/ui/Input';
import { Alert } from '../../../components/ui/Alert';
import { Spinner } from '../../../components/ui/Spinner';

interface DocumentUploadModalProps {
  cif: string;
  loans: Loan[];
  onClose: () => void;
  onSuccess: () => void;
}

const DocumentUploadModal: React.FC<DocumentUploadModalProps> = ({
  cif,
  loans,
  onClose,
  onSuccess,
}) => {
  const { t } = useTranslation(['customers', 'common', 'errors']);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState<UploadFormData>({
    files: [],
    documentType: DocumentType.OTHER,
    documentCategory: DocumentCategory.OTHER,
    loanAccountNumber: '',
    tags: [],
    metadata: {},
  });
  
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);

  // Allowed file types
  const allowedFileTypes = [
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/gif',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ];

  // Max file size (50MB)
  const maxFileSize = 50 * 1024 * 1024;

  // Validate file
  const validateFile = (file: File): string | null => {
    if (file.size > maxFileSize) {
      return t('customers:documents.upload.file_size_exceeded');
    }
    if (!allowedFileTypes.includes(file.type)) {
      return t('customers:documents.upload.invalid_file_type');
    }
    return null;
  };

  // Handle file selection
  const handleFileChange = (files: FileList | null) => {
    if (!files) return;
    
    const validFiles: File[] = [];
    const errors: string[] = [];
    
    Array.from(files).forEach(file => {
      const validationError = validateFile(file);
      if (validationError) {
        errors.push(`${file.name}: ${validationError}`);
      } else {
        validFiles.push(file);
      }
    });
    
    if (errors.length > 0) {
      setError(errors.join('\n'));
    } else {
      setError(null);
    }
    
    setFormData(prev => ({
      ...prev,
      files: [...prev.files, ...validFiles],
    }));
  };

  // Handle drag and drop
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files);
    }
  }, []);

  // Remove file
  const removeFile = (index: number) => {
    setFormData(prev => ({
      ...prev,
      files: prev.files.filter((_, i) => i !== index),
    }));
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.files.length === 0) {
      setError(t('customers:documents.upload.select_files'));
      return;
    }

    setUploading(true);
    setError(null);
    setUploadProgress(0);

    try {
      const uploadFormData = new FormData();
      
      // Add files
      formData.files.forEach(file => {
        uploadFormData.append('documents', file);
      });
      
      // Add metadata
      uploadFormData.append('cif', cif);
      uploadFormData.append('documentType', formData.documentType);
      uploadFormData.append('documentCategory', formData.documentCategory);
      
      if (formData.loanAccountNumber) {
        uploadFormData.append('loanAccountNumber', formData.loanAccountNumber);
      }
      
      if (formData.tags && formData.tags.length > 0) {
        uploadFormData.append('tags', JSON.stringify(formData.tags));
      }
      
      if (formData.metadata) {
        uploadFormData.append('metadata', JSON.stringify(formData.metadata));
      }

      const response = await documentsApi.upload(cif, uploadFormData);
      
      if (response.success) {
        onSuccess();
      } else {
        setError(response.message || t('customers:documents.upload.upload_error'));
      }
    } catch (err) {
      setError(t('customers:documents.upload.upload_error'));
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  // Format file size
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={t('customers:documents.upload_documents')}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <Alert variant="danger" title={t('errors:generic')}>
            {error}
          </Alert>
        )}

        {/* File Drop Zone */}
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            dragActive
              ? 'border-blue-500 bg-blue-50'
              : 'border-neutral-300 hover:border-neutral-400'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <div className="space-y-4">
            <div className="flex justify-center">
              <svg className="w-12 h-12 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            <div>
              <p className="text-lg font-medium text-neutral-900">
                {t('customers:documents.upload.drag_drop')}
              </p>
              <p className="text-neutral-500">
                {t('customers:documents.upload.browse')}
              </p>
            </div>
            <div className="text-sm text-neutral-500">
              <p>{t('customers:documents.upload.supported_formats')}</p>
              <p>{t('customers:documents.upload.max_size')}</p>
            </div>
            <Button
              type="button"
              variant="secondary"
              onClick={() => fileInputRef.current?.click()}
            >
              {t('common:browse_files')}
            </Button>
          </div>
        </div>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.jpg,.jpeg,.png,.gif,.doc,.docx,.xls,.xlsx"
          onChange={(e) => handleFileChange(e.target.files)}
          className="hidden"
        />

        {/* Selected files */}
        {formData.files.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-medium text-neutral-900">
              {t('common:selected_files')} ({formData.files.length})
            </h4>
            {formData.files.map((file, index) => (
              <div key={index} className="flex items-center gap-3 p-3 bg-neutral-50 rounded-lg">
                <div className="flex-1">
                  <p className="font-medium text-neutral-900">{file.name}</p>
                  <p className="text-sm text-neutral-500">{formatFileSize(file.size)}</p>
                </div>
                <Button
                  type="button"
                  variant="danger"
                  size="sm"
                  onClick={() => removeFile(index)}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </Button>
              </div>
            ))}
          </div>
        )}

        {/* Form fields */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              {t('customers:documents.upload.select_type')} *
            </label>
            <Select
              value={formData.documentType}
              onChange={(e) => setFormData(prev => ({ ...prev, documentType: e.target.value as DocumentType }))}
              required
              options={Object.values(DocumentType).map(type => ({
                value: type,
                label: t(`customers:documents.document_types.${type}`)
              }))}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              {t('customers:documents.upload.select_category')} *
            </label>
            <Select
              value={formData.documentCategory}
              onChange={(e) => setFormData(prev => ({ ...prev, documentCategory: e.target.value as DocumentCategory }))}
              required
              options={Object.values(DocumentCategory).map(category => ({
                value: category,
                label: t(`customers:documents.document_categories.${category}`)
              }))}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">
            {t('customers:documents.upload.optional_loan')}
          </label>
          <Select
            value={formData.loanAccountNumber || ''}
            onChange={(e) => setFormData(prev => ({ ...prev, loanAccountNumber: e.target.value }))}
            options={[
              { value: '', label: t('common:select_option') },
              ...loans.map(loan => ({
                value: loan.accountNumber,
                label: `${loan.accountNumber} - ${loan.productType}`
              }))
            ]}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">
            {t('customers:documents.upload.tags')}
          </label>
          <Input
            type="text"
            placeholder={t('common:enter_tags')}
            onChange={(e) => {
              const tags = e.target.value.split(',').map(tag => tag.trim()).filter(tag => tag);
              setFormData(prev => ({ ...prev, tags }));
            }}
          />
          <p className="text-sm text-neutral-500 mt-1">
            {t('common:separate_with_commas')}
          </p>
        </div>

        {/* Upload progress */}
        {uploading && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Spinner size="sm" />
              <span className="text-sm text-neutral-600">
                {t('customers:documents.upload.uploading')}
              </span>
            </div>
            <div className="w-full bg-neutral-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-3 pt-4">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={uploading}
          >
            {t('common:cancel')}
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={uploading || formData.files.length === 0}
            className="flex items-center gap-2"
          >
            {uploading && <Spinner size="sm" />}
            {t('customers:documents.actions.upload')}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default DocumentUploadModal;