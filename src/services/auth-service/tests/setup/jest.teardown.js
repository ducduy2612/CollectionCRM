// Global teardown for Jest
module.exports = async () => {
  console.log('Running global teardown...');
  
  try {
    // Import and destroy the database connection
    const { testDb } = require('./test-db-config');
    await testDb.destroy();
    console.log('Database connection closed successfully');
  } catch (error) {
    console.error('Error closing database connection:', error);
  }

  // Force exit after cleanup
  console.log('Teardown complete, forcing exit...');
  process.exit(0);
};