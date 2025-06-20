import React from 'react';
import { Select, SelectOption } from '../../../../components/ui/Select';
import { Input } from '../../../../components/ui/Input';
import { ActionType, ActionSubtype } from '../../types';
import { useTranslation } from '../../../../i18n/hooks/useTranslation';

interface ActionConfigurationSectionProps {
  actionTypes: ActionType[];
  actionSubtypes: ActionSubtype[];
  selectedActionTypeId: string;
  selectedActionSubtypeId: string;
  onActionTypeChange: (actionTypeId: string) => void;
  onActionSubtypeChange: (actionSubtypeId: string) => void;
}

export const ActionConfigurationSection: React.FC<ActionConfigurationSectionProps> = ({
  actionTypes,
  actionSubtypes,
  selectedActionTypeId,
  selectedActionSubtypeId,
  onActionTypeChange,
  onActionSubtypeChange
}) => {
  const { t } = useTranslation();

  const getActionTypeOptions = (): SelectOption[] => {
    return actionTypes.map(type => ({
      value: type.id,
      label: type.name
    }));
  };

  const getActionSubtypeOptions = (): SelectOption[] => {
    return actionSubtypes
      .filter(subtype => subtype.subtype_id && subtype.subtype_name)
      .map(subtype => ({
        value: subtype.subtype_id!,
        label: subtype.subtype_name!
      }));
  };

  return (
    <div className="bg-neutral-50 border rounded-lg p-4">
      <h4 className="font-medium text-neutral-900 mb-4">
        {t('customers:record_action.action_configuration')}
      </h4>
      <div className="grid grid-cols-2 gap-4">
        <Select
          label={t('customers:record_action.action_type')}
          options={getActionTypeOptions()}
          value={selectedActionTypeId}
          onChange={(e) => onActionTypeChange(e.target.value)}
          placeholder={t('customers:record_action.placeholders.select_action_type')}
        />
        <Select
          label={t('customers:record_action.action_subtype')}
          options={getActionSubtypeOptions()}
          value={selectedActionSubtypeId}
          onChange={(e) => onActionSubtypeChange(e.target.value)}
          placeholder={t('customers:record_action.placeholders.select_action_subtype')}
          disabled={!selectedActionTypeId}
        />
      </div>
    </div>
  );
};