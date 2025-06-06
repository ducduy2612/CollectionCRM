import React from 'react';
import { Phone, Email, Address } from '../types';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { useTranslation } from '../../../i18n/hooks/useTranslation';

interface ContactInformationProps {
  phones: Phone[];
  emails: Email[];
  addresses: Address[];
}

const ContactInformation: React.FC<ContactInformationProps> = ({ phones, emails, addresses }) => {
  const { t } = useTranslation(['customers', 'forms', 'common']);
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>{t('customers:tabs.contact_info')}</CardTitle>
        <Button variant="secondary" size="sm">
          <i className="bi bi-pencil mr-2"></i>
          {t('common:buttons.edit')}
        </Button>
      </CardHeader>
      
      <CardContent>
        {/* Phone Numbers */}
        <div className="contact-section mb-6">
          <div className="text-sm font-semibold text-neutral-600 mb-3 flex items-center">
            <i className="bi bi-telephone text-primary-500 mr-2"></i>
            {t('customers:fields.phone')}
          </div>
          
          {phones && phones.map((phone, index) => (
            <div key={index} className="flex items-center p-3 rounded-md mb-3 bg-neutral-50 border border-neutral-200">
              <div className="w-10 h-10 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center mr-3 text-base">
                <i className={`bi ${phone.type === 'MOBILE' ? 'bi-phone' : phone.type === 'WORK' ? 'bi-building' : 'bi-telephone'}`}></i>
              </div>
              <div className="flex-1">
                <div className="text-xs text-neutral-500 mb-1">
                  {phone.type} {phone.isPrimary && `(${t('forms:options.primary')})`} {phone.isVerified && `(${t('forms:options.verified')})`}
                </div>
                <div className="font-semibold text-neutral-800">
                  {phone.number}
                </div>
              </div>
              <div className={`w-2 h-8 rounded-full ${index === 0 ? 'bg-green-500' : index === 1 ? 'bg-yellow-500' : 'bg-red-500'} mr-3`}></div>
              {index < 2 && (
                <div className="text-xs text-neutral-600 bg-neutral-100 px-2 py-1 rounded mr-3 whitespace-nowrap">
                  <i className="bi bi-clock"></i>
                  {t('customers:fields.preferred_contact')}: {index === 0 ? '9-11 AM' : '6-8 PM'}
                </div>
              )}
              <div className="flex gap-2">
                <Button size="sm" variant="primary">
                  <i className="bi bi-telephone mr-1"></i>
                  {t('customers:actions.make_call')}
                </Button>
                {phone.type === 'MOBILE' && (
                  <Button size="sm" variant="secondary">
                    <i className="bi bi-chat mr-1"></i>
                    {t('customers:contact_methods.sms')}
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
        
        {/* Email Addresses */}
        <div className="contact-section mb-6">
          <div className="text-sm font-semibold text-neutral-600 mb-3 flex items-center">
            <i className="bi bi-envelope text-primary-500 mr-2"></i>
            {t('customers:fields.email')}
          </div>
          
          {emails && emails.map((email, index) => (
            <div key={index} className="flex items-center p-3 rounded-md mb-3 bg-neutral-50 border border-neutral-200">
              <div className="w-10 h-10 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center mr-3 text-base">
                <i className="bi bi-envelope"></i>
              </div>
              <div className="flex-1">
                <div className="text-xs text-neutral-500 mb-1">
                  {t('customers:contact_methods.email')} {email.isPrimary && `(${t('forms:options.primary')})`} {email.isVerified && `(${t('forms:options.verified')})`}
                </div>
                <div className="font-semibold text-neutral-800">
                  {email.address}
                </div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="primary">
                  <i className="bi bi-envelope mr-1"></i>
                  {t('customers:contact_methods.email')}
                </Button>
              </div>
            </div>
          ))}
        </div>
        
        {/* Physical Addresses */}
        <div className="contact-section">
          <div className="text-sm font-semibold text-neutral-600 mb-3 flex items-center">
            <i className="bi bi-geo-alt text-primary-500 mr-2"></i>
            {t('customers:fields.address')}
          </div>
          
          {addresses && addresses.map((address, index) => (
            <div key={index} className="flex items-center p-3 rounded-md mb-3 bg-neutral-50 border border-neutral-200">
              <div className="w-10 h-10 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center mr-3 text-base">
                <i className={`bi ${address.type === 'HOME' ? 'bi-house' : 'bi-building'}`}></i>
              </div>
              <div className="flex-1">
                <div className="text-xs text-neutral-500 mb-1">
                  {address.type} {t('customers:fields.address')} {address.isPrimary && `(${t('forms:options.primary')})`} {address.isVerified && `(${t('forms:options.verified')})`}
                </div>
                <div className="font-semibold text-neutral-800">
                  {address.addressLine1}
                  {address.addressLine2 && `, ${address.addressLine2}`}
                  {`, ${address.city}, ${address.state || address.district || ''}, ${address.country}`}
                </div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="secondary">
                  <i className="bi bi-map mr-1"></i>
                  {t('common:buttons.view')}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default ContactInformation;