import React from 'react';
import { Card } from '../../../../components/ui/Card';
import { ArrowUpTrayIcon } from '@heroicons/react/24/outline';

const CustomerAssignmentUpload: React.FC = () => {
  return (
    <Card className="p-6">
      <div className="flex items-center mb-4">
        <ArrowUpTrayIcon className="w-6 h-6 text-primary-600 mr-2" />
        <h2 className="text-xl font-semibold text-neutral-800">Customer Assignment Upload</h2>
      </div>
      <p className="text-neutral-600 mb-4">
        Upload and manage customer assignment files. Configure bulk import settings and validation rules.
      </p>
      {/* Customer assignment upload specific content will go here */}
    </Card>
  );
};

export default CustomerAssignmentUpload;