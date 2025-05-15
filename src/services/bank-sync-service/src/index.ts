import 'reflect-metadata';
import { createConnection } from 'typeorm';
import app from './app';
import { env } from './config/env.config';

// Start the server
const startServer = async () => {
  try {
    // Connect to database
    await createConnection({
      type: 'postgres',
      host: env.DB_HOST,
      port: env.DB_PORT,
      username: env.DB_USERNAME,
      password: env.DB_PASSWORD,
      database: env.DB_DATABASE,
      entities: [__dirname + '/models/**/*.entity{.ts,.js}'],
      synchronize: env.isDevelopment(), // Auto-create database schema in development
      logging: env.isDevelopment()
    });
    
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