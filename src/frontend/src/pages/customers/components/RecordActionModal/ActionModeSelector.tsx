import React from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../../../components/ui/Tabs';
import { useTranslation } from '../../../../i18n/hooks/useTranslation';

export type ActionMode = 'loan-level' | 'customer-level';

interface ActionModeSelectorProps {
  mode: ActionMode;
  onModeChange: (mode: ActionMode) => void;
  children: React.ReactNode;
}

export const ActionModeSelector: React.FC<ActionModeSelectorProps> = ({
  mode,
  onModeChange,
  children
}) => {
  const { t } = useTranslation();

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
      <h4 className="font-medium text-blue-900 mb-4">
        {t('customers:record_action.action_mode')}
      </h4>
      
      <Tabs defaultValue="loan-level" value={mode} onValueChange={(value) => onModeChange(value as ActionMode)}>
        <TabsList className="bg-white border border-blue-200 rounded-md p-1 mb-4">
          <TabsTrigger value="loan-level" className="flex-1 text-center">
            <div>
              <div className="font-medium">{t('customers:record_action.loan_level_mode')}</div>
              <div className="text-xs text-neutral-500 mt-1">
                {t('customers:record_action.loan_level_mode_description')}
              </div>
            </div>
          </TabsTrigger>
          <TabsTrigger value="customer-level" className="flex-1 text-center">
            <div>
              <div className="font-medium">{t('customers:record_action.customer_level_mode')}</div>
              <div className="text-xs text-neutral-500 mt-1">
                {t('customers:record_action.customer_level_mode_description')}
              </div>
            </div>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="loan-level">
          {children}
        </TabsContent>
        
        <TabsContent value="customer-level">
          {children}
        </TabsContent>
      </Tabs>
    </div>
  );
};