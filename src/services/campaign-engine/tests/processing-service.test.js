const { ProcessingService } = require('../src/services/processing.service');
const { CampaignRepository } = require('../src/repositories/campaign.repository');
const db = require('../src/config/database');

describe('ProcessingService Integration Tests', () => {
  let processingService;
  let campaignRepository;

  beforeAll(async () => {
    processingService = new ProcessingService();
    campaignRepository = new CampaignRepository();
    
    // Ensure test data is properly set up
    console.log('Setting up test environment...');
    
    // Verify test data exists
    const testCustomers = await db('bank_sync_service.customers')
      .where('cif', 'like', 'TEST%')
      .count('* as count')
      .first();
    
    if (testCustomers.count === '0') {
      throw new Error('Test data not found. Please run setup-test-data.sql first.');
    }
    
    console.log(`Found ${testCustomers.count} test customers`);
  });

  afterAll(async () => {
    // Clean up any test artifacts but keep the test data
    await db.destroy();
  });

  describe('Campaign Configuration Loading', () => {
    test('should load test campaign configuration', async () => {
      const config = await campaignRepository.getCampaignConfiguration();
      
      expect(config).toBeDefined();
      expect(config.campaign_groups).toBeDefined();
      expect(Array.isArray(config.campaign_groups)).toBe(true);
      
      // Find test campaign groups
      const testGroups = config.campaign_groups.filter(g => g.name.startsWith('TEST_'));
      expect(testGroups.length).toBeGreaterThan(0);
      
      // Verify each test group has campaigns
      for (const group of testGroups) {
        expect(group.campaigns).toBeDefined();
        expect(Array.isArray(group.campaigns)).toBe(true);
        expect(group.campaigns.length).toBeGreaterThan(0);
        
        // Verify campaigns have required fields
        for (const campaign of group.campaigns) {
          expect(campaign.id).toBeDefined();
          expect(campaign.name).toBeDefined();
          expect(campaign.priority).toBeDefined();
          expect(campaign.base_conditions).toBeDefined();
          expect(campaign.contact_selection_rules).toBeDefined();
        }
      }
    });

    test('should load campaigns in priority order', async () => {
      const config = await campaignRepository.getCampaignConfiguration();
      const testGroups = config.campaign_groups.filter(g => g.name.startsWith('TEST_'));
      
      for (const group of testGroups) {
        const priorities = group.campaigns.map(c => c.priority);
        const sortedPriorities = [...priorities].sort((a, b) => a - b);
        expect(priorities).toEqual(sortedPriorities);
      }
    });
  });

  describe('SQL Query Generation', () => {
    test('should generate valid SQL for simple DPD campaign', async () => {
      const config = await campaignRepository.getCampaignConfiguration();
      const criticalDpdCampaign = config.campaign_groups
        .find(g => g.name === 'TEST_High_Risk_Collections')
        ?.campaigns.find(c => c.name === 'Critical DPD Campaign');
      
      expect(criticalDpdCampaign).toBeDefined();
      
      const sql = processingService.previewCampaignSQL(criticalDpdCampaign, []);
      
      expect(sql).toContain('max_dpd > 60');
      expect(sql).toContain('loan_status = \'OPEN\'');
      expect(sql).toContain('FROM bank_sync_service.loan_campaign_data');
      expect(sql).toContain('LEFT JOIN all_contacts');
    });

    test('should generate valid SQL for custom field campaign', async () => {
      const config = await campaignRepository.getCampaignConfiguration();
      const highRiskCampaign = config.campaign_groups
        .find(g => g.name === 'TEST_High_Risk_Collections')
        ?.campaigns.find(c => c.name === 'High Risk Score Campaign');
      
      expect(highRiskCampaign).toBeDefined();
      
      const sql = processingService.previewCampaignSQL(highRiskCampaign, []);
      
      expect(sql).toContain('custom_fields->>\'risk_score\'');
      expect(sql).toContain('>= 8');
    });

    test('should handle customer exclusion in SQL', async () => {
      const config = await campaignRepository.getCampaignConfiguration();
      const campaign = config.campaign_groups[0]?.campaigns[0];
      
      expect(campaign).toBeDefined();
      
      const sql = processingService.previewCampaignSQL(campaign, ['TEST001', 'TEST002']);
      
      expect(sql).toContain('NOT IN (\'TEST001\',\'TEST002\')');
    });
  });

  describe('Single Campaign Processing', () => {
    test('should process Critical DPD Campaign and find matching customers', async () => {
      const request = {
        request_id: 'test-critical-dpd-001',
        campaign_group_ids: ['550e8400-e29b-41d4-a716-446655440001'], // High Risk Collections
        requested_by: 'TEST_USER',
        processing_options: {
          parallel_processing: false,
          max_contacts_per_customer: 5
        }
      };

      const result = await processingService.processBatchRequest(request);

      expect(result).toBeDefined();
      expect(result.request_id).toBe(request.request_id);
      expect(result.processed_count).toBeGreaterThan(0);
      expect(result.campaign_results).toBeDefined();
      expect(Array.isArray(result.campaign_results)).toBe(true);

      // Find the Critical DPD Campaign result
      const criticalCampaign = result.campaign_results.find(cr => 
        cr.campaign_name === 'Critical DPD Campaign'
      );

      expect(criticalCampaign).toBeDefined();
      expect(criticalCampaign.customers_assigned).toBeGreaterThan(0);

      // Verify customer assignments have required fields
      for (const assignment of criticalCampaign.customer_assignments) {
        expect(assignment.customer_id).toBeDefined();
        expect(assignment.cif).toBeDefined();
        expect(assignment.account_number).toBeDefined();
        expect(assignment.assigned_at).toBeDefined();
        expect(Array.isArray(assignment.selected_contacts)).toBe(true);
      }
    });

    test('should process High Risk Score Campaign with custom fields', async () => {
      const request = {
        request_id: 'test-high-risk-001',
        campaign_group_ids: ['550e8400-e29b-41d4-a716-446655440001'],
        requested_by: 'TEST_USER',
        processing_options: {
          parallel_processing: false,
          max_contacts_per_customer: 3
        }
      };

      const result = await processingService.processBatchRequest(request);
      
      const highRiskCampaign = result.campaign_results.find(cr => 
        cr.campaign_name === 'High Risk Score Campaign'
      );

      expect(highRiskCampaign).toBeDefined();
      
      // Should find customers with risk_score >= 8
      if (highRiskCampaign.customers_assigned > 0) {
        expect(highRiskCampaign.customer_assignments.length).toBeGreaterThan(0);
      }
    });

    test('should process Premium Gentle Reminder with contact exclusions', async () => {
      const request = {
        request_id: 'test-premium-gentle-001',
        campaign_group_ids: ['550e8400-e29b-41d4-a716-446655440003'], // Premium Customer Care
        requested_by: 'TEST_USER',
        processing_options: {
          parallel_processing: false,
          max_contacts_per_customer: 2
        }
      };

      const result = await processingService.processBatchRequest(request);
      
      const premiumCampaign = result.campaign_results.find(cr => 
        cr.campaign_name === 'Premium Gentle Reminder'
      );

      expect(premiumCampaign).toBeDefined();

      // Should exclude reference contacts based on the contact selection rules
      if (premiumCampaign.customers_assigned > 0) {
        for (const assignment of premiumCampaign.customer_assignments) {
          for (const contact of assignment.selected_contacts) {
            // Should only have customer contacts, no reference contacts
            expect(contact.related_party_type).toBe('customer');
          }
        }
      }
    });
  });

  describe('Multiple Campaign Processing', () => {
    test('should process entire High Risk Collections group in priority order', async () => {
      const request = {
        request_id: 'test-high-risk-group-001',
        campaign_group_ids: ['550e8400-e29b-41d4-a716-446655440001'],
        requested_by: 'TEST_USER',
        processing_options: {
          parallel_processing: false,
          max_contacts_per_customer: 5
        }
      };

      const result = await processingService.processBatchRequest(request);

      expect(result.campaign_results.length).toBeGreaterThan(1);

      // Verify campaigns are processed in priority order
      const highRiskResults = result.campaign_results.filter(cr => 
        cr.campaign_group_name === 'TEST_High_Risk_Collections'
      );

      for (let i = 1; i < highRiskResults.length; i++) {
        expect(highRiskResults[i].priority).toBeGreaterThan(highRiskResults[i-1].priority);
      }
    });

    test('should prevent duplicate customer assignments within same group', async () => {
      const request = {
        request_id: 'test-no-duplicates-001',
        campaign_group_ids: ['550e8400-e29b-41d4-a716-446655440001'],
        requested_by: 'TEST_USER',
        processing_options: {
          parallel_processing: false,
          max_contacts_per_customer: 5
        }
      };

      const result = await processingService.processBatchRequest(request);

      // Collect all assigned CIFs
      const allAssignedCifs = new Set();
      for (const campaignResult of result.campaign_results) {
        for (const assignment of campaignResult.customer_assignments) {
          const key = `${campaignResult.campaign_group_id}-${assignment.cif}`;
          expect(allAssignedCifs.has(key)).toBe(false); // No duplicates
          allAssignedCifs.add(key);
        }
      }
    });

    test('should allow same customer in different campaign groups', async () => {
      // Process first group
      const request1 = {
        request_id: 'test-multi-group-001',
        campaign_group_ids: ['550e8400-e29b-41d4-a716-446655440001'], // High Risk
        requested_by: 'TEST_USER',
        processing_options: {
          parallel_processing: false,
          max_contacts_per_customer: 5
        }
      };

      const result1 = await processingService.processBatchRequest(request1);

      // Process second group
      const request2 = {
        request_id: 'test-multi-group-002',
        campaign_group_ids: ['550e8400-e29b-41d4-a716-446655440002'], // Early Stage
        requested_by: 'TEST_USER',
        processing_options: {
          parallel_processing: false,
          max_contacts_per_customer: 5
        }
      };

      const result2 = await processingService.processBatchRequest(request2);

      // Customers can appear in both groups (different processing runs)
      expect(result1.processed_count).toBeGreaterThan(0);
      expect(result2.processed_count).toBeGreaterThan(0);
    });
  });

  describe('Contact Selection Rules', () => {
    test('should apply relationship exclusion rules', async () => {
      const request = {
        request_id: 'test-relationship-exclusion-001',
        campaign_group_ids: ['550e8400-e29b-41d4-a716-446655440001'], // Has family exclusion rules
        requested_by: 'TEST_USER',
        processing_options: {
          parallel_processing: false,
          max_contacts_per_customer: 10 // Allow more contacts to see exclusions
        }
      };

      const result = await processingService.processBatchRequest(request);

      const criticalCampaign = result.campaign_results.find(cr => 
        cr.campaign_name === 'Critical DPD Campaign'
      );

      if (criticalCampaign && criticalCampaign.customers_assigned > 0) {
        // Check that family relationships are excluded
        for (const assignment of criticalCampaign.customer_assignments) {
          for (const contact of assignment.selected_contacts) {
            if (contact.related_party_type === 'reference') {
              const excludedRelationships = ['parent', 'father', 'mother', 'spouse', 'brother', 'sister'];
              if (contact.relationship_type) {
                expect(excludedRelationships).not.toContain(contact.relationship_type.toLowerCase());
              }
            }
          }
        }
      }
    });

    test('should apply contact type exclusion rules', async () => {
      const request = {
        request_id: 'test-contact-type-exclusion-001',
        campaign_group_ids: ['550e8400-e29b-41d4-a716-446655440002'], // Early Stage (excludes work contacts)
        requested_by: 'TEST_USER',
        processing_options: {
          parallel_processing: false,
          max_contacts_per_customer: 10
        }
      };

      const result = await processingService.processBatchRequest(request);

      const earlyStageCampaign = result.campaign_results.find(cr => 
        cr.campaign_name === 'Early DPD Campaign'
      );

      if (earlyStageCampaign && earlyStageCampaign.customers_assigned > 0) {
        // Check that work contacts are excluded
        for (const assignment of earlyStageCampaign.customer_assignments) {
          for (const contact of assignment.selected_contacts) {
            expect(contact.contact_type).not.toBe('work');
          }
        }
      }
    });

    test('should handle contact limits per customer', async () => {
      const request = {
        request_id: 'test-contact-limits-001',
        campaign_group_ids: ['550e8400-e29b-41d4-a716-446655440002'],
        requested_by: 'TEST_USER',
        processing_options: {
          parallel_processing: false,
          max_contacts_per_customer: 2 // Limit to 2 contacts
        }
      };

      const result = await processingService.processBatchRequest(request);

      for (const campaignResult of result.campaign_results) {
        for (const assignment of campaignResult.customer_assignments) {
          expect(assignment.selected_contacts.length).toBeLessThanOrEqual(2);
        }
      }
    });
  });

  describe('Performance and Metrics', () => {
    test('should provide processing metrics', async () => {
      const request = {
        request_id: 'test-metrics-001',
        campaign_group_ids: ['550e8400-e29b-41d4-a716-446655440001'],
        requested_by: 'TEST_USER',
        processing_options: {
          parallel_processing: false,
          max_contacts_per_customer: 5
        }
      };

      const result = await processingService.processBatchRequest(request);

      expect(result.processing_summary).toBeDefined();
      expect(result.processing_summary.performance_metrics).toBeDefined();
      
      const metrics = result.processing_summary.performance_metrics;
      expect(metrics.total_database_queries).toBeGreaterThan(0);
      expect(metrics.average_query_duration_ms).toBeGreaterThanOrEqual(0);
      expect(metrics.customers_per_second).toBeGreaterThanOrEqual(0);
    });

    test('should complete processing within reasonable time', async () => {
      const startTime = Date.now();
      
      const request = {
        request_id: 'test-performance-001',
        requested_by: 'TEST_USER',
        processing_options: {
          parallel_processing: false,
          max_contacts_per_customer: 5
        }
      };

      const result = await processingService.processBatchRequest(request);
      
      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(result.total_duration_ms).toBeLessThan(30000); // Should complete within 30 seconds
      expect(duration).toBeLessThan(30000);
    });
  });

  describe('Error Handling', () => {
    test('should handle invalid campaign group IDs gracefully', async () => {
      const request = {
        request_id: 'test-invalid-group-001',
        campaign_group_ids: ['invalid-group-id'],
        requested_by: 'TEST_USER',
        processing_options: {
          parallel_processing: false,
          max_contacts_per_customer: 5
        }
      };

      const result = await processingService.processBatchRequest(request);

      expect(result.campaign_results).toHaveLength(0);
      expect(result.processed_count).toBe(0);
    });

    test('should handle empty processing gracefully', async () => {
      const request = {
        request_id: 'test-empty-processing-001',
        campaign_group_ids: [], // No groups specified - should process all
        requested_by: 'TEST_USER',
        processing_options: {
          parallel_processing: false,
          max_contacts_per_customer: 0 // No contacts
        }
      };

      const result = await processingService.processBatchRequest(request);

      expect(result).toBeDefined();
      expect(result.request_id).toBe(request.request_id);
      expect(Array.isArray(result.campaign_results)).toBe(true);
    });
  });

  describe('Data Validation', () => {
    test('should return valid customer and contact data structures', async () => {
      const request = {
        request_id: 'test-data-validation-001',
        campaign_group_ids: ['550e8400-e29b-41d4-a716-446655440003'], // Premium Customer Care
        requested_by: 'TEST_USER',
        processing_options: {
          parallel_processing: false,
          max_contacts_per_customer: 5
        }
      };

      const result = await processingService.processBatchRequest(request);

      for (const campaignResult of result.campaign_results) {
        // Validate campaign result structure
        expect(campaignResult.campaign_id).toBeDefined();
        expect(campaignResult.campaign_name).toBeDefined();
        expect(campaignResult.campaign_group_id).toBeDefined();
        expect(campaignResult.priority).toBeGreaterThan(0);
        expect(campaignResult.customers_assigned).toBeGreaterThanOrEqual(0);
        expect(campaignResult.processing_duration_ms).toBeGreaterThanOrEqual(0);

        for (const assignment of campaignResult.customer_assignments) {
          // Validate customer assignment structure
          expect(assignment.customer_id).toBeDefined();
          expect(assignment.cif).toMatch(/^TEST\d+$/);
          expect(assignment.account_number).toMatch(/^TEST_LOAN_\d+$/);
          expect(assignment.assigned_at).toBeDefined();

          for (const contact of assignment.selected_contacts) {
            // Validate contact structure
            expect(contact.contact_id).toBeDefined();
            expect(contact.contact_type).toBeDefined();
            expect(contact.contact_value).toBeDefined();
            expect(contact.related_party_type).toBeDefined();
            expect(contact.related_party_cif).toBeDefined();
            expect(typeof contact.is_primary).toBe('boolean');
            expect(typeof contact.is_verified).toBe('boolean');
            expect(['bank_sync', 'user_input']).toContain(contact.source);
          }
        }
      }
    });
  });
});