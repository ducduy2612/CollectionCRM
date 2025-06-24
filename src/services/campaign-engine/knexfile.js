require('dotenv').config();

module.exports = {
  development: {
    client: 'postgresql',
    connection: {
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      database: process.env.DB_NAME || 'collectioncrm',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres'
    },
    searchPath: [process.env.DB_SCHEMA || 'campaign_engine', 'public'],
    migrations: {
      directory: './database/migrations',
      tableName: 'knex_migrations',
      schemaName: process.env.DB_SCHEMA || 'campaign_engine'
    },
    seeds: {
      directory: './database/seeds'
    }
  },
  
  production: {
    client: 'postgresql',
    connection: {
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD
    },
    searchPath: [process.env.DB_SCHEMA || 'campaign_engine', 'public'],
    migrations: {
      directory: './database/migrations',
      tableName: 'knex_migrations',
      schemaName: process.env.DB_SCHEMA || 'campaign_engine'
    },
    pool: {
      min: 2,
      max: 10
    }
  }
};