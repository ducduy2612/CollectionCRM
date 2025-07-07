import React from 'react';
import { Input } from '../../../../components/ui/Input';
import { Select } from '../../../../components/ui/Select';
import { Spinner } from '../../../../components/ui/Spinner';
import { useTranslation } from '../../../../i18n/hooks/useTranslation';
import { AddressType } from '../../../../services/api/bank.api';
import ContactFormWithCheckboxes from './ContactFormWithCheckboxes';

interface AddressFormProps {
  formData: {
    type: string;
    addressLine1: string;
    addressLine2: string;
    city: string;
    state: string;
    district: string;
    country: string;
    isPrimary?: boolean;
    isVerified?: boolean;
  };
  errors: Record<string, string>;
  addressTypes: AddressType[];
  addressTypesLoading: boolean;
  onChange: (field: string, value: any) => void;
  showCheckboxes?: boolean;
}

const AddressForm: React.FC<AddressFormProps> = ({
  formData,
  errors,
  addressTypes,
  addressTypesLoading,
  onChange,
  showCheckboxes = false
}) => {
  const { t } = useTranslation(['customers']);

  const formContent = (
    <>
      <div className="mb-4">
        <label className="block text-sm font-medium text-neutral-700 mb-2">
          {t('customers:fields.address_type')} *
        </label>
        {addressTypesLoading ? (
          <div className="flex items-center justify-center py-2">
            <Spinner size="sm" />
            <span className="ml-2 text-sm text-neutral-600">Loading address types...</span>
          </div>
        ) : (
          <Select
            value={formData.type || (addressTypes.length > 0 ? addressTypes[0].value : 'home1')}
            onChange={(e) => onChange('type', e.target.value)}
            options={addressTypes.map(type => ({
              value: type.value,
              label: type.label
            }))}
            error={errors.type}
            disabled={addressTypesLoading || addressTypes.length === 0}
          />
        )}
        {addressTypes.length === 0 && !addressTypesLoading && (
          <p className="text-xs text-red-600 mt-1">Failed to load address types. Please try again.</p>
        )}
      </div>
      <div className="mb-4">
        <label className="block text-sm font-medium text-neutral-700 mb-2">
          {t('customers:fields.address_line1')} *
        </label>
        <Input
          value={formData.addressLine1 || ''}
          onChange={(e) => onChange('addressLine1', e.target.value)}
          error={errors.addressLine1}
          placeholder={t('customers:placeholders.address_line1')}
        />
      </div>
      <div className="mb-4">
        <label className="block text-sm font-medium text-neutral-700 mb-2">
          {t('customers:fields.address_line2')}
        </label>
        <Input
          value={formData.addressLine2 || ''}
          onChange={(e) => onChange('addressLine2', e.target.value)}
          placeholder={t('customers:placeholders.address_line2')}
        />
      </div>
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            {t('customers:fields.city')} *
          </label>
          <Input
            value={formData.city || ''}
            onChange={(e) => onChange('city', e.target.value)}
            error={errors.city}
            placeholder={t('customers:placeholders.city')}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            {t('customers:fields.state')} *
          </label>
          <Input
            value={formData.state || ''}
            onChange={(e) => onChange('state', e.target.value)}
            error={errors.state}
            placeholder={t('customers:placeholders.state')}
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            {t('customers:fields.district')} *
          </label>
          <Input
            value={formData.district || ''}
            onChange={(e) => onChange('district', e.target.value)}
            error={errors.district}
            placeholder={t('customers:placeholders.district')}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            {t('customers:fields.country')} *
          </label>
          <Input
            value={formData.country || ''}
            onChange={(e) => onChange('country', e.target.value)}
            error={errors.country}
            placeholder={t('customers:placeholders.country')}
          />
        </div>
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

export default AddressForm;