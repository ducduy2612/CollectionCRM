import React, { useState } from 'react';
import { Customer } from '../types';
import { Button } from '../../../components/ui/Button';
import { Avatar } from '../../../components/ui/Avatar';
import { getCustomerInitials, getCustomerDisplayName } from '../../../utils/customer.utils';
import RecordActionModal from './RecordActionModal';
import { useTranslation } from '../../../i18n/hooks/useTranslation';

interface ActionPanelProps {
  customer: Customer;
  lastContactDate?: string;
  onActionRecorded?: () => void;
}

const ActionPanel: React.FC<ActionPanelProps> = ({ customer, lastContactDate, onActionRecorded }) => {
  const { t } = useTranslation(['customers', 'common']);
  const [isRecordActionModalOpen, setIsRecordActionModalOpen] = useState(false);
  // Using utility functions for customer name and initials

  // Helper function to calculate days since last contact
  const getDaysSinceLastContact = (dateString?: string) => {
    if (!dateString) return t('common:time.now');
    
    const lastContact = new Date(dateString);
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - lastContact.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return t('common:time.today');
    }
    
    return t('common:time.days_ago', { count: diffDays });
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white shadow-lg p-4 flex justify-between items-center z-50">
      <div className="flex items-center">
        <Avatar initials={getCustomerInitials(customer.name, (customer as any).companyName)} size="md" className="mr-3" />
        <div>
          <div className="font-semibold text-neutral-800">{getCustomerDisplayName(customer)}</div>
          <div className="text-xs text-neutral-500">
            {t('customers:fields.last_contact')}: {lastContactDate ? new Date(lastContactDate).toLocaleDateString() : t('common:time.now')}
            {lastContactDate && ` (${getDaysSinceLastContact(lastContactDate)})`}
          </div>
        </div>
      </div>
      <div className="flex gap-3">
        <Button variant="primary">
          <i className="bi bi-telephone mr-2"></i>
          {t('customers:actions.make_call')}
        </Button>
        <Button variant="primary" onClick={() => setIsRecordActionModalOpen(true)}>
          <i className="bi bi-journal-text mr-2"></i>
          {t('customers:actions.record_action')}
        </Button>
      </div>

      {/* Record Action Modal */}
      <RecordActionModal
        isOpen={isRecordActionModalOpen}
        onClose={() => setIsRecordActionModalOpen(false)}
        customer={customer}
        loans={customer.loans || []}
        onSuccess={() => {
          setIsRecordActionModalOpen(false);
          onActionRecorded?.();
        }}
      />
    </div>
  );
};

export default ActionPanel;