import { DataSource } from 'typeorm';
import { env } from './env.config';

// Create and export the DataSource instance
export const AppDataSource = new DataSource({
  type: 'postgres',
  host: env.DB_HOST,
  port: env.DB_PORT,
  username: env.DB_USERNAME,
  password: env.DB_PASSWORD,
  database: env.DB_DATABASE,
  schema: 'bank_sync_service', // Specify the schema name
  entities: [__dirname + '/../models/**/*.entity{.ts,.js}'],
  synchronize: false, // Temporarily disabled to prevent schema sync issues
  logging: env.isDevelopment()
});