import React from 'react';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../../../components/ui/Table';
import { Select, SelectOption } from '../../../../components/ui/Select';
import { Input } from '../../../../components/ui/Input';
import { Loan, ActionResult } from '../../types';
import { LoanActionData } from './useRecordActionModal';
import { useTranslation } from '../../../../i18n/hooks/useTranslation';

interface LoansTableProps {
  loans: Loan[];
  loanActions: { [key: string]: LoanActionData };
  actionResults: ActionResult[];
  selectedActionSubtypeId: string;
  allSelected: boolean;
  someSelected: boolean;
  onSelectAll: (checked: boolean) => void;
  onFieldChange: (loanAccountNumber: string, field: keyof LoanActionData, value: string | boolean) => void;
  onActionResultChange: (loanAccountNumber: string, actionResultId: string) => void;
  isPromiseToPayResult: (loanAccountNumber: string) => boolean;
}

export const LoansTable: React.FC<LoansTableProps> = ({
  loans,
  loanActions,
  actionResults,
  selectedActionSubtypeId,
  allSelected,
  someSelected,
  onSelectAll,
  onFieldChange,
  onActionResultChange,
  isPromiseToPayResult
}) => {
  const { t } = useTranslation();

  const getActionResultOptions = (): SelectOption[] => {
    return actionResults.map(result => ({
      value: result.result_id,
      label: result.result_name
    }));
  };

  return (
    <div className="border rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">
              <input
                type="checkbox"
                checked={allSelected}
                ref={input => {
                  if (input) input.indeterminate = someSelected;
                }}
                onChange={(e) => onSelectAll(e.target.checked)}
                className="rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
              />
            </TableHead>
            <TableHead>{t('customers:record_action.loan_account')}</TableHead>
            <TableHead>{t('customers:record_action.due_amount')}</TableHead>
            <TableHead>{t('customers:record_action.dpd')}</TableHead>
            <TableHead>{t('customers:record_action.action_result')}</TableHead>
            <TableHead>{t('customers:record_action.promise_amount')}</TableHead>
            <TableHead>{t('customers:record_action.promise_date')}</TableHead>
            <TableHead>{t('customers:record_action.notes')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loans.map((loan) => {
            const action = loanActions[loan.accountNumber];
            const isPromiseToPay = isPromiseToPayResult(loan.accountNumber);
            
            return (
              <TableRow key={loan.accountNumber}>
                <TableCell>
                  <input
                    type="checkbox"
                    checked={action?.selected || false}
                    onChange={(e) => onFieldChange(loan.accountNumber, 'selected', e.target.checked)}
                    className="rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
                  />
                </TableCell>
                <TableCell className="font-medium">{loan.accountNumber}</TableCell>
                <TableCell>
                  ${typeof loan.dueAmount === 'string' 
                    ? parseFloat(loan.dueAmount).toLocaleString() 
                    : loan.dueAmount.toLocaleString()}
                </TableCell>
                <TableCell>{loan.dpd}</TableCell>
                <TableCell>
                  <Select
                    options={getActionResultOptions()}
                    value={action?.actionResultId || ''}
                    onChange={(e) => onActionResultChange(loan.accountNumber, e.target.value)}
                    placeholder={t('customers:record_action.placeholders.select_result')}
                    disabled={!selectedActionSubtypeId}
                    className="min-w-[150px]"
                  />
                </TableCell>
                <TableCell>
                  <Input
                    type="number"
                    step="0.01"
                    value={action?.promiseAmount || ''}
                    onChange={(e) => onFieldChange(loan.accountNumber, 'promiseAmount', e.target.value)}
                    disabled={!isPromiseToPay}
                    placeholder={isPromiseToPay 
                      ? (typeof loan.dueAmount === 'string' 
                        ? parseFloat(loan.dueAmount).toLocaleString() 
                        : loan.dueAmount.toLocaleString())
                      : t('customers:record_action.placeholders.na')}
                    className="min-w-[120px]"
                  />
                </TableCell>
                <TableCell>
                  <Input
                    type="date"
                    value={action?.promiseDate || ''}
                    onChange={(e) => onFieldChange(loan.accountNumber, 'promiseDate', e.target.value)}
                    disabled={!isPromiseToPay}
                    placeholder={isPromiseToPay 
                      ? t('customers:record_action.placeholders.required') 
                      : t('customers:record_action.placeholders.na')}
                    className="min-w-[140px]"
                  />
                </TableCell>
                <TableCell>
                  <Input
                    type="text"
                    value={action?.notes || ''}
                    onChange={(e) => onFieldChange(loan.accountNumber, 'notes', e.target.value)}
                    placeholder={t('customers:record_action.placeholders.enter_notes')}
                    className="min-w-[200px]"
                  />
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};