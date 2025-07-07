import React from 'react';
import { useTranslation } from '../../../../i18n/hooks/useTranslation';

interface ContactFormWithCheckboxesProps {
  formData: {
    isPrimary?: boolean;
    isVerified?: boolean;
  };
  onChange: (field: string, value: any) => void;
  children: React.ReactNode;
}

const ContactFormWithCheckboxes: React.FC<ContactFormWithCheckboxesProps> = ({
  formData,
  onChange,
  children
}) => {
  const { t } = useTranslation(['forms']);

  return (
    <>
      {children}
      
      <div className="flex gap-4 mb-4">
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={formData.isPrimary || false}
            onChange={(e) => onChange('isPrimary', e.target.checked)}
            className="mr-2"
          />
          {t('forms:options.primary')}
        </label>
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={formData.isVerified || false}
            onChange={(e) => onChange('isVerified', e.target.checked)}
            className="mr-2"
          />
          {t('forms:options.verified')}
        </label>
      </div>
    </>
  );
};

export default ContactFormWithCheckboxes;