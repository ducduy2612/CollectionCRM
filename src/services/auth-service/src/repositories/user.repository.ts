import db from '../config/database';
import { User, UserCreateData, UserUpdateData } from '../models/user.model';

/**
 * User repository for database operations
 */
export class UserRepository {
  /**
   * Find a user by ID
   * @param id - User ID
   */
  public async findById(id: string): Promise<User | null> {
    const user = await db('users').where({ id }).first();
    return user || null;
  }

  /**
   * Find a user by username
   * @param username - Username
   */
  public async findByUsername(username: string): Promise<User | null> {
    const user = await db('users').where({ username }).first();
    return user || null;
  }

  /**
   * Find a user by email
   * @param email - Email address
   */
  public async findByEmail(email: string): Promise<User | null> {
    const user = await db('users').where({ email }).first();
    return user || null;
  }

  /**
   * Create a new user
   * @param userData - User data
   */
  public async create(userData: UserCreateData): Promise<User> {
    const [user] = await db('users')
      .insert({
        ...userData,
        created_at: new Date(),
        updated_at: new Date(),
      })
      .returning('*');
    
    return user;
  }

  /**
   * Update a user
   * @param id - User ID
   * @param userData - User data to update
   */
  public async update(id: string, userData: UserUpdateData): Promise<User | null> {
    const [user] = await db('users')
      .where({ id })
      .update({
        ...userData,
        updated_at: new Date(),
      })
      .returning('*');
    
    return user || null;
  }

  /**
   * Activate a user
   * @param id - User ID
   */
  public async activate(id: string): Promise<User | null> {
    return this.update(id, { is_active: true });
  }

  /**
   * Deactivate a user
   * @param id - User ID
   */
  public async deactivate(id: string): Promise<User | null> {
    return this.update(id, { is_active: false });
  }

  /**
   * Find all users with optional filtering
   * @param filters - Optional filters
   * @param page - Page number
   * @param pageSize - Page size
   */
  public async findAll(
    filters: { username?: string; email?: string; role?: string; is_active?: boolean } = {},
    page = 1,
    pageSize = 10
  ): Promise<{ users: User[]; total: number }> {
    const query = db('users');
    
    // Apply filters
    if (filters.username) {
      query.whereILike('username', `%${filters.username}%`);
    }
    
    if (filters.email) {
      query.whereILike('email', `%${filters.email}%`);
    }
    
    if (filters.role) {
      query.where('role', filters.role);
    }
    
    if (filters.is_active !== undefined) {
      query.where('is_active', filters.is_active);
    }
    
    // Get total count
    const countQuery = query.clone();
    const [{ count }] = await countQuery.count();
    const total = parseInt(count as string, 10);
    
    // Get paginated results
    const offset = (page - 1) * pageSize;
    const users = await query
      .orderBy('created_at', 'desc')
      .limit(pageSize)
      .offset(offset);
    
    return { users, total };
  }

  /**
   * Delete a user
   * @param id - User ID
   */
  public async delete(id: string): Promise<boolean> {
    const deleted = await db('users').where({ id }).delete();
    return deleted > 0;
  }

  /**
   * Get user with roles and permissions
   * @param id - User ID
   */
  public async getUserWithPermissions(id: string): Promise<{
    user: User;
    roles: string[];
    permissions: string[];
  } | null> {
    const user = await this.findById(id);
    
    if (!user) {
      return null;
    }
    
    // Get role
    const role = user.role;
    
    // Get permissions for the role
    const permissions = await db('permissions')
      .join('roles', 'permissions.role_id', 'roles.id')
      .where('roles.name', role)
      .select('permissions.resource', 'permissions.action');
    
    return {
      user,
      roles: [role],
      permissions: permissions.map((p: { resource: string; action: string }) => `${p.resource}:${p.action}`),
    };
  }
}

// Export singleton instance
export const userRepository = new UserRepository();