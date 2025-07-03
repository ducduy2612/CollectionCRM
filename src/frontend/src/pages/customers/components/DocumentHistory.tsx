import React, { useState, useEffect } from 'react';
import { Document, DocumentFilters as IDocumentFilters, DocumentType, DocumentCategory } from '../../../types/document';
import { Loan } from '../types';
import { documentsApi } from '../../../services/api/documents.api';
import { useTranslation } from '../../../i18n/hooks/useTranslation';
import { Spinner } from '../../../components/ui/Spinner';
import { Button } from '../../../components/ui/Button';
import { Alert } from '../../../components/ui/Alert';
import DocumentCard from './DocumentCard';
import DocumentUploadModal from './DocumentUploadModal';
import DocumentViewModal from './DocumentViewModal';
import DocumentFiltersComponent from './DocumentFilters';

interface DocumentHistoryProps {
  cif: string;
  loans: Loan[];
  className?: string;
}

const DocumentHistory: React.FC<DocumentHistoryProps> = ({ cif, loans, className = '' }) => {
  const { t } = useTranslation(['customers', 'common', 'errors']);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<IDocumentFilters>({});
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);

  // Fetch documents
  const fetchDocuments = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await documentsApi.getByCustomer(cif, filters);
      if (response.data.success) {
        setDocuments(response.data.data || []);
      } else {
        setError(response.data.message || t('errors:generic'));
      }
    } catch (err) {
      setError(t('errors:generic'));
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchDocuments();
  }, [cif, filters]);

  // Handle document upload success
  const handleUploadSuccess = () => {
    setUploadModalOpen(false);
    fetchDocuments();
  };

  // Handle document view
  const handleViewDocument = (document: Document) => {
    setSelectedDocument(document);
    setViewModalOpen(true);
  };

  // Handle document download
  const handleDownloadDocument = async (document: Document) => {
    try {
      const blob = await documentsApi.download(document.id);
      const url = window.URL.createObjectURL(blob);
      const link = window.document.createElement('a');
      link.href = url;
      link.download = document.originalFileName;
      window.document.body.appendChild(link);
      link.click();
      window.document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(t('customers:documents.download_error'));
    }
  };

  // Handle document delete
  const handleDeleteDocument = async (documentId: string) => {
    if (!window.confirm(t('customers:documents.confirm_delete'))) {
      return;
    }

    try {
      await documentsApi.delete(documentId);
      setDocuments(documents.filter(doc => doc.id !== documentId));
    } catch (err) {
      setError(t('customers:documents.delete_error'));
    }
  };

  // Group documents by type
  const customerDocuments = documents.filter(doc => !doc.loanAccountNumber);
  const loanDocumentsByAccount = documents
    .filter(doc => doc.loanAccountNumber)
    .reduce((acc, doc) => {
      const key = doc.loanAccountNumber!;
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(doc);
      return acc;
    }, {} as Record<string, Document[]>);

  if (loading) {
    return (
      <div className={`flex items-center justify-center py-8 ${className}`}>
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {error && (
        <Alert variant="danger" title={t('errors:generic')}>
          {error}
        </Alert>
      )}

      {/* Header and Controls */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-neutral-900">
          {t('customers:documents.title')}
        </h2>
        <Button
          onClick={() => setUploadModalOpen(true)}
          variant="primary"
          className="flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          {t('customers:documents.upload_documents')}
        </Button>
      </div>

      {/* Filters */}
      <DocumentFiltersComponent
        filters={filters}
        onFiltersChange={setFilters}
        loans={loans}
      />

      {/* Customer Documents */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-medium text-neutral-900">
            {t('customers:documents.customer_documents')}
          </h3>
          <span className="text-sm text-neutral-500">
            ({customerDocuments.length})
          </span>
        </div>
        
        {customerDocuments.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {customerDocuments.map((document) => (
              <DocumentCard
                key={document.id}
                document={document}
                onView={() => handleViewDocument(document)}
                onDownload={() => handleDownloadDocument(document)}
                onDelete={() => handleDeleteDocument(document.id)}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-neutral-500">
            {t('customers:documents.no_documents')}
          </div>
        )}
      </div>

      {/* Loan Documents */}
      {Object.keys(loanDocumentsByAccount).length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-neutral-900">
            {t('customers:documents.loan_documents')}
          </h3>
          
          {Object.entries(loanDocumentsByAccount).map(([loanAccountNumber, loanDocuments]) => {
            const loan = loans.find(l => l.accountNumber === loanAccountNumber);
            return (
              <div key={loanAccountNumber} className="border border-neutral-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <h4 className="font-medium text-neutral-900">
                    {loan?.productType || t('customers:fields.loan_account')}: {loanAccountNumber}
                  </h4>
                  <span className="text-sm text-neutral-500">
                    ({loanDocuments.length})
                  </span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {loanDocuments.map((document) => (
                    <DocumentCard
                      key={document.id}
                      document={document}
                      onView={() => handleViewDocument(document)}
                      onDownload={() => handleDownloadDocument(document)}
                      onDelete={() => handleDeleteDocument(document.id)}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Upload Modal */}
      {uploadModalOpen && (
        <DocumentUploadModal
          cif={cif}
          loans={loans}
          onClose={() => setUploadModalOpen(false)}
          onSuccess={handleUploadSuccess}
        />
      )}

      {/* View Modal */}
      {viewModalOpen && selectedDocument && (
        <DocumentViewModal
          document={selectedDocument}
          onClose={() => setViewModalOpen(false)}
          onDownload={() => handleDownloadDocument(selectedDocument)}
          onDelete={() => handleDeleteDocument(selectedDocument.id)}
        />
      )}
    </div>
  );
};

export default DocumentHistory;