import { roleRepository } from '../repositories/role.repository';
import { Role, RoleCreateData, RoleUpdateData, RoleResponse } from '../models/role.model';
import { publishUserUpdatedEvent } from '../kafka';

/**
 * Role service for role management operations
 */
export class RoleService {
  /**
   * Create a new role
   * @param roleData - Role data
   * @param permissions - Array of permission objects with resource and action
   */
  public async createRole(
    roleData: RoleCreateData,
    permissions: Array<{ resource: string; action: string }> = []
  ): Promise<RoleResponse> {
    // Check if role name already exists
    const existingRole = await roleRepository.findByName(roleData.name);
    if (existingRole) {
      throw new Error('Role name already exists');
    }
    
    // Create role
    const role = await roleRepository.create(roleData);
    
    // Add permissions if provided
    if (permissions.length > 0) {
      await roleRepository.setPermissions(role.id, permissions);
    }
    
    // Get role with permissions
    const roleWithPermissions = await roleRepository.getRoleWithPermissions(role.id);
    
    if (!roleWithPermissions) {
      throw new Error('Failed to retrieve created role');
    }
    
    return {
      id: role.id,
      name: role.name,
      description: role.description,
      permissions: roleWithPermissions.permissions,
      created_at: role.created_at.toISOString(),
      updated_at: role.updated_at.toISOString(),
    };
  }

  /**
   * Update a role
   * @param id - Role ID
   * @param roleData - Role data to update
   * @param permissions - Array of permission objects with resource and action (optional)
   */
  public async updateRole(
    id: string,
    roleData: RoleUpdateData,
    permissions?: Array<{ resource: string; action: string }>
  ): Promise<RoleResponse | null> {
    // Check if role exists
    const role = await roleRepository.findById(id);
    if (!role) {
      throw new Error('Role not found');
    }
    
    // Update role
    const updatedRole = await roleRepository.update(id, roleData);
    
    if (!updatedRole) {
      return null;
    }
    
    // Update permissions if provided
    if (permissions) {
      await roleRepository.setPermissions(id, permissions);
    }
    
    // Get role with permissions
    const roleWithPermissions = await roleRepository.getRoleWithPermissions(id);
    
    if (!roleWithPermissions) {
      throw new Error('Failed to retrieve updated role');
    }
    
    return {
      id: updatedRole.id,
      name: updatedRole.name,
      description: updatedRole.description,
      permissions: roleWithPermissions.permissions,
      created_at: updatedRole.created_at.toISOString(),
      updated_at: updatedRole.updated_at.toISOString(),
    };
  }

  /**
   * Get a role by ID
   * @param id - Role ID
   */
  public async getRoleById(id: string): Promise<RoleResponse | null> {
    const roleWithPermissions = await roleRepository.getRoleWithPermissions(id);
    
    if (!roleWithPermissions) {
      return null;
    }
    
    const { role, permissions } = roleWithPermissions;
    
    return {
      id: role.id,
      name: role.name,
      description: role.description,
      permissions,
      created_at: role.created_at.toISOString(),
      updated_at: role.updated_at.toISOString(),
    };
  }

  /**
   * Get all roles
   */
  public async getAllRoles(): Promise<RoleResponse[]> {
    const roles = await roleRepository.findAll();
    
    const roleResponses: RoleResponse[] = [];
    
    for (const role of roles) {
      const roleWithPermissions = await roleRepository.getRoleWithPermissions(role.id);
      
      if (roleWithPermissions) {
        roleResponses.push({
          id: role.id,
          name: role.name,
          description: role.description,
          permissions: roleWithPermissions.permissions,
          created_at: role.created_at.toISOString(),
          updated_at: role.updated_at.toISOString(),
        });
      }
    }
    
    return roleResponses;
  }

  /**
   * Delete a role
   * @param id - Role ID
   */
  public async deleteRole(id: string): Promise<boolean> {
    // Check if role exists
    const role = await roleRepository.findById(id);
    if (!role) {
      throw new Error('Role not found');
    }

    // Check if any users are assigned to this role
    const { users, total } = await roleRepository.getUsersWithRole(id, 1, 1);
    if (total > 0) {
      throw new Error(`Cannot delete role "${role.name}" because it is assigned to ${total} user(s). Please remove all users from this role before deletion or reassign them to a different role.`);
    }

    return roleRepository.delete(id);
  }

  /**
   * Get users with role
   * @param id - Role ID
   * @param page - Page number
   * @param pageSize - Page size
   */
  public async getUsersWithRole(
    id: string,
    page = 1,
    pageSize = 10
  ): Promise<{ users: any[]; total: number; totalPages: number }> {
    const { users, total } = await roleRepository.getUsersWithRole(id, page, pageSize);
    
    const totalPages = Math.ceil(total / pageSize);
    
    return { users, total, totalPages };
  }

  /**
   * Assign role to users
   * @param id - Role ID
   * @param userIds - Array of user IDs
   */
  public async assignRoleToUsers(id: string, userIds: string[]): Promise<number> {
    // Get role information for the event
    const role = await roleRepository.findById(id);
    if (!role) {
      throw new Error('Role not found');
    }

    const result = await roleRepository.assignRoleToUsers(id, userIds);

    // Publish USER_UPDATED events for each user that got the role assigned
    for (const userId of userIds) {
      try {
        await publishUserUpdatedEvent(userId, {
          role: role.name
        });
      } catch (error) {
        console.error(`Failed to publish user updated event for user ${userId}`, error);
        // Don't throw error here, as the role assignment was successful
      }
    }

    return result;
  }

  /**
   * Remove users from role
   * @param id - Role ID
   * @param userIds - Array of user IDs
   */
  public async removeUsersFromRole(id: string, userIds: string[]): Promise<any[]> {
    // Get the users before removing them
    const usersToRemove = await roleRepository.getUsersBeforeRoleRemoval(id, userIds);
    
    // Remove the role from users
    await roleRepository.removeUsersFromRole(id, userIds);
    
    // Publish USER_UPDATED events for each user that had the role removed
    for (const userId of userIds) {
      try {
        await publishUserUpdatedEvent(userId, {
          // Note: We're not setting a specific role here since the user's role was removed
          // The consuming services should handle this appropriately
        });
      } catch (error) {
        console.error(`Failed to publish user updated event for user ${userId}`, error);
        // Don't throw error here, as the role removal was successful
      }
    }
    
    // Return the users that were removed
    return usersToRemove;
  }

  /**
   * Add permission to role
   * @param roleId - Role ID
   * @param resource - Resource
   * @param action - Action
   */
  public async addPermission(roleId: string, resource: string, action: string): Promise<boolean> {
    // Check if role exists
    const role = await roleRepository.findById(roleId);
    if (!role) {
      throw new Error('Role not found');
    }
    
    // Add permission
    await roleRepository.addPermission({
      role_id: roleId,
      resource,
      action,
    });
    
    return true;
  }

  /**
   * Remove permission from role
   * @param roleId - Role ID
   * @param resource - Resource
   * @param action - Action
   */
  public async removePermission(roleId: string, resource: string, action: string): Promise<boolean> {
    return roleRepository.removePermission(roleId, resource, action);
  }

  /**
   * Set permissions for role (replace all existing permissions)
   * @param roleId - Role ID
   * @param permissions - Array of permission objects with resource and action
   */
  public async setPermissions(
    roleId: string,
    permissions: Array<{ resource: string; action: string }>
  ): Promise<boolean> {
    return roleRepository.setPermissions(roleId, permissions);
  }
}

// Export singleton instance
export const roleService = new RoleService();