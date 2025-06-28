import React from 'react';
import { ArrowPathIcon } from '@heroicons/react/24/outline';
import { Button } from '../../../../../components/ui/Button';

interface ModalHeaderProps {
  title: string;
  onRefresh: () => void;
  isLoading: boolean;
  refreshButtonText: string;
}

export const ModalHeader: React.FC<ModalHeaderProps> = ({ 
  title, 
  onRefresh, 
  isLoading, 
  refreshButtonText 
}) => {
  return (
    <div className="flex items-center justify-between mb-4">
      <h3 className="text-lg font-medium text-neutral-800">
        {title}
      </h3>
      <Button
        variant="secondary"
        size="sm"
        onClick={onRefresh}
        disabled={isLoading}
      >
        <ArrowPathIcon className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        {refreshButtonText}
      </Button>
    </div>
  );
};