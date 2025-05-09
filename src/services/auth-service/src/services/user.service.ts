import bcrypt from 'bcrypt';
import { userRepository } from '../repositories/user.repository';
import { User, UserCreateData, UserUpdateData, UserResponse } from '../models/user.model';
import { roleRepository } from '../repositories/role.repository';

/**
 * User service for user management operations
 */
export class UserService {
  /**
   * Hash a password
   * @param password - Plain text password
   */
  private async hashPassword(password: string): Promise<string> {
    const saltRounds = 10;
    return bcrypt.hash(password, saltRounds);
  }

  /**
   * Validate a password
   * @param password - Plain text password
   * @param hash - Password hash
   */
  public async validatePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  /**
   * Create a new user
   * @param userData - User data
   * @param password - Plain text password
   */
  public async createUser(
    userData: Omit<UserCreateData, 'password_hash'> & { password: string }
  ): Promise<User> {
    // Check if username already exists
    const existingUsername = await userRepository.findByUsername(userData.username);
    if (existingUsername) {
      throw new Error('Username already exists');
    }

    // Check if email already exists
    const existingEmail = await userRepository.findByEmail(userData.email);
    if (existingEmail) {
      throw new Error('Email already exists');
    }

    // Check if role exists
    const role = await roleRepository.findByName(userData.role);
    if (!role) {
      throw new Error('Role does not exist');
    }

    // Hash password
    const password_hash = await this.hashPassword(userData.password);

    // Create user
    // Create user data object without the password field
    const { password, ...userDataWithoutPassword } = userData;
    
    return userRepository.create({
      ...userDataWithoutPassword,
      password_hash,
      is_active: userData.is_active !== undefined ? userData.is_active : true,
    });
  }

  /**
   * Update a user
   * @param id - User ID
   * @param userData - User data to update
   * @param password - New password (optional)
   */
  public async updateUser(
    id: string,
    userData: Omit<UserUpdateData, 'password_hash'>,
    password?: string
  ): Promise<User | null> {
    // Check if user exists
    const user = await userRepository.findById(id);
    if (!user) {
      throw new Error('User not found');
    }

    // Check if email already exists (if changing email)
    if (userData.email && userData.email !== user.email) {
      const existingEmail = await userRepository.findByEmail(userData.email);
      if (existingEmail) {
        throw new Error('Email already exists');
      }
    }

    // Check if role exists (if changing role)
    if (userData.role && userData.role !== user.role) {
      const role = await roleRepository.findByName(userData.role);
      if (!role) {
        throw new Error('Role does not exist');
      }
    }

    // Prepare update data
    const updateData: UserUpdateData = { ...userData };

    // Hash new password if provided
    if (password) {
      updateData.password_hash = await this.hashPassword(password);
    }

    // Update user
    return userRepository.update(id, updateData);
  }

  /**
   * Get a user by ID
   * @param id - User ID
   */
  public async getUserById(id: string): Promise<UserResponse | null> {
    const userWithPermissions = await userRepository.getUserWithPermissions(id);
    
    if (!userWithPermissions) {
      return null;
    }
    
    const { user, roles, permissions } = userWithPermissions;
    
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      roles,
      permissions,
      is_active: user.is_active,
      created_at: user.created_at.toISOString(),
      updated_at: user.updated_at.toISOString(),
    };
  }

  /**
   * Get all users with optional filtering
   * @param filters - Optional filters
   * @param page - Page number
   * @param pageSize - Page size
   */
  public async getUsers(
    filters: { username?: string; email?: string; role?: string; is_active?: boolean } = {},
    page = 1,
    pageSize = 10
  ): Promise<{ users: UserResponse[]; total: number; totalPages: number }> {
    const { users, total } = await userRepository.findAll(filters, page, pageSize);
    
    const userResponses = users.map(user => ({
      id: user.id,
      username: user.username,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      roles: [user.role],
      is_active: user.is_active,
      created_at: user.created_at.toISOString(),
      updated_at: user.updated_at.toISOString(),
    }));
    
    const totalPages = Math.ceil(total / pageSize);
    
    return { users: userResponses, total, totalPages };
  }

  /**
   * Activate a user
   * @param id - User ID
   */
  public async activateUser(id: string): Promise<UserResponse | null> {
    const user = await userRepository.activate(id);
    
    if (!user) {
      return null;
    }
    
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      roles: [user.role],
      is_active: user.is_active,
      created_at: user.created_at.toISOString(),
      updated_at: user.updated_at.toISOString(),
    };
  }

  /**
   * Deactivate a user
   * @param id - User ID
   */
  public async deactivateUser(id: string): Promise<UserResponse | null> {
    const user = await userRepository.deactivate(id);
    
    if (!user) {
      return null;
    }
    
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      roles: [user.role],
      is_active: user.is_active,
      created_at: user.created_at.toISOString(),
      updated_at: user.updated_at.toISOString(),
    };
  }

  /**
   * Delete a user
   * @param id - User ID
   */
  public async deleteUser(id: string): Promise<boolean> {
    return userRepository.delete(id);
  }

  /**
   * Change user password
   * @param id - User ID
   * @param currentPassword - Current password
   * @param newPassword - New password
   */
  public async changePassword(
    id: string,
    currentPassword: string,
    newPassword: string
  ): Promise<boolean> {
    // Get user
    const user = await userRepository.findById(id);
    if (!user) {
      throw new Error('User not found');
    }
    
    // Validate current password
    const isValid = await this.validatePassword(currentPassword, user.password_hash);
    if (!isValid) {
      throw new Error('Current password is incorrect');
    }
    
    // Hash new password
    const password_hash = await this.hashPassword(newPassword);
    
    // Update password
    const updated = await userRepository.update(id, { password_hash });
    
    return !!updated;
  }

  /**
   * Reset user password (admin function)
   * @param id - User ID
   * @param newPassword - New password
   */
  public async resetPassword(id: string, newPassword: string): Promise<boolean> {
    // Get user
    const user = await userRepository.findById(id);
    if (!user) {
      throw new Error('User not found');
    }
    
    // Hash new password
    const password_hash = await this.hashPassword(newPassword);
    
    // Update password
    const updated = await userRepository.update(id, { password_hash });
    
    return !!updated;
  }
}

// Export singleton instance
export const userService = new UserService();