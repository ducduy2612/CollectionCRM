import { RoleService } from '../../../src/services/role.service';
import { roleRepository } from '../../../src/repositories/role.repository';

// Mock the repository
jest.mock('../../../src/repositories/role.repository');

describe('RoleService', () => {
  let roleService: RoleService;
  
  // Sample test data
  const testRole = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    name: 'test_role',
    description: 'Test Role',
    created_at: new Date(),
    updated_at: new Date()
  };
  
  const testPermissions = [
    { resource: 'users', action: 'read' },
    { resource: 'users', action: 'create' }
  ];
  
  const testRoleWithPermissions = {
    role: testRole,
    permissions: ['users:read', 'users:create']
  };
  
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    
    // Create a new instance of RoleService for each test
    roleService = new RoleService();
  });
  
  describe('createRole', () => {
    it('should create a new role successfully', async () => {
      // Mock repository functions
      (roleRepository.findByName as jest.Mock).mockResolvedValue(null);
      (roleRepository.create as jest.Mock).mockResolvedValue(testRole);
      (roleRepository.setPermissions as jest.Mock).mockResolvedValue(true);
      (roleRepository.getRoleWithPermissions as jest.Mock).mockResolvedValue(testRoleWithPermissions);
      
      // Call the function
      const result = await roleService.createRole(
        { name: 'test_role', description: 'Test Role' },
        testPermissions
      );
      
      // Assertions
      expect(roleRepository.findByName).toHaveBeenCalledWith('test_role');
      expect(roleRepository.create).toHaveBeenCalledWith({
        name: 'test_role',
        description: 'Test Role'
      });
      expect(roleRepository.setPermissions).toHaveBeenCalledWith(testRole.id, testPermissions);
      expect(roleRepository.getRoleWithPermissions).toHaveBeenCalledWith(testRole.id);
      expect(result).toEqual({
        id: testRole.id,
        name: testRole.name,
        description: testRole.description,
        permissions: testRoleWithPermissions.permissions,
        created_at: testRole.created_at.toISOString(),
        updated_at: testRole.updated_at.toISOString()
      });
    });
    
    it('should throw an error if role name already exists', async () => {
      // Mock repository functions
      (roleRepository.findByName as jest.Mock).mockResolvedValue(testRole);
      
      // Call the function and expect it to throw
      await expect(roleService.createRole({
        name: 'test_role',
        description: 'Test Role'
      })).rejects.toThrow('Role name already exists');
      
      // Assertions
      expect(roleRepository.findByName).toHaveBeenCalledWith('test_role');
      expect(roleRepository.create).not.toHaveBeenCalled();
    });
    
    it('should throw an error if role creation fails', async () => {
      // Mock repository functions
      (roleRepository.findByName as jest.Mock).mockResolvedValue(null);
      (roleRepository.create as jest.Mock).mockResolvedValue(testRole);
      (roleRepository.getRoleWithPermissions as jest.Mock).mockResolvedValue(null);
      
      // Call the function and expect it to throw
      await expect(roleService.createRole({
        name: 'test_role',
        description: 'Test Role'
      })).rejects.toThrow('Failed to retrieve created role');
      
      // Assertions
      expect(roleRepository.findByName).toHaveBeenCalledWith('test_role');
      expect(roleRepository.create).toHaveBeenCalledWith({
        name: 'test_role',
        description: 'Test Role'
      });
    });
  });
  
  describe('updateRole', () => {
    it('should update a role successfully', async () => {
      // Mock repository functions
      (roleRepository.findById as jest.Mock).mockResolvedValue(testRole);
      (roleRepository.update as jest.Mock).mockResolvedValue({
        ...testRole,
        description: 'Updated Description'
      });
      (roleRepository.getRoleWithPermissions as jest.Mock).mockResolvedValue({
        role: {
          ...testRole,
          description: 'Updated Description'
        },
        permissions: testRoleWithPermissions.permissions
      });
      
      // Call the function
      const result = await roleService.updateRole(
        testRole.id,
        { description: 'Updated Description' }
      );
      
      // Assertions
      expect(roleRepository.findById).toHaveBeenCalledWith(testRole.id);
      expect(roleRepository.update).toHaveBeenCalledWith(testRole.id, {
        description: 'Updated Description'
      });
      expect(roleRepository.getRoleWithPermissions).toHaveBeenCalledWith(testRole.id);
      expect(result).toEqual({
        id: testRole.id,
        name: testRole.name,
        description: 'Updated Description',
        permissions: testRoleWithPermissions.permissions,
        created_at: testRole.created_at.toISOString(),
        updated_at: testRole.updated_at.toISOString()
      });
    });
    
    it('should update a role with permissions', async () => {
      // Mock repository functions
      (roleRepository.findById as jest.Mock).mockResolvedValue(testRole);
      (roleRepository.update as jest.Mock).mockResolvedValue(testRole);
      (roleRepository.setPermissions as jest.Mock).mockResolvedValue(true);
      (roleRepository.getRoleWithPermissions as jest.Mock).mockResolvedValue({
        role: testRole,
        permissions: ['users:read', 'users:create', 'users:update']
      });
      
      const newPermissions = [
        { resource: 'users', action: 'read' },
        { resource: 'users', action: 'create' },
        { resource: 'users', action: 'update' }
      ];
      
      // Call the function
      const result = await roleService.updateRole(
        testRole.id,
        { description: testRole.description },
        newPermissions
      );
      
      // Assertions
      expect(roleRepository.findById).toHaveBeenCalledWith(testRole.id);
      expect(roleRepository.update).toHaveBeenCalledWith(testRole.id, {
        description: testRole.description
      });
      expect(roleRepository.setPermissions).toHaveBeenCalledWith(testRole.id, newPermissions);
      expect(roleRepository.getRoleWithPermissions).toHaveBeenCalledWith(testRole.id);
      expect(result).toEqual({
        id: testRole.id,
        name: testRole.name,
        description: testRole.description,
        permissions: ['users:read', 'users:create', 'users:update'],
        created_at: testRole.created_at.toISOString(),
        updated_at: testRole.updated_at.toISOString()
      });
    });
    
    it('should throw an error if role does not exist', async () => {
      // Mock repository functions
      (roleRepository.findById as jest.Mock).mockResolvedValue(null);
      
      // Call the function and expect it to throw
      await expect(roleService.updateRole(
        'nonexistent_id',
        { description: 'Updated Description' }
      )).rejects.toThrow('Role not found');
      
      // Assertions
      expect(roleRepository.findById).toHaveBeenCalledWith('nonexistent_id');
      expect(roleRepository.update).not.toHaveBeenCalled();
    });
    
    it('should return null if update fails', async () => {
      // Mock repository functions
      (roleRepository.findById as jest.Mock).mockResolvedValue(testRole);
      (roleRepository.update as jest.Mock).mockResolvedValue(null);
      
      // Call the function
      const result = await roleService.updateRole(
        testRole.id,
        { description: 'Updated Description' }
      );
      
      // Assertions
      expect(roleRepository.findById).toHaveBeenCalledWith(testRole.id);
      expect(roleRepository.update).toHaveBeenCalledWith(testRole.id, {
        description: 'Updated Description'
      });
      expect(result).toBeNull();
    });
    
    it('should throw an error if role retrieval after update fails', async () => {
      // Mock repository functions
      (roleRepository.findById as jest.Mock).mockResolvedValue(testRole);
      (roleRepository.update as jest.Mock).mockResolvedValue(testRole);
      (roleRepository.getRoleWithPermissions as jest.Mock).mockResolvedValue(null);
      
      // Call the function and expect it to throw
      await expect(roleService.updateRole(
        testRole.id,
        { description: 'Updated Description' }
      )).rejects.toThrow('Failed to retrieve updated role');
      
      // Assertions
      expect(roleRepository.findById).toHaveBeenCalledWith(testRole.id);
      expect(roleRepository.update).toHaveBeenCalledWith(testRole.id, {
        description: 'Updated Description'
      });
      expect(roleRepository.getRoleWithPermissions).toHaveBeenCalledWith(testRole.id);
    });
  });
  
  describe('getRoleById', () => {
    it('should get a role by ID successfully', async () => {
      // Mock repository functions
      (roleRepository.getRoleWithPermissions as jest.Mock).mockResolvedValue(testRoleWithPermissions);
      
      // Call the function
      const result = await roleService.getRoleById(testRole.id);
      
      // Assertions
      expect(roleRepository.getRoleWithPermissions).toHaveBeenCalledWith(testRole.id);
      expect(result).toEqual({
        id: testRole.id,
        name: testRole.name,
        description: testRole.description,
        permissions: testRoleWithPermissions.permissions,
        created_at: testRole.created_at.toISOString(),
        updated_at: testRole.updated_at.toISOString()
      });
    });
    
    it('should return null if role does not exist', async () => {
      // Mock repository functions
      (roleRepository.getRoleWithPermissions as jest.Mock).mockResolvedValue(null);
      
      // Call the function
      const result = await roleService.getRoleById('nonexistent_id');
      
      // Assertions
      expect(roleRepository.getRoleWithPermissions).toHaveBeenCalledWith('nonexistent_id');
      expect(result).toBeNull();
    });
  });
  
  describe('getAllRoles', () => {
    it('should get all roles successfully', async () => {
      // Mock repository functions
      const roles = [testRole, { ...testRole, id: '123e4567-e89b-12d3-a456-426614174001', name: 'another_role' }];
      (roleRepository.findAll as jest.Mock).mockResolvedValue(roles);
      (roleRepository.getRoleWithPermissions as jest.Mock)
        .mockResolvedValueOnce(testRoleWithPermissions)
        .mockResolvedValueOnce({
          role: roles[1],
          permissions: ['users:read']
        });
      
      // Call the function
      const result = await roleService.getAllRoles();
      
      // Assertions
      expect(roleRepository.findAll).toHaveBeenCalled();
      expect(roleRepository.getRoleWithPermissions).toHaveBeenCalledTimes(2);
      expect(roleRepository.getRoleWithPermissions).toHaveBeenCalledWith(testRole.id);
      expect(roleRepository.getRoleWithPermissions).toHaveBeenCalledWith('123e4567-e89b-12d3-a456-426614174001');
      expect(result).toEqual([
        {
          id: testRole.id,
          name: testRole.name,
          description: testRole.description,
          permissions: testRoleWithPermissions.permissions,
          created_at: testRole.created_at.toISOString(),
          updated_at: testRole.updated_at.toISOString()
        },
        {
          id: '123e4567-e89b-12d3-a456-426614174001',
          name: 'another_role',
          description: testRole.description,
          permissions: ['users:read'],
          created_at: testRole.created_at.toISOString(),
          updated_at: testRole.updated_at.toISOString()
        }
      ]);
    });
    
    it('should skip roles with missing permissions', async () => {
      // Mock repository functions
      const roles = [testRole, { ...testRole, id: '123e4567-e89b-12d3-a456-426614174001', name: 'another_role' }];
      (roleRepository.findAll as jest.Mock).mockResolvedValue(roles);
      (roleRepository.getRoleWithPermissions as jest.Mock)
        .mockResolvedValueOnce(testRoleWithPermissions)
        .mockResolvedValueOnce(null);
      
      // Call the function
      const result = await roleService.getAllRoles();
      
      // Assertions
      expect(roleRepository.findAll).toHaveBeenCalled();
      expect(roleRepository.getRoleWithPermissions).toHaveBeenCalledTimes(2);
      expect(result).toEqual([
        {
          id: testRole.id,
          name: testRole.name,
          description: testRole.description,
          permissions: testRoleWithPermissions.permissions,
          created_at: testRole.created_at.toISOString(),
          updated_at: testRole.updated_at.toISOString()
        }
      ]);
    });
  });
  
  describe('deleteRole', () => {
    it('should delete a role successfully', async () => {
      // Mock repository functions
      (roleRepository.delete as jest.Mock).mockResolvedValue(true);
      
      // Call the function
      const result = await roleService.deleteRole(testRole.id);
      
      // Assertions
      expect(roleRepository.delete).toHaveBeenCalledWith(testRole.id);
      expect(result).toBe(true);
    });
    
    it('should return false if role deletion fails', async () => {
      // Mock repository functions
      (roleRepository.delete as jest.Mock).mockResolvedValue(false);
      
      // Call the function
      const result = await roleService.deleteRole('nonexistent_id');
      
      // Assertions
      expect(roleRepository.delete).toHaveBeenCalledWith('nonexistent_id');
      expect(result).toBe(false);
    });
  });
  
  describe('getUsersWithRole', () => {
    it('should get users with role successfully', async () => {
      // Mock repository functions
      const users = [{ id: 'user1', username: 'user1' }, { id: 'user2', username: 'user2' }];
      const total = 2;
      (roleRepository.getUsersWithRole as jest.Mock).mockResolvedValue({ users, total });
      
      // Call the function
      const result = await roleService.getUsersWithRole(testRole.id, 1, 10);
      
      // Assertions
      expect(roleRepository.getUsersWithRole).toHaveBeenCalledWith(testRole.id, 1, 10);
      expect(result).toEqual({
        users,
        total,
        totalPages: 1
      });
    });
  });
  
  describe('assignRoleToUsers', () => {
    it('should assign role to users successfully', async () => {
      // Mock repository functions
      (roleRepository.assignRoleToUsers as jest.Mock).mockResolvedValue(2);
      
      // Call the function
      const result = await roleService.assignRoleToUsers(testRole.id, ['user1', 'user2']);
      
      // Assertions
      expect(roleRepository.assignRoleToUsers).toHaveBeenCalledWith(testRole.id, ['user1', 'user2']);
      expect(result).toBe(2);
    });
  });
  
  describe('addPermission', () => {
    it('should add permission successfully', async () => {
      // Mock repository functions
      (roleRepository.findById as jest.Mock).mockResolvedValue(testRole);
      (roleRepository.addPermission as jest.Mock).mockResolvedValue({
        id: 'perm1',
        role_id: testRole.id,
        resource: 'users',
        action: 'update',
        created_at: new Date(),
        updated_at: new Date()
      });
      
      // Call the function
      const result = await roleService.addPermission(testRole.id, 'users', 'update');
      
      // Assertions
      expect(roleRepository.findById).toHaveBeenCalledWith(testRole.id);
      expect(roleRepository.addPermission).toHaveBeenCalledWith({
        role_id: testRole.id,
        resource: 'users',
        action: 'update'
      });
      expect(result).toBe(true);
    });
    
    it('should throw an error if role does not exist', async () => {
      // Mock repository functions
      (roleRepository.findById as jest.Mock).mockResolvedValue(null);
      
      // Call the function and expect it to throw
      await expect(roleService.addPermission(
        'nonexistent_id',
        'users',
        'update'
      )).rejects.toThrow('Role not found');
      
      // Assertions
      expect(roleRepository.findById).toHaveBeenCalledWith('nonexistent_id');
      expect(roleRepository.addPermission).not.toHaveBeenCalled();
    });
  });
  
  describe('removePermission', () => {
    it('should remove permission successfully', async () => {
      // Mock repository functions
      (roleRepository.removePermission as jest.Mock).mockResolvedValue(true);
      
      // Call the function
      const result = await roleService.removePermission(testRole.id, 'users', 'update');
      
      // Assertions
      expect(roleRepository.removePermission).toHaveBeenCalledWith(testRole.id, 'users', 'update');
      expect(result).toBe(true);
    });
  });
  
  describe('setPermissions', () => {
    it('should set permissions successfully', async () => {
      // Mock repository functions
      (roleRepository.setPermissions as jest.Mock).mockResolvedValue(true);
      
      const permissions = [
        { resource: 'users', action: 'read' },
        { resource: 'users', action: 'create' }
      ];
      
      // Call the function
      const result = await roleService.setPermissions(testRole.id, permissions);
      
      // Assertions
      expect(roleRepository.setPermissions).toHaveBeenCalledWith(testRole.id, permissions);
      expect(result).toBe(true);
    });
  });
});