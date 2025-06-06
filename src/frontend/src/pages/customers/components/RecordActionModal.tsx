import React from 'react';
import { Modal } from '../../../components/ui/Modal';
import { Spinner } from '../../../components/ui/Spinner';
import { Alert } from '../../../components/ui/Alert';
import { Customer, Loan } from '../types';
import { useTranslation } from '../../../i18n/hooks/useTranslation';
import {
  useRecordActionModal,
  ActionConfigurationSection,
  LoansTable,
  GlobalNotesSection,
  RecordActionModalFooter
} from './RecordActionModal/';

interface RecordActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: Customer;
  loans: Loan[];
  onSuccess?: () => void;
}

const RecordActionModal: React.FC<RecordActionModalProps> = ({
  isOpen,
  onClose,
  customer,
  loans,
  onSuccess
}) => {
  const { t } = useTranslation();
  
  const {
    // State
    actionTypes,
    actionSubtypes,
    actionResults,
    selectedActionTypeId,
    selectedActionSubtypeId,
    loanActions,
    globalNotes,
    applyGlobalNotes,
    loading,
    submitting,
    error,
    selectedCount,
    allSelected,
    someSelected,
    
    // Setters
    setGlobalNotes,
    setApplyGlobalNotes,
    
    // Handlers
    handleActionTypeChange,
    handleActionSubtypeChange,
    handleActionResultChange,
    handleFieldChange,
    handleSelectAll,
    handleSubmit,
    
    // Utilities
    isPromiseToPayResult
  } = useRecordActionModal({ isOpen, customer, loans });

  const onSubmitHandler = () => {
    handleSubmit(onSuccess, onClose);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('customers:record_action.title')}
      description={t('customers:record_action.description', {
        replace: { name: customer.name, cif: customer.cif }
      })}
      size="full"
    >
      <div className="space-y-6">
        {error && (
          <Alert variant="danger">
            {error}
          </Alert>
        )}

        {loading ? (
          <div className="flex justify-center py-8">
            <Spinner size="lg" />
          </div>
        ) : (
          <>
            {/* Customer-level Action Type and SubType Selection */}
            <ActionConfigurationSection
              actionTypes={actionTypes}
              actionSubtypes={actionSubtypes}
              selectedActionTypeId={selectedActionTypeId}
              selectedActionSubtypeId={selectedActionSubtypeId}
              onActionTypeChange={handleActionTypeChange}
              onActionSubtypeChange={handleActionSubtypeChange}
            />

            {/* Loans Table */}
            <LoansTable
              loans={loans}
              loanActions={loanActions}
              actionResults={actionResults}
              selectedActionSubtypeId={selectedActionSubtypeId}
              allSelected={allSelected}
              someSelected={someSelected}
              onSelectAll={handleSelectAll}
              onFieldChange={handleFieldChange}
              onActionResultChange={handleActionResultChange}
              isPromiseToPayResult={isPromiseToPayResult}
            />

            {/* Global Notes Section */}
            <GlobalNotesSection
              globalNotes={globalNotes}
              applyGlobalNotes={applyGlobalNotes}
              onGlobalNotesChange={setGlobalNotes}
              onApplyGlobalNotesChange={setApplyGlobalNotes}
            />
          </>
        )}
      </div>

      <RecordActionModalFooter
        loading={loading}
        submitting={submitting}
        selectedCount={selectedCount}
        onClose={onClose}
        onSubmit={onSubmitHandler}
      />
    </Modal>
  );
};

export default RecordActionModal;