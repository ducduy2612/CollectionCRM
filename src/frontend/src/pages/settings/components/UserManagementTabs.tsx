import React from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../../components/ui/Tabs';
import { UserIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';

export type UserManagementTab = 'users' | 'roles';

interface UserManagementTabsProps {
  activeTab: UserManagementTab;
  onTabChange: (tab: UserManagementTab) => void;
  className?: string;
  children?: React.ReactNode;
}

const UserManagementTabs: React.FC<UserManagementTabsProps> = ({
  activeTab,
  onTabChange,
  className,
  children,
}) => {
  const handleValueChange = (value: string) => {
    onTabChange(value as UserManagementTab);
  };

  return (
    <Tabs
      value={activeTab}
      onValueChange={handleValueChange}
      defaultValue="users"
      className={className}
    >
      <TabsList>
        <TabsTrigger 
          value="users"
          className="flex items-center space-x-2"
          aria-label="Manage user accounts and permissions"
        >
          <UserIcon className="w-4 h-4" />
          <span>Users</span>
        </TabsTrigger>
        <TabsTrigger 
          value="roles"
          className="flex items-center space-x-2"
          aria-label="Configure roles and access levels"
        >
          <ShieldCheckIcon className="w-4 h-4" />
          <span>Roles</span>
        </TabsTrigger>
      </TabsList>
      
      {children}
    </Tabs>
  );
};

export default UserManagementTabs;