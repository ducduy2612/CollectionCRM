import React from 'react';
import { Input } from '../../../../components/ui/Input';
import { Select } from '../../../../components/ui/Select';
import { Spinner } from '../../../../components/ui/Spinner';
import { useTranslation } from '../../../../i18n/hooks/useTranslation';
import { PhoneType } from '../../../../services/api/bank.api';
import ContactFormWithCheckboxes from './ContactFormWithCheckboxes';

interface PhoneFormProps {
  formData: {
    number: string;
    type: string;
    isPrimary?: boolean;
    isVerified?: boolean;
  };
  errors: Record<string, string>;
  phoneTypes: PhoneType[];
  phoneTypesLoading: boolean;
  onChange: (field: string, value: any) => void;
  showCheckboxes?: boolean;
}

const PhoneForm: React.FC<PhoneFormProps> = ({
  formData,
  errors,
  phoneTypes,
  phoneTypesLoading,
  onChange,
  showCheckboxes = false
}) => {
  const { t } = useTranslation(['customers', 'forms']);

  const formContent = (
    <>
      <div className="mb-4">
        <label className="block text-sm font-medium text-neutral-700 mb-2">
          {t('customers:fields.phone_type')} *
        </label>
        {phoneTypesLoading ? (
          <div className="flex items-center justify-center py-2">
            <Spinner size="sm" />
            <span className="ml-2 text-sm text-neutral-600">Loading phone types...</span>
          </div>
        ) : (
          <Select
            value={formData.type || (phoneTypes.length > 0 ? phoneTypes[0].value : 'mobile1')}
            onChange={(e) => onChange('type', e.target.value)}
            options={phoneTypes.map(type => ({
              value: type.value,
              label: type.label
            }))}
            error={errors.type}
            disabled={phoneTypesLoading || phoneTypes.length === 0}
          />
        )}
        {phoneTypes.length === 0 && !phoneTypesLoading && (
          <p className="text-xs text-red-600 mt-1">Failed to load phone types. Please try again.</p>
        )}
      </div>
      <div className="mb-4">
        <label className="block text-sm font-medium text-neutral-700 mb-2">
          {t('customers:fields.phone_number')} *
        </label>
        <Input
          type="tel"
          value={formData.number || ''}
          onChange={(e) => onChange('number', e.target.value)}
          error={errors.number}
          placeholder={t('customers:placeholders.phone_number')}
        />
      </div>
    </>
  );

  if (showCheckboxes) {
    return (
      <ContactFormWithCheckboxes formData={formData} onChange={onChange}>
        {formContent}
      </ContactFormWithCheckboxes>
    );
  }

  return formContent;
};

export default PhoneForm;