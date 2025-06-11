import React from 'react';
import { Card } from '../../../../components/ui/Card';
import { QueueListIcon } from '@heroicons/react/24/outline';

const QueueCampaignConfig: React.FC = () => {
  return (
    <Card className="p-6">
      <div className="flex items-center mb-4">
        <QueueListIcon className="w-6 h-6 text-primary-600 mr-2" />
        <h2 className="text-xl font-semibold text-neutral-800">Queue Campaign Configuration</h2>
      </div>
      <p className="text-neutral-600 mb-4">
        Manage collection queues and campaign configurations. Set up prioritization rules and agent assignments.
      </p>
      {/* Queue campaign config specific content will go here */}
    </Card>
  );
};

export default QueueCampaignConfig;