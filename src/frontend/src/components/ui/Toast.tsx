import React, { useState, useEffect } from 'react';
import { CheckCircleIcon, XCircleIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { cn } from '../../utils/cn';

export interface ToastProps {
  message: string;
  type: 'success' | 'error';
  duration?: number;
  onClose?: () => void;
}

const Toast: React.FC<ToastProps> = ({ 
  message, 
  type, 
  duration = 3000, 
  onClose 
}) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => onClose?.(), 300); // Allow fade out animation
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => onClose?.(), 300);
  };

  return (
    <div
      className={cn(
        'fixed top-4 right-4 z-50 flex items-center space-x-3 px-4 py-3 rounded-lg shadow-lg transition-all duration-300',
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2',
        type === 'success' 
          ? 'bg-green-50 border border-green-200 text-green-800'
          : 'bg-red-50 border border-red-200 text-red-800'
      )}
    >
      {type === 'success' ? (
        <CheckCircleIcon className="w-5 h-5 text-green-600" />
      ) : (
        <XCircleIcon className="w-5 h-5 text-red-600" />
      )}
      
      <div className="flex-1 text-sm font-medium">
        {message}
      </div>
      
      <button
        onClick={handleClose}
        className={cn(
          'p-1 rounded-full hover:bg-opacity-20 transition-colors',
          type === 'success' ? 'hover:bg-green-600' : 'hover:bg-red-600'
        )}
      >
        <XMarkIcon className="w-4 h-4" />
      </button>
    </div>
  );
};

export default Toast;