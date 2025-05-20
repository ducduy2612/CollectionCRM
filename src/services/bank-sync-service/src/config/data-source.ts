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
  entities: [__dirname + '/../models/**/*.entity{.ts,.js}'],
  synchronize: env.isDevelopment(), // Auto-create database schema in development
  logging: env.isDevelopment()
});