import React, { useEffect, useRef } from 'react';
import { cn } from '../../utils/cn';
import { useNamespacedTranslation } from '../../i18n';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  closeOnOverlayClick?: boolean;
  closeOnEsc?: boolean;
}

const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  size = 'md',
  closeOnOverlayClick = true,
  closeOnEsc = true,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const { t } = useNamespacedTranslation('common');

  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (closeOnEsc && event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEsc);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose, closeOnEsc]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-full mx-4',
  };

  return (
    <div className="fixed inset-0 z-[100] overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4 text-center">
        {/* Overlay */}
        <div
          className="fixed inset-0 bg-black/50 transition-opacity"
          aria-hidden="true"
          onClick={closeOnOverlayClick ? onClose : undefined}
        />

        {/* Modal */}
        <div
          ref={modalRef}
          className={cn(
            'relative w-full transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all',
            sizeClasses[size]
          )}
        >
          {/* Header */}
          {(title || description) && (
            <div className="border-b border-neutral-200 px-6 py-4">
              {title && (
                <h3 className="text-lg font-semibold text-neutral-900">
                  {title}
                </h3>
              )}
              {description && (
                <p className="mt-1 text-sm text-neutral-500">
                  {description}
                </p>
              )}
            </div>
          )}

          {/* Close button */}
          <button
            type="button"
            className="absolute right-4 top-4 rounded-lg p-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
            onClick={onClose}
          >
            <span className="sr-only">{t('buttons.close')}</span>
            <svg
              className="h-5 w-5"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>

          {/* Content */}
          <div className="px-6 py-4">{children}</div>
        </div>
      </div>
    </div>
  );
};

interface ModalFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

const ModalFooter: React.FC<ModalFooterProps> = ({ children, className, ...props }) => {
  return (
    <div
      className={cn(
        'flex items-center justify-end gap-3 border-t border-neutral-200 px-6 py-4',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

// Confirmation Dialog Component
interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
  loading?: boolean;
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText,
  cancelText,
  variant = 'danger',
  loading = false,
}) => {
  const { t } = useNamespacedTranslation('common');
  
  const defaultConfirmText = confirmText || t('buttons.confirm');
  const defaultCancelText = cancelText || t('buttons.cancel');
  const variantClasses = {
    danger: 'bg-danger-500 hover:bg-danger-600 focus:ring-danger-500',
    warning: 'bg-warning-500 hover:bg-warning-600 focus:ring-warning-500',
    info: 'bg-primary-500 hover:bg-primary-600 focus:ring-primary-500',
  };

  const variantIcons = {
    danger: (
      <svg className="h-6 w-6 text-danger-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    ),
    warning: (
      <svg className="h-6 w-6 text-warning-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    info: (
      <svg className="h-6 w-6 text-primary-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="sm">
      <div className="sm:flex sm:items-start">
        <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-neutral-100 sm:mx-0 sm:h-10 sm:w-10">
          {variantIcons[variant]}
        </div>
        <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
          <h3 className="text-lg font-medium leading-6 text-neutral-900">
            {title}
          </h3>
          {description && (
            <div className="mt-2">
              <p className="text-sm text-neutral-500">{description}</p>
            </div>
          )}
        </div>
      </div>
      <ModalFooter>
        <button
          type="button"
          className="inline-flex justify-center rounded-md border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-700 shadow-sm hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
          onClick={onClose}
          disabled={loading}
        >
          {defaultCancelText}
        </button>
        <button
          type="button"
          className={cn(
            'inline-flex justify-center rounded-md border border-transparent px-4 py-2 text-sm font-medium text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2',
            variantClasses[variant],
            loading && 'opacity-50 cursor-not-allowed'
          )}
          onClick={onConfirm}
          disabled={loading}
        >
          {loading ? t('actions.loading') : defaultConfirmText}
        </button>
      </ModalFooter>
    </Modal>
  );
};

export { Modal, ModalFooter, ConfirmDialog };