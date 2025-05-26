import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Avatar } from '../../components/ui/Avatar';

const DashboardPage: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-neutral-900">Agent Dashboard</h1>
      </div>

      {/* Performance Summary */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Today's Performance</CardTitle>
          <Button variant="secondary" size="sm">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-4-4m4 4l4-4m-6 4V4" />
            </svg>
            Export
          </Button>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="text-center p-4 bg-neutral-50 rounded-lg">
              <div className="text-2xl font-bold text-primary-600 mb-1">24</div>
              <div className="text-sm text-neutral-600">Calls Made</div>
            </div>
            <div className="text-center p-4 bg-neutral-50 rounded-lg">
              <div className="text-2xl font-bold text-primary-600 mb-1">18</div>
              <div className="text-sm text-neutral-600">Successful Contacts</div>
            </div>
            <div className="text-center p-4 bg-neutral-50 rounded-lg">
              <div className="text-2xl font-bold text-primary-600 mb-1">5</div>
              <div className="text-sm text-neutral-600">Promises to Pay</div>
            </div>
            <div className="text-center p-4 bg-neutral-50 rounded-lg">
              <div className="text-2xl font-bold text-primary-600 mb-1">₫25M</div>
              <div className="text-sm text-neutral-600">Amount Promised</div>
            </div>
            <div className="text-center p-4 bg-neutral-50 rounded-lg">
              <div className="text-2xl font-bold text-primary-600 mb-1">75%</div>
              <div className="text-sm text-neutral-600">Contact Rate</div>
            </div>
            <div className="text-center p-4 bg-neutral-50 rounded-lg">
              <div className="text-2xl font-bold text-primary-600 mb-1">28%</div>
              <div className="text-sm text-neutral-600">Promise Rate</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Priority Customers */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Priority Customers</CardTitle>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              Filter
            </Button>
            <Button variant="secondary" size="sm">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
              </svg>
              Sort
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex mb-4">
            <Input
              placeholder="Search customers..."
              className="flex-1 rounded-r-none"
            />
            <Button className="rounded-l-none">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </Button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-neutral-200">
                  <th className="text-left py-3 px-4 font-medium text-neutral-900">Customer Name</th>
                  <th className="text-left py-3 px-4 font-medium text-neutral-900">CIF</th>
                  <th className="text-left py-3 px-4 font-medium text-neutral-900">DPD</th>
                  <th className="text-right py-3 px-4 font-medium text-neutral-900">Outstanding</th>
                  <th className="text-left py-3 px-4 font-medium text-neutral-900">Priority</th>
                  <th className="text-left py-3 px-4 font-medium text-neutral-900">Action</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-neutral-100 hover:bg-neutral-50 cursor-pointer">
                  <td className="py-3 px-4">
                    <div className="flex items-center">
                      <Avatar initials="NVA" size="sm" className="mr-3" />
                      Nguyen Van A
                    </div>
                  </td>
                  <td className="py-3 px-4">CIF123456</td>
                  <td className="py-3 px-4">45</td>
                  <td className="py-3 px-4 text-right font-mono">₫150,000,000</td>
                  <td className="py-3 px-4">
                    <Badge variant="danger">High</Badge>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex gap-2">
                      <Button size="sm" variant="primary">View</Button>
                      <Button size="sm" variant="secondary">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                      </Button>
                    </div>
                  </td>
                </tr>
                <tr className="border-b border-neutral-100 hover:bg-neutral-50 cursor-pointer">
                  <td className="py-3 px-4">
                    <div className="flex items-center">
                      <Avatar initials="TTB" size="sm" className="mr-3" />
                      Tran Thi B
                    </div>
                  </td>
                  <td className="py-3 px-4">CIF789012</td>
                  <td className="py-3 px-4">30</td>
                  <td className="py-3 px-4 text-right font-mono">₫85,000,000</td>
                  <td className="py-3 px-4">
                    <Badge variant="warning">Medium</Badge>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex gap-2">
                      <Button size="sm" variant="primary">View</Button>
                      <Button size="sm" variant="secondary">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                      </Button>
                    </div>
                  </td>
                </tr>
                <tr className="border-b border-neutral-100 hover:bg-neutral-50 cursor-pointer">
                  <td className="py-3 px-4">
                    <div className="flex items-center">
                      <Avatar initials="LVC" size="sm" className="mr-3" />
                      Le Van C
                    </div>
                  </td>
                  <td className="py-3 px-4">CIF345678</td>
                  <td className="py-3 px-4">15</td>
                  <td className="py-3 px-4 text-right font-mono">₫45,000,000</td>
                  <td className="py-3 px-4">
                    <Badge variant="success">Low</Badge>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex gap-2">
                      <Button size="sm" variant="primary">View</Button>
                      <Button size="sm" variant="secondary">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                      </Button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activities */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recent Activities</CardTitle>
          <Button variant="secondary" size="sm">View All</Button>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
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
                <tr className="border-b border-neutral-100">
                  <td className="py-3 px-4">10:45 AM</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center">
                      <Avatar initials="NVA" size="sm" className="mr-3" />
                      Nguyen Van A
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <Badge variant="primary">Call</Badge>
                  </td>
                  <td className="py-3 px-4">
                    <Badge variant="success">Promise to Pay</Badge>
                  </td>
                  <td className="py-3 px-4">Promised ₫50M by 05/10</td>
                </tr>
                <tr className="border-b border-neutral-100">
                  <td className="py-3 px-4">10:30 AM</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center">
                      <Avatar initials="TTB" size="sm" className="mr-3" />
                      Tran Thi B
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <Badge variant="primary">Call</Badge>
                  </td>
                  <td className="py-3 px-4">
                    <Badge variant="secondary">No Answer</Badge>
                  </td>
                  <td className="py-3 px-4">Will try again tomorrow</td>
                </tr>
                <tr className="border-b border-neutral-100">
                  <td className="py-3 px-4">10:15 AM</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center">
                      <Avatar initials="LVC" size="sm" className="mr-3" />
                      Le Van C
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <Badge variant="success">SMS</Badge>
                  </td>
                  <td className="py-3 px-4">
                    <Badge variant="secondary">Sent</Badge>
                  </td>
                  <td className="py-3 px-4">Payment reminder</td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardPage;