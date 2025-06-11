import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { Avatar } from '../../../components/ui/Avatar';
import { Spinner } from '../../../components/ui/Spinner';
import { Alert } from '../../../components/ui/Alert';
import { 
  RecentActivity, 
  formatTime, 
  getActionTypeBadgeVariant,
  getResultBadgeVariant
} from '../../../services/api/dashboard.api';

interface RecentActivitiesProps {
  activities: RecentActivity[];
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
}

const RecentActivities: React.FC<RecentActivitiesProps> = ({
  activities,
  loading,
  error,
  onRefresh
}) => {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Recent Activities</CardTitle>
        <Button variant="secondary" size="sm" onClick={onRefresh}>
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </Button>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="danger" className="mb-4">
            {error}
          </Alert>
        )}

        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <Spinner size="lg" />
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-neutral-200">
                  <th className="text-left py-3 px-4 font-medium text-neutral-900">Time</th>
                  <th className="text-left py-3 px-4 font-medium text-neutral-900">Customer</th>
                  <th className="text-left py-3 px-4 font-medium text-neutral-900">Action Type</th>
                  <th className="text-left py-3 px-4 font-medium text-neutral-900">Result</th>
                  <th className="text-left py-3 px-4 font-medium text-neutral-900">Details</th>
                </tr>
              </thead>
              <tbody>
                {activities.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-8 text-neutral-500">
                      No recent activities found.
                    </td>
                  </tr>
                ) : (
                  activities.map((activity) => (
                    <tr key={activity.id} className="border-b border-neutral-100">
                      <td className="py-3 px-4">{formatTime(activity.timestamp)}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center">
                          <Avatar initials={activity.customer_info.initials} size="sm" className="mr-3" />
                          {activity.customer_info.name}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant={getActionTypeBadgeVariant(activity.action_type)}>{activity.action_type}</Badge>
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant={getResultBadgeVariant(activity.result)}>{activity.result}</Badge>
                      </td>
                      <td className="py-3 px-4">{activity.details}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default RecentActivities;