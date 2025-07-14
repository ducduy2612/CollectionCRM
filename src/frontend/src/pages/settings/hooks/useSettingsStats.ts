import { useQuery } from 'react-query';
import { authApi } from '../../../services/api/auth.api';
import { actionConfigApi } from '../../../services/api/workflow/action-config.api';
import { fudAutoConfigApi } from '../../../services/api/workflow/fud-auto-config.api';
import { campaignsApi } from '../../../services/api/campaign/campaigns.api';

interface SettingsStats {
  userManagement: {
    activeUsers: number;
    totalRoles: number;
    pendingUsers: number;
  };
  actionsConfig: {
    types: number;
    subtypes: number;
    results: number;
  };
  fudAutoConfig: {
    totalRules: number;
    activeRules: number;
  };
  queueCampaign: {
    activeQueues: number;
    totalCases: number;
  };
}

export const useSettingsStats = () => {
  // User Management Stats
  const { data: usersData } = useQuery(
    ['settings-users-stats'],
    async () => {
      const roles = await authApi.getRoles();
      const allUsers = await authApi.getUsers({}, { page: 1, pageSize: 1000 });
      
      const activeUsers = allUsers.users.filter(u => u.is_active).length;
      const pendingUsers = allUsers.users.filter(u => !u.is_active).length;
      
      return {
        activeUsers,
        totalRoles: roles.roles.length,
        pendingUsers
      };
    }
  );

  // Actions Config Stats
  const { data: actionsData } = useQuery(
    ['settings-actions-stats'],
    async () => {
      const stats = await actionConfigApi.getConfigurationUsageStats();
      // Count by configuration type
      const types = stats.filter(s => s.config_type === 'RESULT').length;
      const subtypes = stats.filter(s => s.config_type === 'SUBTYPE').length;
      const results = stats.filter(s => s.config_type === 'TYPE').length;
      
      return {
        types,
        subtypes,
        results
      };
    }
  );

  // FUD Auto Config Stats
  const { data: fudData } = useQuery(
    ['settings-fud-stats'],
    async () => {
      const configs = await fudAutoConfigApi.getAllConfigs(true);
      
      const totalRules = configs.length;
      const activeRules = configs.filter(c => c.is_active).length;
      
      return {
        totalRules,
        activeRules
      };
    }
  );

  // Queue Campaign Stats
  const { data: campaignData } = useQuery(
    ['settings-campaign-stats'],
    async () => {
      const queueStats = await campaignsApi.getQueueStatistics();
      
      return {
        activeQueues: queueStats.campaignGroups,
        totalCases: queueStats.totalCampaigns,      
      };
    }
  );

  const stats: SettingsStats = {
    userManagement: usersData || {
      activeUsers: 0,
      totalRoles: 0,
      pendingUsers: 0
    },
    actionsConfig: actionsData || {
      types: 0,
      subtypes: 0,
      results: 0
    },
    fudAutoConfig: fudData || {
      totalRules: 0,
      activeRules: 0
    },
    queueCampaign: campaignData || {
      activeQueues: 0,
      totalCases: 0
    }
  };

  const isLoading = !usersData || !actionsData || !fudData || !campaignData;

  return {
    stats,
    isLoading
  };
};