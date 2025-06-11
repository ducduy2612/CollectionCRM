import React from 'react';
import { Card } from '../../../../components/ui/Card';
import { CogIcon } from '@heroicons/react/24/outline';

const SystemConfiguration: React.FC = () => {
  return (
    <Card className="p-6">
      <div className="flex items-center mb-4">
        <CogIcon className="w-6 h-6 text-primary-600 mr-2" />
        <h2 className="text-xl font-semibold text-neutral-800">System Configuration</h2>
      </div>
      <p className="text-neutral-600 mb-4">
        Configure system-wide settings including database connections, API endpoints, and security policies.
      </p>
      {/* System configuration specific content will go here */}
    </Card>
  );
};

export default SystemConfiguration;