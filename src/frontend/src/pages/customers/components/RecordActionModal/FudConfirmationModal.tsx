import React from 'react';
import { Modal } from '../../../../components/ui/Modal';
import { Button } from '../../../../components/ui/Button';
import { Input } from '../../../../components/ui/Input';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../../../components/ui/Table';
import { useTranslation } from '../../../../i18n/hooks/useTranslation';

interface FudConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  calculatedActions: any[];
  submitting: boolean;
  finalFudDate: string;
  onUpdateFinalFud: (newFudDate: string) => void;
}

export const FudConfirmationModal: React.FC<FudConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  calculatedActions,
  submitting,
  finalFudDate,
  onUpdateFinalFud
}) => {
  const { t } = useTranslation();

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('customers:record_action.confirm_fud_title')}
      description={t('customers:record_action.confirm_fud_description')}
      size="xl"
    >
      <div className="space-y-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            {t('customers:record_action.fud_calculated_explanation')}
          </p>
        </div>

        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('customers:record_action.loan_account')}</TableHead>
                <TableHead>{t('customers:record_action.action_result')}</TableHead>
                <TableHead>{t('customers:record_action.promise_date')}</TableHead>
                <TableHead>{t('customers:record_action.calculated_fud')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {calculatedActions.map((action) => (
                <TableRow key={action.loanAccountNumber}>
                  <TableCell className="font-medium">
                    {action.loanAccountNumber}
                  </TableCell>
                  <TableCell>
                    {/* Show action result name if available */}
                    {action.actionResultName || action.actionResultId}
                  </TableCell>
                  <TableCell>
                    {action.promiseDate || '-'}
                  </TableCell>
                  <TableCell>
                    <span className={action.calculatedFud !== action.originalFud ? 'text-blue-600 font-medium' : ''}>
                      {action.calculatedFud}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Single Final FUD Date for All Loans */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <h4 className="font-medium text-amber-900 mb-3">
            {t('customers:record_action.final_fud_all_loans')}
          </h4>
          <p className="text-sm text-amber-700 mb-4">
            {t('customers:record_action.final_fud_explanation')}
          </p>
          <div className="max-w-xs">
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              {t('customers:record_action.follow_up_date')}
            </label>
            <Input
              type="date"
              value={finalFudDate}
              onChange={(e) => onUpdateFinalFud(e.target.value)}
              className="w-full"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button
            variant="secondary"
            onClick={onClose}
            disabled={submitting}
          >
            {t('common:cancel')}
          </Button>
          <Button
            variant="primary"
            onClick={onConfirm}
            loading={submitting}
          >
            {t('customers:record_action.confirm_and_record')}
          </Button>
        </div>
      </div>
    </Modal>
  );
};