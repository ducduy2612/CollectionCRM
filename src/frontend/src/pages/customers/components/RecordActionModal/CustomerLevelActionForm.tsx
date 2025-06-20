import React from 'react';
import { Select, SelectOption } from '../../../../components/ui/Select';
import { Input } from '../../../../components/ui/Input';
import { Button } from '../../../../components/ui/Button';
import { ActionResult } from '../../types';
import { useTranslation } from '../../../../i18n/hooks/useTranslation';

interface CustomerLevelActionFormProps {
  actionResults: ActionResult[];
  selectedActionSubtypeId: string;
  customerLevelAction: {
    actionResultId: string;
    fUpdate: string;
    promiseAmount: string;
    promiseDate: string;
    notes: string;
  };
  onFieldChange: (field: string, value: string) => void;
  onApplyToAllLoans: () => void;
  isPromiseToPayResult: boolean;
}

export const CustomerLevelActionForm: React.FC<CustomerLevelActionFormProps> = ({
  actionResults,
  selectedActionSubtypeId,
  customerLevelAction,
  onFieldChange,
  onApplyToAllLoans,
  isPromiseToPayResult
}) => {
  const { t } = useTranslation();

  const getActionResultOptions = (): SelectOption[] => {
    return actionResults
      .filter(result => result.result_id && result.result_name)
      .map(result => ({
        value: result.result_id!,
        label: result.result_name!
      }));
  };

  return (
    <div className="space-y-6">
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <h4 className="font-medium text-amber-900 mb-3">
          {t('customers:record_action.customer_level_form_title')}
        </h4>
        <p className="text-sm text-amber-700 mb-4">
          {t('customers:record_action.customer_level_form_description')}
        </p>
        
        <div className="grid grid-cols-1 gap-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              {t('customers:record_action.action_result')}
            </label>
            <Select
              options={getActionResultOptions()}
              value={customerLevelAction.actionResultId}
              onChange={(e) => onFieldChange('actionResultId', e.target.value)}
              placeholder={t('customers:record_action.placeholders.select_result')}
              disabled={!selectedActionSubtypeId}
            />
          </div>
          
          {isPromiseToPayResult && (
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  {t('customers:record_action.promise_date')}
                </label>
                <Input
                  type="date"
                  value={customerLevelAction.promiseDate}
                  onChange={(e) => onFieldChange('promiseDate', e.target.value)}
                />
              </div>
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              {t('customers:record_action.notes')}
            </label>
            <Input
              type="text"
              value={customerLevelAction.notes}
              onChange={(e) => onFieldChange('notes', e.target.value)}
              placeholder={t('customers:record_action.placeholders.enter_notes')}
            />
          </div>
        </div>
        
        <div className="mt-4 pt-4 border-t border-amber-200">
          <Button
            variant="primary"
            onClick={onApplyToAllLoans}
            disabled={!customerLevelAction.actionResultId}
            className="w-full"
          >
            {t('customers:record_action.apply_to_all_loans')}
          </Button>
        </div>
      </div>
    </div>
  );
};