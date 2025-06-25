#!/usr/bin/env node

/**
 * Campaign-Engine Test Runner
 * 
 * This is the main entry point for running campaign-engine tests.
 * Run this from the campaign-engine directory: node tests/run-tests.js
 */

const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('🚀 Campaign-Engine Test Suite');
console.log('=' .repeat(50));

function showUsage() {
  console.log('\nUsage: node tests/run-tests.js [command]');
  console.log('\nCommands:');
  console.log('  setup     - Setup test data in database');
  console.log('  jest      - Run Jest test suite');
  console.log('  quick     - Run quick manual test');
  console.log('  full      - Run full test suite');
  console.log('  cleanup   - Remove test data from database');
  console.log('  verify    - Verify test data in database');
  console.log('  help      - Show this help message');
  console.log('\nExamples:');
  console.log('  node tests/run-tests.js setup');
  console.log('  node tests/run-tests.js jest');
  console.log('  node tests/run-tests.js quick');
  console.log('');
}

async function runCommand(command, description) {
  return new Promise((resolve, reject) => {
    console.log(`\n📋 ${description}`);
    
    const startTime = Date.now();
    exec(command, (error, stdout, stderr) => {
      const duration = Date.now() - startTime;
      
      if (error) {
        console.error(`❌ Error: ${error.message}`);
        if (stderr) console.error(`stderr: ${stderr}`);
        reject(error);
        return;
      }
      
      if (stderr && stderr.trim()) {
        console.log(`⚠️  Warnings: ${stderr}`);
      }
      
      if (stdout && stdout.trim()) {
        console.log(stdout);
      }
      
      console.log(`✅ Completed in ${duration}ms`);
      resolve(stdout);
    });
  });
}

async function setupTestData() {
  console.log('\n💾 Setting Up Test Data');
  console.log('-'.repeat(30));
  
  try {
    // Try direct psql command first
    await runCommand(
      'psql -d collectioncrm -f tests/scripts/setup-test-data.sql',
      'Running setup script with psql'
    );
  } catch (error) {
    console.log('\n⚠️  Direct psql failed. Trying Docker approach...');
    
    try {
      // Use Docker compose to run the setup
      const dockerPrefix = 'docker compose -f ../../../docker/compose/docker-compose.dev.yml exec -T postgres psql -U postgres -d collectioncrm';
      
      await runCommand(
        `cat tests/data/test-data-bank-sync-insert.sql | ${dockerPrefix}`,
        'Inserting bank-sync test data via Docker'
      );
      
      await runCommand(
        `cat tests/data/test-data-workflow-insert.sql | ${dockerPrefix}`,
        'Inserting workflow test data via Docker'
      );
      
      await runCommand(
        `cat tests/data/test-campaign-config-insert.sql | ${dockerPrefix}`,
        'Inserting campaign config via Docker'
      );
      
      await runCommand(
        `echo "SELECT bank_sync_service.refresh_loan_campaign_data();" | ${dockerPrefix}`,
        'Refreshing materialized views via Docker'
      );
      
    } catch (dockerError) {
      console.error('\n❌ Both psql and Docker approaches failed.');
      console.log('\n📋 Manual setup required:');
      console.log('1. Run tests/data/test-data-bank-sync-insert.sql');
      console.log('2. Run tests/data/test-data-workflow-insert.sql');
      console.log('3. Run tests/data/test-campaign-config-insert.sql');
      console.log('4. Refresh materialized views');
      throw dockerError;
    }
  }
  
  console.log('\n✅ Test data setup completed!');
}

async function runJestTests() {
  console.log('\n🧪 Running Jest Test Suite');
  console.log('-'.repeat(30));
  
  try {
    await runCommand(
      'npm test -- --testPathPattern=processing-service.test.js --verbose',
      'Running Jest tests'
    );
  } catch (error) {
    console.log('\n⚠️  Jest tests encountered issues. This might be due to:');
    console.log('   - Missing test data (run setup first)');
    console.log('   - Database connection issues');
    console.log('   - Service configuration problems');
    throw error;
  }
}

async function runQuickTest() {
  console.log('\n⚡ Running Quick Manual Test');
  console.log('-'.repeat(30));
  
  await runCommand(
    'node tests/scripts/quick-test-processing.js',
    'Running quick ProcessingService test'
  );
}

async function runFullTest() {
  console.log('\n🎯 Running Full Test Suite');
  console.log('-'.repeat(30));
  
  await runCommand(
    'node tests/scripts/test-processing-service.js',
    'Running complete test suite'
  );
}

async function cleanupTestData() {
  console.log('\n🧹 Cleaning Up Test Data');
  console.log('-'.repeat(30));
  
  try {
    await runCommand(
      'psql -d collectioncrm -f tests/data/cleanup-test-data.sql',
      'Running cleanup script with psql'
    );
  } catch (error) {
    console.log('\n⚠️  Direct psql failed. Trying Docker approach...');
    
    const dockerPrefix = 'docker compose -f ../../../docker/compose/docker-compose.dev.yml exec -T postgres psql -U postgres -d collectioncrm';
    await runCommand(
      `cat tests/data/cleanup-test-data.sql | ${dockerPrefix}`,
      'Running cleanup script via Docker'
    );
  }
  
  // Clear Redis cache
  try {
    await runCommand(
      'docker compose -f ../../../docker/compose/docker-compose.dev.yml exec -T redis redis-cli DEL campaign-configuration',
      'Clearing campaign configuration cache'
    );
  } catch (error) {
    console.log('⚠️  Could not clear Redis cache (this is optional)');
  }
  
  console.log('\n✅ Test data cleanup completed!');
}

async function verifyTestData() {
  console.log('\n🔍 Verifying Test Data');
  console.log('-'.repeat(30));
  
  const dockerPrefix = 'docker compose -f ../../../docker/compose/docker-compose.dev.yml exec -T postgres psql -U postgres -d collectioncrm -c';
  
  try {
    await runCommand(
      `${dockerPrefix} "SELECT COUNT(*) as test_customers FROM bank_sync_service.customers WHERE cif LIKE 'TEST%'"`,
      'Checking test customers'
    );
    
    await runCommand(
      `${dockerPrefix} "SELECT COUNT(*) as test_campaigns FROM campaign_engine.campaigns c JOIN campaign_engine.campaign_groups cg ON c.campaign_group_id = cg.id WHERE cg.name LIKE 'TEST_%'"`,
      'Checking test campaigns'
    );
    
    await runCommand(
      `${dockerPrefix} "SELECT cif, segment, COUNT(account_number) as loans, MAX(max_dpd) as highest_dpd FROM bank_sync_service.loan_campaign_data WHERE cif LIKE 'TEST%' GROUP BY cif, segment ORDER BY cif LIMIT 10"`,
      'Checking loan campaign data'
    );
    
  } catch (error) {
    console.log('\n⚠️  Verification failed. Test data might not be properly loaded.');
    throw error;
  }
  
  console.log('\n✅ Test data verification completed!');
}

async function main() {
  const command = process.argv[2];
  
  if (!command || command === 'help') {
    showUsage();
    return;
  }
  
  try {
    switch (command) {
      case 'setup':
        await setupTestData();
        break;
        
      case 'jest':
        await runJestTests();
        break;
        
      case 'quick':
        await runQuickTest();
        break;
        
      case 'full':
        await runFullTest();
        break;
        
      case 'cleanup':
        await cleanupTestData();
        break;
        
      case 'verify':
        await verifyTestData();
        break;
        
      default:
        console.error(`❌ Unknown command: ${command}`);
        showUsage();
        process.exit(1);
    }
    
    console.log('\n🎉 Command completed successfully!');
    
  } catch (error) {
    console.error('\n❌ Command failed:');
    console.error(error.message);
    process.exit(1);
  }
}

// Run the command
main();