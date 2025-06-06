import React from 'react';
import { Input } from '../../../../components/ui/Input';
import { useTranslation } from '../../../../i18n/hooks/useTranslation';

interface GlobalNotesSectionProps {
  globalNotes: string;
  applyGlobalNotes: boolean;
  onGlobalNotesChange: (notes: string) => void;
  onApplyGlobalNotesChange: (apply: boolean) => void;
}

export const GlobalNotesSection: React.FC<GlobalNotesSectionProps> = ({
  globalNotes,
  applyGlobalNotes,
  onGlobalNotesChange,
  onApplyGlobalNotesChange
}) => {
  const { t } = useTranslation();

  return (
    <div className="border rounded-lg p-4 bg-neutral-50">
      <h4 className="font-medium text-neutral-900 mb-3">
        {t('customers:record_action.global_notes')}
      </h4>
      <div className="space-y-3">
        <Input
          type="text"
          value={globalNotes}
          onChange={(e) => onGlobalNotesChange(e.target.value)}
          placeholder={t('customers:record_action.placeholders.enter_global_notes')}
        />
        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={applyGlobalNotes}
            onChange={(e) => onApplyGlobalNotesChange(e.target.checked)}
            className="rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
          />
          <span className="text-sm text-neutral-700">
            {t('customers:record_action.apply_global_notes')}
          </span>
        </label>
      </div>
    </div>
  );
};