import React from 'react';
import { Button } from '../../../components/ui/Button';

interface ContactItem {
  id: string;
  [key: string]: any;
}

interface ContactListItemProps {
  contact: ContactItem;
  contactType: 'phones' | 'emails' | 'addresses';
  canEdit: boolean;
  loading: boolean;
  onEdit: (contact: ContactItem) => void;
  onDelete: (contact: ContactItem) => void;
}

const ContactListItem: React.FC<ContactListItemProps> = ({
  contact,
  contactType,
  canEdit,
  loading,
  onEdit,
  onDelete
}) => {
  const renderContactContent = () => {
    switch (contactType) {
      case 'phones':
        return (
          <div>
            <div className="font-medium">{contact.number}</div>
            <div className="text-sm text-neutral-600">
              Type: {contact.type} {contact.isPrimary && '(Primary)'} {contact.isVerified && '(Verified)'}
            </div>
          </div>
        );
      
      case 'emails':
        return (
          <div>
            <div className="font-medium">{contact.address}</div>
            <div className="text-sm text-neutral-600">
              {contact.isPrimary && '(Primary)'} {contact.isVerified && '(Verified)'}
            </div>
          </div>
        );
      
      case 'addresses':
        return (
          <div>
            <div className="font-medium">{contact.line1 || contact.addressLine1}</div>
            {(contact.line2 || contact.addressLine2) && (
              <div className="text-sm">{contact.line2 || contact.addressLine2}</div>
            )}
            <div className="text-sm text-neutral-600">
              {contact.city}, {contact.state}, {contact.country}
            </div>
            <div className="text-xs text-neutral-500">
              Type: {contact.type} {contact.isPrimary && '(Primary)'} {contact.isVerified && '(Verified)'}
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="p-4 border rounded-lg bg-white shadow-sm hover:shadow-md transition-shadow flex justify-between items-start">
      <div className="flex-1">
        {renderContactContent()}
      </div>
      
      {canEdit && (
        <div className="flex gap-2 ml-4">
          {/* Only show edit/delete for workflow contacts that have IDs */}
          {contact.source === 'workflow' && contact.id && (
            <>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => onEdit(contact)}
                disabled={loading}
                title="Edit contact"
              >
                <i className="bi bi-pencil-square mr-1"></i>
                Edit
              </Button>
              <Button
                size="sm"
                variant="danger"
                onClick={() => onDelete(contact)}
                disabled={loading}
                title="Delete contact"
              >
                <i className="bi bi-trash mr-1"></i>
                Delete
              </Button>
            </>
          )}
          
          {/* Show source indicator */}
          <span className="text-xs px-2 py-1 rounded bg-neutral-100 text-neutral-600">
            {contact.source === 'workflow' ? 'Workflow Data' : 'Bank Data'}
          </span>
        </div>
      )}
    </div>
  );
};

export default ContactListItem;