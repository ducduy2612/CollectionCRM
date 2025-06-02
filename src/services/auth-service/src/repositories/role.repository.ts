import db from '../config/database';
import { Role, RoleCreateData, RoleUpdateData, Permission, PermissionCreateData } from '../models/role.model';

/**
 * Role repository for database operations
 */
export class RoleRepository {
  /**
   * Find a role by ID
   * @param id - Role ID
   */
  public async findById(id: string): Promise<Role | null> {
    const role = await db('roles').where({ id }).first();
    return role || null;
  }

  /**
   * Find a role by name
   * @param name - Role name
   */
  public async findByName(name: string): Promise<Role | null> {
    const role = await db('roles').where({ name }).first();
    return role || null;
  }

  /**
   * Create a new role
   * @param roleData - Role data
   */
  public async create(roleData: RoleCreateData): Promise<Role> {
    const [role] = await db('roles')
      .insert({
        ...roleData,
        created_at: new Date(),
        updated_at: new Date(),
      })
      .returning('*');
    
    return role;
  }

  /**
   * Update a role
   * @param id - Role ID
   * @param roleData - Role data to update
   */
  public async update(id: string, roleData: RoleUpdateData): Promise<Role | null> {
    const [role] = await db('roles')
      .where({ id })
      .update({
        ...roleData,
        updated_at: new Date(),
      })
      .returning('*');
    
    return role || null;
  }

  /**
   * Delete a role
   * @param id - Role ID
   */
  public async delete(id: string): Promise<boolean> {
    const deleted = await db('roles').where({ id }).delete();
    return deleted > 0;
  }

  /**
   * Find all roles
   */
  public async findAll(): Promise<Role[]> {
    return db('roles').orderBy('name', 'asc');
  }

  /**
   * Get role with permissions
   * @param id - Role ID
   */
  public async getRoleWithPermissions(id: string): Promise<{
    role: Role;
    permissions: string[];
  } | null> {
    const role = await this.findById(id);
    
    if (!role) {
      return null;
    }
    
    const permissions = await db('permissions')
      .where({ role_id: id })
      .select('resource', 'action');
    
    return {
      role,
      permissions: permissions.map((p: { resource: string; action: string }) => `${p.resource}:${p.action}`),
    };
  }

  /**
   * Add permission to role
   * @param permissionData - Permission data
   */
  public async addPermission(permissionData: PermissionCreateData): Promise<Permission> {
    const [permission] = await db('permissions')
      .insert({
        ...permissionData,
        created_at: new Date(),
        updated_at: new Date(),
      })
      .returning('*');
    
    return permission;
  }

  /**
   * Remove permission from role
   * @param roleId - Role ID
   * @param resource - Resource
   * @param action - Action
   */
  public async removePermission(roleId: string, resource: string, action: string): Promise<boolean> {
    const deleted = await db('permissions')
      .where({
        role_id: roleId,
        resource,
        action,
      })
      .delete();
    
    return deleted > 0;
  }

  /**
   * Get permissions for role
   * @param roleId - Role ID
   */
  public async getPermissions(roleId: string): Promise<Permission[]> {
    return db('permissions').where({ role_id: roleId });
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
    // Start a transaction
    return db.transaction(async (trx: any) => {
      // Delete all existing permissions for the role
      await trx('permissions').where({ role_id: roleId }).delete();
      
      // Add new permissions
      if (permissions.length > 0) {
        const permissionsToInsert = permissions.map(p => ({
          role_id: roleId,
          resource: p.resource,
          action: p.action,
          created_at: new Date(),
          updated_at: new Date(),
        }));
        
        await trx('permissions').insert(permissionsToInsert);
      }
      
      return true;
    });
  }

  /**
   * Get users with role
   * @param roleId - Role ID
   * @param page - Page number
   * @param pageSize - Page size
   */
  public async getUsersWithRole(
    roleId: string,
    page = 1,
    pageSize = 10
  ): Promise<{ users: any[]; total: number }> {
    // First, get the role name
    const role = await this.findById(roleId);
    
    if (!role) {
      return { users: [], total: 0 };
    }
    
    // Get users with this role
    const query = db('users').where({ role: role.name });
    
    // Get total count
    const countQuery = query.clone();
    const [{ count }] = await countQuery.count();
    const total = parseInt(count as string, 10);
    
    // Get paginated results
    const offset = (page - 1) * pageSize;
    const users = await query
      .select('id', 'username', 'email', 'first_name', 'last_name', 'is_active')
      .orderBy('username', 'asc')
      .limit(pageSize)
      .offset(offset);
    
    return { users, total };
  }

  /**
   * Assign role to users
   * @param roleId - Role ID
   * @param userIds - Array of user IDs
   */
  public async assignRoleToUsers(roleId: string, userIds: string[]): Promise<number> {
    // First, get the role name
    const role = await this.findById(roleId);
    
    if (!role || userIds.length === 0) {
      return 0;
    }
    
    // Update users with this role
    const updated = await db('users')
      .whereIn('id', userIds)
      .update({
        role: role.name,
        updated_at: new Date(),
      });
    
    return updated;
  }

  /**
   * Get users before removing them from role
   * @param roleId - Role ID
   * @param userIds - Array of user IDs
   */
  public async getUsersBeforeRoleRemoval(roleId: string, userIds: string[]): Promise<any[]> {
    // First, get the role name
    const role = await this.findById(roleId);
    
    if (!role || userIds.length === 0) {
      return [];
    }
    
    // Get users that will be affected by the role removal
    const users = await db('users')
      .whereIn('id', userIds)
      .where({ role: role.name })
      .select('id', 'username', 'email', 'first_name', 'last_name', 'is_active', 'created_at', 'updated_at');
    
    // Add roles array to match the expected UserResponse format
    return users.map((user: any) => ({
      ...user,
      roles: [role.name] // Current role that will be removed
    }));
  }

  /**
   * Remove users from role
   * @param roleId - Role ID
   * @param userIds - Array of user IDs
   */
  public async removeUsersFromRole(roleId: string, userIds: string[]): Promise<number> {
    // First, get the role name
    const role = await this.findById(roleId);
    
    if (!role || userIds.length === 0) {
      return 0;
    }
    
    // Remove role from users (set to default AGENT role)
    const updated = await db('users')
      .whereIn('id', userIds)
      .where({ role: role.name })
      .update({
        role: 'AGENT', // Set to default AGENT role
        updated_at: new Date(),
      });
    
    return updated;
  }
}

// Export singleton instance
export const roleRepository = new RoleRepository();