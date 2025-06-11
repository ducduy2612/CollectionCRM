import React from 'react';
import { Card } from '../../../../components/ui/Card';
import { BoltIcon } from '@heroicons/react/24/outline';

const ActionsConfig: React.FC = () => {
  return (
    <Card className="p-6">
      <div className="flex items-center mb-4">
        <BoltIcon className="w-6 h-6 text-primary-600 mr-2" />
        <h2 className="text-xl font-semibold text-neutral-800">Actions Configuration</h2>
      </div>
      <p className="text-neutral-600 mb-4">
        Configure automated actions and workflows for collection processes. Set up triggers, conditions, and responses.
      </p>
      {/* Actions config specific content will go here */}
    </Card>
  );
};

export default ActionsConfig;