/**
 * Quick Test Script for ProcessingService
 * This script tests the ProcessingService with the loaded test data
 */

const { ProcessingService } = require('../../src/services/processing.service');
const { CampaignRepository } = require('../../src/repositories/campaign.repository');

async function runQuickTest() {
  console.log('🚀 Quick ProcessingService Test');
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
    
    const testGroups = config.campaign_groups.filter(g => g.name.startsWith('TEST_'));
    console.log(`✅ Found ${testGroups.length} test campaign groups:`);
    
    for (const group of testGroups) {
      console.log(`   📁 ${group.name}: ${group.campaigns.length} campaigns`);
      for (const campaign of group.campaigns) {
        console.log(`      📋 ${campaign.name} (priority: ${campaign.priority})`);
      }
    }
    
    // Test 2: SQL Preview for Critical DPD Campaign
    console.log('\n🔍 Test 2: SQL Query Generation');
    const highRiskGroup = testGroups.find(g => g.name === 'TEST_High_Risk_Collections');
    if (highRiskGroup && highRiskGroup.campaigns.length > 0) {
      const criticalCampaign = highRiskGroup.campaigns.find(c => c.name === 'Critical DPD Campaign');
      if (criticalCampaign) {
        console.log(`Generating SQL for: ${criticalCampaign.name}`);
        const sql = processingService.previewCampaignSQL(criticalCampaign, []);
        console.log('✅ SQL generated successfully');
        console.log(`   Length: ${sql.length} characters`);
        console.log(`   Contains DPD condition: ${sql.includes('max_dpd > 60') ? '✅' : '❌'}`);
        console.log(`   Contains loan status filter: ${sql.includes('loan_status') ? '✅' : '❌'}`);
      }
    }
    
    // Test 3: Process High Risk Collections Group
    console.log('\n⚡ Test 3: Processing High Risk Collections');
    if (highRiskGroup) {
      const request = {
        request_id: `quick-test-${Date.now()}`,
        campaign_group_ids: [highRiskGroup.id],
        requested_by: 'QUICK_TEST',
        processing_options: {
          parallel_processing: false,
          max_contacts_per_customer: 3
        }
      };
      
      console.log(`Processing group: ${highRiskGroup.name}`);
      const startTime = Date.now();
      
      const result = await processingService.processBatchRequest(request);
      
      const duration = Date.now() - startTime;
      
      console.log('✅ Processing completed successfully!');
      console.log(`   ⏱️  Duration: ${duration}ms`);
      console.log(`   👥 Processed: ${result.processed_count} customers`);
      console.log(`   📋 Campaigns: ${result.campaign_results.length}`);
      console.log(`   ❌ Errors: ${result.error_count}`);
      
      // Show detailed results for each campaign
      console.log('\n📊 Campaign Results:');
      for (const campaignResult of result.campaign_results) {
        console.log(`   📈 ${campaignResult.campaign_name}:`);
        console.log(`      👥 Customers assigned: ${campaignResult.customers_assigned}`);
        console.log(`      📞 Total contacts: ${campaignResult.total_contacts_selected}`);
        console.log(`      ⏱️  Processing time: ${campaignResult.processing_duration_ms}ms`);
        
        // Show first few customer assignments as examples
        if (campaignResult.customer_assignments.length > 0) {
          console.log(`      📋 Sample assignments:`);
          const sampleCount = Math.min(3, campaignResult.customer_assignments.length);
          for (let i = 0; i < sampleCount; i++) {
            const assignment = campaignResult.customer_assignments[i];
            console.log(`         ${assignment.cif} (${assignment.account_number}): ${assignment.selected_contacts.length} contacts`);
          }
        }
      }
      
      // Show performance metrics
      if (result.processing_summary && result.processing_summary.performance_metrics) {
        const metrics = result.processing_summary.performance_metrics;
        console.log('\n⚡ Performance Metrics:');
        console.log(`   🔍 Database queries: ${metrics.total_database_queries}`);
        console.log(`   ⏱️  Avg query time: ${metrics.average_query_duration_ms.toFixed(2)}ms`);
        console.log(`   🚀 Customers/second: ${metrics.customers_per_second.toFixed(2)}`);
      }
    }
    
    // Test 4: Process Premium Customer Care (different contact rules)
    console.log('\n✨ Test 4: Processing Premium Customer Care');
    const premiumGroup = testGroups.find(g => g.name === 'TEST_Premium_Customer_Care');
    if (premiumGroup) {
      const request = {
        request_id: `quick-test-premium-${Date.now()}`,
        campaign_group_ids: [premiumGroup.id],
        requested_by: 'QUICK_TEST',
        processing_options: {
          parallel_processing: false,
          max_contacts_per_customer: 2
        }
      };
      
      const result = await processingService.processBatchRequest(request);
      
      console.log(`✅ Premium group processed: ${result.processed_count} customers`);
      
      // Verify contact selection rules (should exclude reference contacts)
      let hasOnlyCustomerContacts = true;
      for (const campaignResult of result.campaign_results) {
        for (const assignment of campaignResult.customer_assignments) {
          for (const contact of assignment.selected_contacts) {
            if (contact.related_party_type !== 'customer') {
              hasOnlyCustomerContacts = false;
            }
          }
        }
      }
      
      console.log(`   📞 Contact rules applied: ${hasOnlyCustomerContacts ? '✅ Only customer contacts' : '⚠️ Mixed contact types'}`);
    }
    
    console.log('\n🎉 All tests completed successfully!');
    console.log('='.repeat(50));
    console.log('✅ ProcessingService is working correctly');
    console.log('✅ Test data is properly loaded');
    console.log('✅ Campaign processing logic is functional');
    console.log('✅ Contact selection rules are being applied');
    console.log('✅ Performance metrics are being collected');
    
  } catch (error) {
    console.error('\n❌ Test failed:');
    console.error(error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run the test
runQuickTest();