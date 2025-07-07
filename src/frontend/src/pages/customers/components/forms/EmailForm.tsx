import React from 'react';
import { Input } from '../../../../components/ui/Input';
import { useTranslation } from '../../../../i18n/hooks/useTranslation';
import ContactFormWithCheckboxes from './ContactFormWithCheckboxes';

interface EmailFormProps {
  formData: {
    address: string;
    isPrimary?: boolean;
    isVerified?: boolean;
  };
  errors: Record<string, string>;
  onChange: (field: string, value: any) => void;
  showCheckboxes?: boolean;
}

const EmailForm: React.FC<EmailFormProps> = ({
  formData,
  errors,
  onChange,
  showCheckboxes = false
}) => {
  const { t } = useTranslation(['customers']);

  const formContent = (
    <div className="mb-4">
      <label className="block text-sm font-medium text-neutral-700 mb-2">
        {t('customers:fields.email_address')} *
      </label>
      <Input
        type="email"
        value={formData.address || ''}
        onChange={(e) => onChange('address', e.target.value)}
        error={errors.address}
        placeholder={t('customers:placeholders.email_address')}
      />
    </div>
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

export default EmailForm;