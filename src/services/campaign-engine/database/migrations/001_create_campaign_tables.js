const fs = require('fs');
const path = require('path');

exports.up = async function(knex) {
  // Read the SQL file and execute it
  const sqlFile = path.join(__dirname, 'create_campaign_tables.sql');
  const sql = fs.readFileSync(sqlFile, 'utf8');
  
  // Execute the SQL statements
  await knex.raw(sql);
};

exports.down = async function(knex) {
  // Drop the campaign_engine schema
  await knex.raw('DROP SCHEMA IF EXISTS campaign_engine CASCADE');
};