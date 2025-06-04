import React, { useState, useEffect } from 'react';
import { Modal, ModalFooter } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import { Select, SelectOption } from '../../../components/ui/Select';
import { Input } from '../../../components/ui/Input';
import { StatusDictItem, StatusUpdateRequest } from '../types';

interface StatusUpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  statusType: 'customer' | 'collateral' | 'processing_state' | 'lending_violation' | 'recovery_ability';
  statusOptions: StatusDictItem[];
  substateOptions?: StatusDictItem[]; // Only for processing_state
  cif: string;
  collateralId?: string; // Only for collateral status
  onSubmit: (data: StatusUpdateRequest) => Promise<void>;
}

interface FormData {
  statusId: string;
  substateId?: string;
  notes: string;
  actionDate: string;
}

interface FormErrors {
  statusId?: string;
  substateId?: string;
  notes?: string;
  actionDate?: string;
}

const StatusUpdateModal: React.FC<StatusUpdateModalProps> = ({
  isOpen,
  onClose,
  statusType,
  statusOptions,
  substateOptions,
  cif,
  collateralId,
  onSubmit
}) => {
  const [formData, setFormData] = useState<FormData>({
    statusId: '',
    substateId: '',
    notes: '',
    actionDate: new Date().toISOString().slice(0, 16) // Format for datetime-local input
  });
  
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setFormData({
        statusId: '',
        substateId: '',
        notes: '',
        actionDate: new Date().toISOString().slice(0, 16)
      });
      console.log(statusOptions)
      setErrors({});
      setIsSubmitting(false);
    }
  }, [isOpen]);

  // Get status type display name
  const getStatusTypeDisplayName = (type: string) => {
    switch (type) {
      case 'customer': return 'Customer Status';
      case 'collateral': return 'Collateral Status';
      case 'processing_state': return 'Processing State';
      case 'lending_violation': return 'Lending Violation';
      case 'recovery_ability': return 'Recovery Ability';
      default: return 'Status';
    }
  };

  // Convert status options to select options
  const statusSelectOptions: SelectOption[] = statusOptions
    .sort((a, b) => a.displayOrder - b.displayOrder)
    .map(option => ({
      value: option.id,
      label: option.name
    }));

  const substateSelectOptions: SelectOption[] = substateOptions
    ? substateOptions
        .sort((a, b) => a.displayOrder - b.displayOrder)
        .map(option => ({
          value: option.id,
          label: option.name
        }))
    : [];

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.statusId.trim()) {
      newErrors.statusId = 'Status is required';
    }

    if (statusType === 'processing_state' && substateOptions && substateOptions.length > 0 && !formData.substateId?.trim()) {
      newErrors.substateId = 'Substate is required';
    }

    if (!formData.actionDate.trim()) {
      newErrors.actionDate = 'Action date is required';
    } else {
      const actionDate = new Date(formData.actionDate);
      const now = new Date();
      if (actionDate > now) {
        newErrors.actionDate = 'Action date cannot be in the future';
      }
    }

    if (formData.notes.trim().length > 500) {
      newErrors.notes = 'Notes cannot exceed 500 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const submitData: StatusUpdateRequest = {
        cif,
        statusType,
        statusId: formData.statusId,
        notes: formData.notes.trim() || undefined,
        actionDate: formData.actionDate
      };

      // Add substate for processing_state
      if (statusType === 'processing_state' && formData.substateId) {
        submitData.substateId = formData.substateId;
      }

      // Add collateral ID for collateral status
      if (statusType === 'collateral' && collateralId) {
        submitData.collateralId = collateralId;
      }

      await onSubmit(submitData);
      onClose();
    } catch (error) {
      console.error('Error submitting status update:', error);
      // Error handling could be improved with a toast notification system
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle input changes
  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  // Handle cancel
  const handleCancel = () => {
    if (!isSubmitting) {
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleCancel}
      title={`Update ${getStatusTypeDisplayName(statusType)}`}
      description={`Record a new ${getStatusTypeDisplayName(statusType).toLowerCase()} update`}
      size="md"
      closeOnOverlayClick={!isSubmitting}
      closeOnEsc={!isSubmitting}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Status Selection */}
        <Select
          label={getStatusTypeDisplayName(statusType)}
          options={statusSelectOptions}
          value={formData.statusId}
          onChange={(e) => handleInputChange('statusId', e.target.value)}
          placeholder={`Select ${getStatusTypeDisplayName(statusType).toLowerCase()}...`}
          error={errors.statusId}
          required
          disabled={isSubmitting}
        />

        {/* Substate Selection (only for processing_state) */}
        {statusType === 'processing_state' && substateSelectOptions.length > 0 && (
          <Select
            label="Processing Substate"
            options={substateSelectOptions}
            value={formData.substateId || ''}
            onChange={(e) => handleInputChange('substateId', e.target.value)}
            placeholder="Select processing substate..."
            error={errors.substateId}
            disabled={isSubmitting || !formData.statusId}
          />
        )}

        {/* Action Date */}
        <Input
          type="datetime-local"
          label="Action Date"
          value={formData.actionDate}
          onChange={(e) => handleInputChange('actionDate', e.target.value)}
          error={errors.actionDate}
          hint="Date and time when this status change occurred"
          required
          disabled={isSubmitting}
          max={new Date().toISOString().slice(0, 16)}
        />

        {/* Notes */}
        <div className="w-full">
          <label className="block mb-2 text-sm font-medium text-neutral-700">
            Notes
          </label>
          <textarea
            value={formData.notes}
            onChange={(e) => handleInputChange('notes', e.target.value)}
            placeholder="Add any relevant notes about this status change..."
            rows={4}
            maxLength={500}
            disabled={isSubmitting}
            className={`block w-full px-3 py-2 text-sm text-neutral-800 bg-white border border-neutral-300 rounded-md focus:border-primary-400 focus:ring-2 focus:ring-primary-400 focus:ring-opacity-25 transition-colors duration-200 disabled:bg-neutral-50 disabled:text-neutral-500 disabled:cursor-not-allowed resize-none ${
              errors.notes ? 'border-danger-500 focus:border-danger-500 focus:ring-danger-500' : ''
            }`}
          />
          <div className="flex justify-between items-center mt-1">
            {errors.notes && (
              <p className="text-xs text-danger-600">{errors.notes}</p>
            )}
            <p className="text-xs text-neutral-500 ml-auto">
              {formData.notes.length}/500 characters
            </p>
          </div>
        </div>

        {/* Customer Info Display */}
        <div className="bg-neutral-50 rounded-md p-3 border border-neutral-200">
          <div className="text-xs text-neutral-600 mb-1">Customer</div>
          <div className="text-sm font-medium text-neutral-800">CIF: {cif}</div>
          {statusType === 'collateral' && collateralId && (
            <div className="text-xs text-neutral-600 mt-1">Collateral ID: {collateralId}</div>
          )}
        </div>
      </form>

      <ModalFooter>
        <Button
          type="button"
          variant="secondary"
          onClick={handleCancel}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          onClick={handleSubmit}
          disabled={isSubmitting || !formData.statusId}
          className="min-w-[100px]"
        >
          {isSubmitting ? (
            <div className="flex items-center gap-2">
              <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Updating...
            </div>
          ) : (
            'Update Status'
          )}
        </Button>
      </ModalFooter>
    </Modal>
  );
};

export default StatusUpdateModal;