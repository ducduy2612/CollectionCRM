import request, { Response } from 'supertest';
import app from '../../src/index';
import { Express } from 'express';

// Mock axios
jest.mock('axios', () => ({
  post: jest.fn(),
  get: jest.fn()
}));
// Get the mocked axios
const mockedAxios = require('axios');

describe('Authentication Service Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Login Endpoint', () => {
    it('should forward login requests to auth service', async () => {
      // Mock auth service response
      const mockResponse = {
        data: {
          success: true,
          data: {
            user: {
              id: 'user123',
              username: 'testuser',
              name: 'Test User',
              email: 'test@example.com',
              roles: ['AGENT'],
              permissions: ['VIEW_CUSTOMERS']
            },
            token: 'mock-jwt-token',
            refreshToken: 'mock-refresh-token',
            expiresAt: new Date().toISOString()
          },
          message: 'Login successful',
          errors: []
        }
      };

      // Setup axios mock for token validation
      mockedAxios.post.mockResolvedValueOnce(mockResponse);

      // Test the login endpoint
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'testuser',
          password: 'password123',
          deviceInfo: {
            deviceType: 'DESKTOP',
            browser: 'Chrome'
          }
        });

      // Verify response
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user).toBeDefined();
      expect(response.body.data.token).toBeDefined();
    });

    it('should apply rate limiting to login requests', async () => {
      // Make multiple requests to trigger rate limiting
      const requests: Promise<Response>[] = [];
      for (let i = 0; i < 12; i++) {
        requests.push(
          request(app as any)
            .post('/api/auth/login')
            .send({
              username: `user${i}`,
              password: 'password123'
            })
        );
      }

      // Wait for all requests to complete
      const responses = await Promise.all(requests);
      
      // At least one request should be rate limited (429)
      const rateLimited = responses.some(res => res.status === 429);
      expect(rateLimited).toBe(true);
    });
  });

  describe('Token Validation', () => {
    it('should validate JWT tokens', async () => {
      // Mock auth service response for token validation
      const mockValidationResponse = {
        data: {
          success: true,
          data: {
            valid: true,
            user: {
              id: 'user123',
              username: 'testuser',
              roles: ['AGENT'],
              permissions: ['VIEW_CUSTOMERS']
            }
          },
          message: 'Token is valid',
          errors: []
        }
      };

      // Setup axios mock for token validation
      mockedAxios.post.mockResolvedValueOnce(mockValidationResponse);

      // Test the token validation endpoint
      const response = await request(app)
        .post('/api/auth/token/validate')
        .send({
          token: 'valid-jwt-token'
        });

      // Verify response
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.valid).toBe(true);
      expect(response.body.data.user).toBeDefined();
    });

    it('should reject invalid JWT tokens', async () => {
      // Mock auth service response for invalid token
      const mockInvalidResponse = {
        data: {
          success: false,
          data: {
            valid: false
          },
          message: 'Token is invalid',
          errors: [{ code: 'INVALID_TOKEN', message: 'Invalid or expired token' }]
        }
      };

      // Setup axios mock for token validation
      mockedAxios.post.mockResolvedValueOnce(mockInvalidResponse);

      // Test the token validation endpoint with invalid token
      const response = await request(app)
        .post('/api/auth/token/validate')
        .send({
          token: 'invalid-jwt-token'
        });

      // Verify response
      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.data.valid).toBe(false);
    });
  });

  describe('Protected Routes', () => {
    it('should require authentication for protected routes', async () => {
      // Test accessing a protected route without authentication
      const response = await request(app)
        .get('/api/auth/users');

      // Verify response
      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Unauthorized');
    });

    it('should allow access to protected routes with valid authentication', async () => {
      // Mock auth service response for token validation
      const mockValidationResponse = {
        data: {
          success: true,
          data: {
            valid: true,
            user: {
              id: 'user123',
              username: 'testuser',
              roles: ['ADMIN'],
              permissions: ['MANAGE_USERS']
            }
          },
          message: 'Token is valid',
          errors: []
        }
      };

      // Mock users response
      const mockUsersResponse = {
        data: {
          success: true,
          data: {
            users: [
              {
                id: 'user123',
                username: 'testuser',
                email: 'test@example.com',
                roles: ['ADMIN'],
                isActive: true
              }
            ],
            pagination: {
              page: 1,
              pageSize: 10,
              totalPages: 1,
              totalItems: 1
            }
          },
          message: 'Users retrieved successfully',
          errors: []
        }
      };

      // Setup axios mocks
      mockedAxios.post.mockResolvedValueOnce(mockValidationResponse);
      mockedAxios.get.mockResolvedValueOnce(mockUsersResponse);

      // Test accessing a protected route with authentication
      const response = await request(app)
        .get('/api/auth/users')
        .set('Authorization', 'Bearer valid-jwt-token');

      // Verify response
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.users).toBeDefined();
    });
  });
});