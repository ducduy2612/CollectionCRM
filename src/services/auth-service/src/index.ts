import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { sessionService } from './services/session-service';
import { getRedisClient, closeAllRedisClients } from '../../../common/redis';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(helmet());
app.use(morgan('combined'));
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Routes will be added here
// Example authentication routes
app.post('/login', async (req, res) => {
  // This is a placeholder - actual implementation would validate credentials
  // against a database and Active Directory
  const { username, password } = req.body;
  
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }
  
  // Mock user for demonstration
  const mockUser = {
    id: '123',
    username,
    roles: ['USER'],
    permissions: ['READ_PROFILE', 'UPDATE_PROFILE']
  };
  
  // Create session with device info
  const deviceInfo = {
    userAgent: req.headers['user-agent'] || '',
    ip: req.ip || req.connection.remoteAddress || ''
  };
  
  try {
    const session = await sessionService.createSession(mockUser, deviceInfo);
    
    res.status(200).json({
      success: true,
      user: {
        id: session.userId,
        username: session.username,
        roles: session.roles
      },
      token: session.token,
      refreshToken: session.refreshToken,
      expiresAt: session.expiresAt
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
});

app.post('/token/validate', async (req, res) => {
  const { token } = req.body;
  
  if (!token) {
    return res.status(400).json({ error: 'Token is required' });
  }
  
  try {
    const result = await sessionService.validateToken(token);
    res.status(200).json(result);
  } catch (error) {
    console.error('Token validation error:', error);
    res.status(500).json({ error: 'Token validation failed' });
  }
});

app.post('/token/refresh', async (req, res) => {
  const { refreshToken } = req.body;
  
  if (!refreshToken) {
    return res.status(400).json({ error: 'Refresh token is required' });
  }
  
  try {
    const result = await sessionService.refreshToken(refreshToken);
    
    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(401).json({ error: result.reason || 'Token refresh failed' });
    }
  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(500).json({ error: 'Token refresh failed' });
  }
});

app.post('/logout', async (req, res) => {
  const { sessionId } = req.body;
  
  if (!sessionId) {
    return res.status(400).json({ error: 'Session ID is required' });
  }
  
  try {
    await sessionService.revokeSession(sessionId);
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Logout failed' });
  }
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'production' ? 'Something went wrong' : err.message,
  });
});

// Start the server
const server = app.listen(PORT, () => {
  console.log(`Authentication Service running on port ${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(async () => {
    console.log('HTTP server closed');
    
    // Close all Redis connections
    await closeAllRedisClients();
    console.log('Redis connections closed');
    
    process.exit(0);
  });
});

export default app;