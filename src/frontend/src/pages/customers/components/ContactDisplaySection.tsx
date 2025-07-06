import React from 'react';
import { useTranslation } from '../../../i18n/hooks/useTranslation';

interface ContactItem {
  id?: string;
  [key: string]: any;
}

interface ContactDisplaySectionProps {
  title: string;
  icon: string;
  items: ContactItem[];
  maxDisplay?: number;
  canEdit: boolean;
  onClick?: () => void;
}

const ContactDisplaySection: React.FC<ContactDisplaySectionProps> = ({
  title,
  icon,
  items,
  maxDisplay = 3,
  canEdit,
  onClick
}) => {
  const { t } = useTranslation(['customers']);

  return (
    <div className={`${canEdit && onClick ? 'bg-gradient-to-br from-blue-50 to-neutral-50 rounded-lg p-3 border border-blue-100 hover:border-blue-300 hover:shadow-md transition-all duration-200' : ''}`}>
      <div 
        className={`flex items-center justify-between mb-2 ${
          canEdit && onClick 
            ? 'cursor-pointer hover:bg-blue-100/50 p-2 rounded-md transition-all duration-200 group' 
            : 'p-2'
        }`}
        onClick={onClick}
        title={canEdit ? `Click to manage ${title.toLowerCase()}` : undefined}
      >
        <div className="flex items-center">
          <i className={`bi ${icon} ${canEdit && onClick ? 'text-blue-600 group-hover:text-blue-700' : 'text-neutral-500'} mr-2`}></i>
          <span className={`font-medium text-xs uppercase ${canEdit && onClick ? 'text-blue-700 group-hover:text-blue-800' : 'text-neutral-600'}`}>
            {title}
          </span>
        </div>
        {canEdit && onClick && (
          <div className="flex items-center text-blue-500 group-hover:text-blue-600">
            <span className="text-xs mr-1 opacity-0 group-hover:opacity-100 transition-opacity">Manage</span>
            <i className="bi bi-pencil-square text-xs"></i>
          </div>
        )}
        {!canEdit && (
          <div className="flex items-center text-neutral-400">
            <i className="bi bi-lock text-xs"></i>
          </div>
        )}
      </div>
      
      <div className={`space-y-1 ${canEdit && onClick ? 'ml-2' : ''}`}>
        {items && items.length > 0 ? (
          <>
            {items.slice(0, maxDisplay).map((item, idx) => (
              <div key={idx} className="text-sm">
                {/* Phone Number Display */}
                {item.number && (
                  <div>
                    <span className="font-medium">{item.number}</span>
                    {item.type && <span className="text-neutral-500 ml-1">({item.type})</span>}
                  </div>
                )}
                
                {/* Email Address Display */}
                {item.address && (
                  <div>
                    <span className="font-medium">{item.address}</span>
                    {item.type && <span className="text-neutral-500 ml-1">({item.type})</span>}
                  </div>
                )}
                
                {/* Address Display */}
                {(item.line1 || item.addressLine1) && (
                  <div>
                    <div className="font-medium">{item.line1 || item.addressLine1}</div>
                    {(item.line2 || item.addressLine2) && <div className="text-neutral-500">{item.line2 || item.addressLine2}</div>}
                    {item.city && <div className="text-neutral-500">{item.city}</div>}
                    {item.type && <div className="text-neutral-500 text-xs">({item.type})</div>}
                  </div>
                )}
              </div>
            ))}
            {items.length > maxDisplay && (
              <div className="text-xs text-neutral-500">+{items.length - maxDisplay} more</div>
            )}
          </>
        ) : (
          <div className="text-neutral-400 text-sm italic">
            {title.toLowerCase().includes('phone') && 'No phone numbers'}
            {title.toLowerCase().includes('email') && 'No email addresses'}  
            {title.toLowerCase().includes('address') && 'No addresses'}
            {!title.toLowerCase().includes('phone') && !title.toLowerCase().includes('email') && !title.toLowerCase().includes('address') && `No ${title.toLowerCase()}`}
          </div>
        )}
      </div>
    </div>
  );
};

export default ContactDisplaySection;