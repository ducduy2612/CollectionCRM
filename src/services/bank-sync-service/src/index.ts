import 'reflect-metadata';
import app from './app';
import { env } from './config/env.config';
import { AppDataSource } from './config/data-source';

// Start the server
const startServer = async () => {
  try {
    // Initialize database connection
    await AppDataSource.initialize();
    
    console.log('Connected to database');
    
    // Start Express server
    const PORT = parseInt(env.PORT, 10);
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`API available at ${env.API_PREFIX}`);
    });
  } catch (error) {
    console.error('Error starting server:', error);
    process.exit(1);
  }
};

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled promise rejection:', err);
  process.exit(1);
});

// Start the server
startServer();