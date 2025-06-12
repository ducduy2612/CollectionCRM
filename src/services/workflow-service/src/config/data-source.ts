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
  schema: 'workflow_service', // Specify the schema name
  entities: [__dirname + '/../entities/**/*.entity{.ts,.js}'],
  synchronize: false, // Use migrations in production
  logging: false
});