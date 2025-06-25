// Simple ProcessingService Test
import { ProcessingService } from './src/services/processing.service';
import { CampaignRepository } from './src/repositories/campaign.repository';

async function testProcessing() {
  console.log('🚀 Testing Campaign-Engine ProcessingService');
  console.log('='.repeat(50));
  
  try {
    // Initialize services
    console.log('\n📋 Initializing services...');
    const processingService = new ProcessingService();
    const campaignRepository = new CampaignRepository();
    
    // Test 1: Load campaign configuration
    console.log('\n📊 Test 1: Loading campaign configuration');
    const config = await campaignRepository.getCampaignConfiguration();
    console.log(`✅ Loaded ${config.campaign_groups.length} campaign groups`);
    
    const testGroups = config.campaign_groups.filter((g: any) => g.name.startsWith('TEST_'));
    console.log(`✅ Found ${testGroups.length} test campaign groups`);
    
    for (const group of testGroups) {
      console.log(`   - ${group.name}: ${group.campaigns.length} campaigns`);
      for (const campaign of group.campaigns) {
        console.log(`     * ${campaign.name} (priority: ${campaign.priority})`);
      }
    }
    
    // Test 2: SQL Preview for first campaign
    console.log('\n📋 Test 2: SQL Query Generation');
    if (testGroups.length > 0 && testGroups[0].campaigns.length > 0) {
      const testCampaign = testGroups[0].campaigns[0];
      console.log(`\nGenerating SQL for: ${testCampaign.name}`);
      
      const sql = processingService.previewCampaignSQL(testCampaign, []);
      console.log('✅ SQL generated successfully');
      console.log(`SQL preview (first 500 chars):\n${sql.substring(0, 500)}...`);
    }
    
    // Test 3: Process campaign group
    console.log('\n📋 Test 3: Processing Campaign Group');
    if (testGroups.length > 0) {
      const testGroup = testGroups[0];
      const request = {
        request_id: `test-${Date.now()}`,
        campaign_group_ids: [testGroup.id],
        requested_by: 'TEST_SCRIPT',
        processing_options: {
          parallel_processing: false,
          max_contacts_per_customer: 3
        }
      };
      
      console.log(`\nProcessing group: ${testGroup.name}`);
      const startTime = Date.now();
      const result = await processingService.processBatchRequest(request);
      const duration = Date.now() - startTime;
      
      console.log('\n✅ Processing Results:');
      console.log(`   Duration: ${duration}ms`);
      console.log(`   Request ID: ${result.request_id}`);
      console.log(`   Processed: ${result.processed_count} customers`);
      console.log(`   Errors: ${result.error_count}`);
      
      // Show campaign results
      console.log('\n📊 Campaign Results:');
      for (const campaignResult of result.campaign_results) {
        console.log(`\n   ${campaignResult.campaign_name}:`);
        console.log(`   - Customers assigned: ${campaignResult.customers_assigned}`);
        console.log(`   - Total contacts: ${campaignResult.total_contacts_selected}`);
        console.log(`   - Duration: ${campaignResult.processing_duration_ms}ms`);
        console.log(`   - Campaign ID: ${campaignResult.campaign_id}`);
        
        if (campaignResult.customers_assigned > 0) {
          console.log(`   - Sample assignments:`);
          const samples = campaignResult.customer_assignments.slice(0, 3);
          for (const assignment of samples) {
            console.log(`     * CIF: ${assignment.cif}, Contacts: ${assignment.selected_contacts.length}`);
          }
        }
      }
      
      // Show performance metrics
      if (result.processing_summary) {
        const summary = result.processing_summary;
        console.log('\n📈 Performance Metrics:');
        console.log(`   - Total DB queries: ${summary.performance_metrics.total_database_queries}`);
        console.log(`   - Avg query time: ${summary.performance_metrics.average_query_duration_ms.toFixed(2)}ms`);
        console.log(`   - Customers/sec: ${summary.performance_metrics.customers_per_second.toFixed(2)}`);
      }
    }
    
    console.log('\n✅ All tests completed successfully!');
    
  } catch (error: any) {
    console.error('❌ Test failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
  
  process.exit(0);
}

// Run the test
testProcessing();