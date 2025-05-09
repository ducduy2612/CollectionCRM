import bcrypt from 'bcrypt';
import { UserService } from '../../../src/services/user.service';
import { userRepository } from '../../../src/repositories/user.repository';
import { roleRepository } from '../../../src/repositories/role.repository';

// Mock the repositories
jest.mock('../../../src/repositories/user.repository');
jest.mock('../../../src/repositories/role.repository');

describe('UserService', () => {
  let userService: UserService;
  
  // Sample test data
  const testUser = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    username: 'testuser',
    email: 'test@example.com',
    password_hash: 'hashed_password',
    first_name: 'Test',
    last_name: 'User',
    role: 'user',
    is_active: true,
    created_at: new Date(),
    updated_at: new Date()
  };
  
  const testRole = {
    id: '123e4567-e89b-12d3-a456-426614174001',
    name: 'user',
    description: 'Regular user',
    created_at: new Date(),
    updated_at: new Date()
  };
  
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    
    // Create a new instance of UserService for each test
    userService = new UserService();
  });
  
  describe('createUser', () => {
    it('should create a new user successfully', async () => {
      // Mock repository functions
      (userRepository.findByUsername as jest.Mock).mockResolvedValue(null);
      (userRepository.findByEmail as jest.Mock).mockResolvedValue(null);
      (roleRepository.findByName as jest.Mock).mockResolvedValue(testRole);
      (userRepository.create as jest.Mock).mockResolvedValue(testUser);
      
      // Mock bcrypt hash
      jest.spyOn(bcrypt, 'hash').mockImplementation(() => Promise.resolve('hashed_password'));
      
      // Call the function
      const result = await userService.createUser({
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
        first_name: 'Test',
        last_name: 'User',
        role: 'user'
      });
      
      // Assertions
      expect(userRepository.findByUsername).toHaveBeenCalledWith('testuser');
      expect(userRepository.findByEmail).toHaveBeenCalledWith('test@example.com');
      expect(roleRepository.findByName).toHaveBeenCalledWith('user');
      expect(bcrypt.hash).toHaveBeenCalledWith('password123', 10);
      expect(userRepository.create).toHaveBeenCalledWith({
        username: 'testuser',
        email: 'test@example.com',
        password_hash: 'hashed_password',
        first_name: 'Test',
        last_name: 'User',
        role: 'user',
        is_active: true
      });
      expect(result).toEqual(testUser);
    });
    
    it('should throw an error if username already exists', async () => {
      // Mock repository functions
      (userRepository.findByUsername as jest.Mock).mockResolvedValue(testUser);
      
      // Call the function and expect it to throw
      await expect(userService.createUser({
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
        role: 'user'
      })).rejects.toThrow('Username already exists');
      
      // Assertions
      expect(userRepository.findByUsername).toHaveBeenCalledWith('testuser');
      expect(userRepository.create).not.toHaveBeenCalled();
    });
    
    it('should throw an error if email already exists', async () => {
      // Mock repository functions
      (userRepository.findByUsername as jest.Mock).mockResolvedValue(null);
      (userRepository.findByEmail as jest.Mock).mockResolvedValue(testUser);
      
      // Call the function and expect it to throw
      await expect(userService.createUser({
        username: 'newuser',
        email: 'test@example.com',
        password: 'password123',
        role: 'user'
      })).rejects.toThrow('Email already exists');
      
      // Assertions
      expect(userRepository.findByUsername).toHaveBeenCalledWith('newuser');
      expect(userRepository.findByEmail).toHaveBeenCalledWith('test@example.com');
      expect(userRepository.create).not.toHaveBeenCalled();
    });
    
    it('should throw an error if role does not exist', async () => {
      // Mock repository functions
      (userRepository.findByUsername as jest.Mock).mockResolvedValue(null);
      (userRepository.findByEmail as jest.Mock).mockResolvedValue(null);
      (roleRepository.findByName as jest.Mock).mockResolvedValue(null);
      
      // Call the function and expect it to throw
      await expect(userService.createUser({
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
        role: 'nonexistent_role'
      })).rejects.toThrow('Role does not exist');
      
      // Assertions
      expect(userRepository.findByUsername).toHaveBeenCalledWith('testuser');
      expect(userRepository.findByEmail).toHaveBeenCalledWith('test@example.com');
      expect(roleRepository.findByName).toHaveBeenCalledWith('nonexistent_role');
      expect(userRepository.create).not.toHaveBeenCalled();
    });
  });
  
  describe('updateUser', () => {
    it('should update a user successfully', async () => {
      // Mock repository functions
      (userRepository.findById as jest.Mock).mockResolvedValue(testUser);
      (userRepository.update as jest.Mock).mockResolvedValue({
        ...testUser,
        first_name: 'Updated',
        last_name: 'Name'
      });
      
      // Call the function
      const result = await userService.updateUser('123e4567-e89b-12d3-a456-426614174000', {
        first_name: 'Updated',
        last_name: 'Name'
      });
      
      // Assertions
      expect(userRepository.findById).toHaveBeenCalledWith('123e4567-e89b-12d3-a456-426614174000');
      expect(userRepository.update).toHaveBeenCalledWith('123e4567-e89b-12d3-a456-426614174000', {
        first_name: 'Updated',
        last_name: 'Name'
      });
      expect(result).toEqual({
        ...testUser,
        first_name: 'Updated',
        last_name: 'Name'
      });
    });
    
    it('should update a user with new password', async () => {
      // Mock repository functions
      (userRepository.findById as jest.Mock).mockResolvedValue(testUser);
      (userRepository.update as jest.Mock).mockResolvedValue({
        ...testUser,
        password_hash: 'new_hashed_password'
      });
      
      // Mock bcrypt hash
      jest.spyOn(bcrypt, 'hash').mockImplementation(() => Promise.resolve('new_hashed_password'));
      
      // Call the function
      const result = await userService.updateUser(
        '123e4567-e89b-12d3-a456-426614174000',
        {},
        'new_password'
      );
      
      // Assertions
      expect(userRepository.findById).toHaveBeenCalledWith('123e4567-e89b-12d3-a456-426614174000');
      expect(bcrypt.hash).toHaveBeenCalledWith('new_password', 10);
      expect(userRepository.update).toHaveBeenCalledWith('123e4567-e89b-12d3-a456-426614174000', {
        password_hash: 'new_hashed_password'
      });
      expect(result).toEqual({
        ...testUser,
        password_hash: 'new_hashed_password'
      });
    });
    
    it('should throw an error if user does not exist', async () => {
      // Mock repository functions
      (userRepository.findById as jest.Mock).mockResolvedValue(null);
      
      // Call the function and expect it to throw
      await expect(userService.updateUser('nonexistent_id', {
        first_name: 'Updated'
      })).rejects.toThrow('User not found');
      
      // Assertions
      expect(userRepository.findById).toHaveBeenCalledWith('nonexistent_id');
      expect(userRepository.update).not.toHaveBeenCalled();
    });
    
    it('should throw an error if email already exists', async () => {
      // Mock repository functions
      (userRepository.findById as jest.Mock).mockResolvedValue(testUser);
      (userRepository.findByEmail as jest.Mock).mockResolvedValue({
        ...testUser,
        id: 'different_id'
      });
      
      // Call the function and expect it to throw
      await expect(userService.updateUser('123e4567-e89b-12d3-a456-426614174000', {
        email: 'existing@example.com'
      })).rejects.toThrow('Email already exists');
      
      // Assertions
      expect(userRepository.findById).toHaveBeenCalledWith('123e4567-e89b-12d3-a456-426614174000');
      expect(userRepository.findByEmail).toHaveBeenCalledWith('existing@example.com');
      expect(userRepository.update).not.toHaveBeenCalled();
    });
    
    it('should throw an error if role does not exist', async () => {
      // Mock repository functions
      (userRepository.findById as jest.Mock).mockResolvedValue(testUser);
      (roleRepository.findByName as jest.Mock).mockResolvedValue(null);
      
      // Call the function and expect it to throw
      await expect(userService.updateUser('123e4567-e89b-12d3-a456-426614174000', {
        role: 'nonexistent_role'
      })).rejects.toThrow('Role does not exist');
      
      // Assertions
      expect(userRepository.findById).toHaveBeenCalledWith('123e4567-e89b-12d3-a456-426614174000');
      expect(roleRepository.findByName).toHaveBeenCalledWith('nonexistent_role');
      expect(userRepository.update).not.toHaveBeenCalled();
    });
  });
  
  describe('getUserById', () => {
    it('should get a user by ID successfully', async () => {
      // Mock repository functions
      const userWithPermissions = {
        user: testUser,
        roles: ['user'],
        permissions: ['users:read']
      };
      (userRepository.getUserWithPermissions as jest.Mock).mockResolvedValue(userWithPermissions);
      
      // Call the function
      const result = await userService.getUserById('123e4567-e89b-12d3-a456-426614174000');
      
      // Assertions
      expect(userRepository.getUserWithPermissions).toHaveBeenCalledWith('123e4567-e89b-12d3-a456-426614174000');
      expect(result).toEqual({
        id: testUser.id,
        username: testUser.username,
        email: testUser.email,
        first_name: testUser.first_name,
        last_name: testUser.last_name,
        roles: ['user'],
        permissions: ['users:read'],
        is_active: testUser.is_active,
        created_at: testUser.created_at.toISOString(),
        updated_at: testUser.updated_at.toISOString()
      });
    });
    
    it('should return null if user does not exist', async () => {
      // Mock repository functions
      (userRepository.getUserWithPermissions as jest.Mock).mockResolvedValue(null);
      
      // Call the function
      const result = await userService.getUserById('nonexistent_id');
      
      // Assertions
      expect(userRepository.getUserWithPermissions).toHaveBeenCalledWith('nonexistent_id');
      expect(result).toBeNull();
    });
  });
  
  describe('getUsers', () => {
    it('should get users with filters', async () => {
      // Mock repository functions
      const users = [testUser];
      const total = 1;
      (userRepository.findAll as jest.Mock).mockResolvedValue({ users, total });
      
      // Call the function
      const result = await userService.getUsers({ role: 'user' }, 1, 10);
      
      // Assertions
      expect(userRepository.findAll).toHaveBeenCalledWith({ role: 'user' }, 1, 10);
      expect(result).toEqual({
        users: [{
          id: testUser.id,
          username: testUser.username,
          email: testUser.email,
          first_name: testUser.first_name,
          last_name: testUser.last_name,
          roles: [testUser.role],
          is_active: testUser.is_active,
          created_at: testUser.created_at.toISOString(),
          updated_at: testUser.updated_at.toISOString()
        }],
        total: 1,
        totalPages: 1
      });
    });
  });
  
  describe('activateUser', () => {
    it('should activate a user successfully', async () => {
      // Mock repository functions
      const activatedUser = { ...testUser, is_active: true };
      (userRepository.activate as jest.Mock).mockResolvedValue(activatedUser);
      
      // Call the function
      const result = await userService.activateUser('123e4567-e89b-12d3-a456-426614174000');
      
      // Assertions
      expect(userRepository.activate).toHaveBeenCalledWith('123e4567-e89b-12d3-a456-426614174000');
      expect(result).toEqual({
        id: activatedUser.id,
        username: activatedUser.username,
        email: activatedUser.email,
        first_name: activatedUser.first_name,
        last_name: activatedUser.last_name,
        roles: [activatedUser.role],
        is_active: activatedUser.is_active,
        created_at: activatedUser.created_at.toISOString(),
        updated_at: activatedUser.updated_at.toISOString()
      });
    });
    
    it('should return null if user does not exist', async () => {
      // Mock repository functions
      (userRepository.activate as jest.Mock).mockResolvedValue(null);
      
      // Call the function
      const result = await userService.activateUser('nonexistent_id');
      
      // Assertions
      expect(userRepository.activate).toHaveBeenCalledWith('nonexistent_id');
      expect(result).toBeNull();
    });
  });
  
  describe('deactivateUser', () => {
    it('should deactivate a user successfully', async () => {
      // Mock repository functions
      const deactivatedUser = { ...testUser, is_active: false };
      (userRepository.deactivate as jest.Mock).mockResolvedValue(deactivatedUser);
      
      // Call the function
      const result = await userService.deactivateUser('123e4567-e89b-12d3-a456-426614174000');
      
      // Assertions
      expect(userRepository.deactivate).toHaveBeenCalledWith('123e4567-e89b-12d3-a456-426614174000');
      expect(result).toEqual({
        id: deactivatedUser.id,
        username: deactivatedUser.username,
        email: deactivatedUser.email,
        first_name: deactivatedUser.first_name,
        last_name: deactivatedUser.last_name,
        roles: [deactivatedUser.role],
        is_active: deactivatedUser.is_active,
        created_at: deactivatedUser.created_at.toISOString(),
        updated_at: deactivatedUser.updated_at.toISOString()
      });
    });
    
    it('should return null if user does not exist', async () => {
      // Mock repository functions
      (userRepository.deactivate as jest.Mock).mockResolvedValue(null);
      
      // Call the function
      const result = await userService.deactivateUser('nonexistent_id');
      
      // Assertions
      expect(userRepository.deactivate).toHaveBeenCalledWith('nonexistent_id');
      expect(result).toBeNull();
    });
  });
  
  describe('deleteUser', () => {
    it('should delete a user successfully', async () => {
      // Mock repository functions
      (userRepository.delete as jest.Mock).mockResolvedValue(true);
      
      // Call the function
      const result = await userService.deleteUser('123e4567-e89b-12d3-a456-426614174000');
      
      // Assertions
      expect(userRepository.delete).toHaveBeenCalledWith('123e4567-e89b-12d3-a456-426614174000');
      expect(result).toBe(true);
    });
    
    it('should return false if user does not exist', async () => {
      // Mock repository functions
      (userRepository.delete as jest.Mock).mockResolvedValue(false);
      
      // Call the function
      const result = await userService.deleteUser('nonexistent_id');
      
      // Assertions
      expect(userRepository.delete).toHaveBeenCalledWith('nonexistent_id');
      expect(result).toBe(false);
    });
  });
  
  describe('changePassword', () => {
    it('should change password successfully', async () => {
      // Mock repository functions
      (userRepository.findById as jest.Mock).mockResolvedValue(testUser);
      (userRepository.update as jest.Mock).mockResolvedValue({
        ...testUser,
        password_hash: 'new_hashed_password'
      });
      
      // Mock bcrypt functions
      jest.spyOn(bcrypt, 'compare').mockImplementation(() => Promise.resolve(true));
      jest.spyOn(bcrypt, 'hash').mockImplementation(() => Promise.resolve('new_hashed_password'));
      
      // Call the function
      const result = await userService.changePassword(
        '123e4567-e89b-12d3-a456-426614174000',
        'current_password',
        'new_password'
      );
      
      // Assertions
      expect(userRepository.findById).toHaveBeenCalledWith('123e4567-e89b-12d3-a456-426614174000');
      expect(bcrypt.compare).toHaveBeenCalledWith('current_password', 'hashed_password');
      expect(bcrypt.hash).toHaveBeenCalledWith('new_password', 10);
      expect(userRepository.update).toHaveBeenCalledWith('123e4567-e89b-12d3-a456-426614174000', {
        password_hash: 'new_hashed_password'
      });
      expect(result).toBe(true);
    });
    
    it('should throw an error if user does not exist', async () => {
      // Mock repository functions
      (userRepository.findById as jest.Mock).mockResolvedValue(null);
      
      // Call the function and expect it to throw
      await expect(userService.changePassword(
        'nonexistent_id',
        'current_password',
        'new_password'
      )).rejects.toThrow('User not found');
      
      // Assertions
      expect(userRepository.findById).toHaveBeenCalledWith('nonexistent_id');
      expect(userRepository.update).not.toHaveBeenCalled();
    });
    
    it('should throw an error if current password is incorrect', async () => {
      // Mock repository functions
      (userRepository.findById as jest.Mock).mockResolvedValue(testUser);
      
      // Mock bcrypt functions
      jest.spyOn(bcrypt, 'compare').mockImplementation(() => Promise.resolve(false));
      
      // Call the function and expect it to throw
      await expect(userService.changePassword(
        '123e4567-e89b-12d3-a456-426614174000',
        'wrong_password',
        'new_password'
      )).rejects.toThrow('Current password is incorrect');
      
      // Assertions
      expect(userRepository.findById).toHaveBeenCalledWith('123e4567-e89b-12d3-a456-426614174000');
      expect(bcrypt.compare).toHaveBeenCalledWith('wrong_password', 'hashed_password');
      expect(userRepository.update).not.toHaveBeenCalled();
    });
  });
  
  describe('resetPassword', () => {
    it('should reset password successfully', async () => {
      // Mock repository functions
      (userRepository.findById as jest.Mock).mockResolvedValue(testUser);
      (userRepository.update as jest.Mock).mockResolvedValue({
        ...testUser,
        password_hash: 'new_hashed_password'
      });
      
      // Mock bcrypt functions
      jest.spyOn(bcrypt, 'hash').mockImplementation(() => Promise.resolve('new_hashed_password'));
      
      // Call the function
      const result = await userService.resetPassword(
        '123e4567-e89b-12d3-a456-426614174000',
        'new_password'
      );
      
      // Assertions
      expect(userRepository.findById).toHaveBeenCalledWith('123e4567-e89b-12d3-a456-426614174000');
      expect(bcrypt.hash).toHaveBeenCalledWith('new_password', 10);
      expect(userRepository.update).toHaveBeenCalledWith('123e4567-e89b-12d3-a456-426614174000', {
        password_hash: 'new_hashed_password'
      });
      expect(result).toBe(true);
    });
    
    it('should throw an error if user does not exist', async () => {
      // Mock repository functions
      (userRepository.findById as jest.Mock).mockResolvedValue(null);
      
      // Call the function and expect it to throw
      await expect(userService.resetPassword(
        'nonexistent_id',
        'new_password'
      )).rejects.toThrow('User not found');
      
      // Assertions
      expect(userRepository.findById).toHaveBeenCalledWith('nonexistent_id');
      expect(userRepository.update).not.toHaveBeenCalled();
    });
  });
  
  describe('validatePassword', () => {
    it('should validate password successfully', async () => {
      // Mock bcrypt functions
      jest.spyOn(bcrypt, 'compare').mockImplementation(() => Promise.resolve(true));
      
      // Call the function
      const result = await userService.validatePassword('password', 'hashed_password');
      
      // Assertions
      expect(bcrypt.compare).toHaveBeenCalledWith('password', 'hashed_password');
      expect(result).toBe(true);
    });
    
    it('should return false for invalid password', async () => {
      // Mock bcrypt functions
      jest.spyOn(bcrypt, 'compare').mockImplementation(() => Promise.resolve(false));
      
      // Call the function
      const result = await userService.validatePassword('wrong_password', 'hashed_password');
      
      // Assertions
      expect(bcrypt.compare).toHaveBeenCalledWith('wrong_password', 'hashed_password');
      expect(result).toBe(false);
    });
  });
});