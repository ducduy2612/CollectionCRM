import React from 'react';
import { Card } from '../../../../components/ui/Card';
import { CpuChipIcon } from '@heroicons/react/24/outline';

const FudAutoConfig: React.FC = () => {
  return (
    <Card className="p-6">
      <div className="flex items-center mb-4">
        <CpuChipIcon className="w-6 h-6 text-primary-600 mr-2" />
        <h2 className="text-xl font-semibold text-neutral-800">FUD Auto Configuration</h2>
      </div>
      <p className="text-neutral-600 mb-4">
        Configure automated Follow-Up and Dunning processes. Set up intelligent scheduling and escalation rules.
      </p>
      {/* FUD auto config specific content will go here */}
    </Card>
  );
};

export default FudAutoConfig;