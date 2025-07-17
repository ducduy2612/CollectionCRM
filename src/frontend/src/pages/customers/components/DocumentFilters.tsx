import React from 'react';
import { DocumentFilters as IDocumentFilters, DocumentType, DocumentCategory } from '../../../types/document';
import { Loan } from '../types';
import { useTranslation } from '../../../i18n/hooks/useTranslation';
import { Select } from '../../../components/ui/Select';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';

interface DocumentFiltersProps {
  filters: IDocumentFilters;
  onFiltersChange: (filters: IDocumentFilters) => void;
  loans: Loan[];
}

const DocumentFilters: React.FC<DocumentFiltersProps> = ({
  filters,
  onFiltersChange,
  loans,
}) => {
  const { t } = useTranslation(['customers', 'common']);

  // Update filter
  const updateFilter = (key: keyof IDocumentFilters, value: string) => {
    onFiltersChange({
      ...filters,
      [key]: value || undefined,
    });
  };

  // Clear all filters
  const clearFilters = () => {
    onFiltersChange({});
  };

  // Check if any filters are active
  const hasActiveFilters = Object.values(filters).some(value => value && value.length > 0);

  return (
    <div className="bg-white border border-neutral-200 rounded-lg p-4 space-y-4">
      <div className="flex items-center gap-4 flex-wrap">
        {/* Document Type Filter */}
        <div className="min-w-[200px]">
          <label className="block text-sm font-medium text-neutral-700 mb-1">
            {t('customers:documents.filters.document_type')}
          </label>
          <Select
            value={filters.documentType || ''}
            onChange={(e) => updateFilter('documentType', e.target.value)}
            options={[
              { value: '', label: t('common:all') },
              ...Object.values(DocumentType).map(type => ({
                value: type,
                label: t(`customers:documents.document_types.${type}`)
              }))
            ]}
          />
        </div>

        {/* Document Category Filter */}
        <div className="min-w-[200px]">
          <label className="block text-sm font-medium text-neutral-700 mb-1">
            {t('customers:documents.filters.document_category')}
          </label>
          <Select
            value={filters.documentCategory || ''}
            onChange={(e) => updateFilter('documentCategory', e.target.value)}
            options={[
              { value: '', label: t('common:all') },
              ...Object.values(DocumentCategory).map(category => ({
                value: category,
                label: t(`customers:documents.document_categories.${category}`)
              }))
            ]}
          />
        </div>

        {/* Loan Account Filter */}
        <div className="min-w-[200px]">
          <label className="block text-sm font-medium text-neutral-700 mb-1">
            {t('customers:documents.filters.loan_account')}
          </label>
          <Select
            value={filters.loanAccountNumber || ''}
            onChange={(e) => updateFilter('loanAccountNumber', e.target.value)}
            options={[
              { value: '', label: t('common:all') },
              ...loans.map(loan => ({
                value: loan.accountNumber,
                label: `${loan.accountNumber} - ${loan.productType}`
              }))
            ]}
          />
        </div>

      </div>

      {/* Clear Filters Button */}
      {hasActiveFilters && (
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-end">
            <Button
              variant="secondary"
              onClick={clearFilters}
              className="flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              {t('customers:documents.filters.clear_filters')}
            </Button>
          </div>
        </div>
      )}

      {/* Active Filters Summary */}
      {hasActiveFilters && (
        <div className="pt-3 border-t border-neutral-200">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium text-neutral-700">
              {t('common:active_filters')}:
            </span>
            {filters.documentType && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                {t('customers:documents.filters.document_type')}: {t(`customers:documents.document_types.${filters.documentType}`)}
              </span>
            )}
            {filters.documentCategory && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                {t('customers:documents.filters.document_category')}: {t(`customers:documents.document_categories.${filters.documentCategory}`)}
              </span>
            )}
            {filters.loanAccountNumber && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                {t('customers:documents.filters.loan_account')}: {filters.loanAccountNumber}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentFilters;