import { 
  ProcessingCampaign,
  ProcessingCondition,
  ProcessingContactRule,
  ProcessingContactOutput,
  BatchProcessingRequest,
  BatchProcessingResult,
  CampaignProcessingResult,
  CustomerAssignment,
  SelectedContact,
  ProcessingError,
  ProcessingSummary,
  PerformanceMetrics,
  CampaignConfiguration,
  ProcessingCampaignGroup
} from '../models/processing.models';
import { CampaignRepository } from '../repositories/campaign.repository';
import { KafkaService } from './kafka.service';
import { logger, createLogger } from '../utils/logger';
import db from '../config/database';

interface QueryResult {
  customer_id: string;
  cif: string;
  account_number: string;
  segment: string;
  status: string;
  // Aggregated fields
  total_loans?: number;
  active_loans?: number;
  overdue_loans?: number;
  client_outstanding?: number;
  total_due_amount?: number;
  overdue_outstanding?: number;
  max_dpd?: number;
  avg_dpd?: number;
  utilization_ratio?: number;
  // Contact fields (if any contacts found)
  contact_id?: string;
  contact_type?: string;
  contact_value?: string;
  related_party_type?: string;
  related_party_cif?: string;
  related_party_name?: string;
  relationship_type?: string;
  rule_priority?: number;
  is_primary?: boolean;
  is_verified?: boolean;
  source?: string;
}

export class ProcessingService {
  private campaignRepository: CampaignRepository;
  private kafkaService: KafkaService;
  private queryCount = 0;
  private totalQueryDuration = 0;

  constructor() {
    this.campaignRepository = new CampaignRepository();
    this.kafkaService = KafkaService.getInstance();
  }

  async processBatchRequest(request: BatchProcessingRequest): Promise<BatchProcessingResult> {
    const startTime = Date.now();
    const processingLogger = createLogger({ requestId: request.request_id });
    
    processingLogger.info('Starting optimized campaign-centric batch processing');

    // Reset performance counters
    this.queryCount = 0;
    this.totalQueryDuration = 0;

    const campaignResults: CampaignProcessingResult[] = [];
    const errors: ProcessingError[] = [];

    try {
      // Load campaign configuration
      const campaignConfig: CampaignConfiguration = await this.campaignRepository.getCampaignConfiguration();
      processingLogger.info(`Loaded ${campaignConfig.campaign_groups.length} campaign groups`);

      // Filter groups if specified
      const groupsToProcess = request.campaign_group_ids 
        ? campaignConfig.campaign_groups.filter((g: ProcessingCampaignGroup) => request.campaign_group_ids!.includes(g.id))
        : campaignConfig.campaign_groups;

      // Process using optimized campaign-centric approach
      await this.processAllCampaignsOptimized(
        groupsToProcess, 
        campaignResults, 
        errors, 
        request.processing_options,
        processingLogger
      );

      const endTime = Date.now();
      const totalDuration = endTime - startTime;

      processingLogger.info(`Optimized processing completed in ${totalDuration}ms`);
      processingLogger.info(`Processed ${campaignResults.length} campaigns, ${errors.length} errors`);
      processingLogger.info(`Executed ${this.queryCount} database queries`);

      // Generate processing summary
      const summary = this.generateProcessingSummary(campaignResults, errors, totalDuration);

      const result: BatchProcessingResult = {
        request_id: request.request_id,
        processed_count: campaignResults.reduce((sum, cr) => sum + cr.customers_assigned, 0),
        success_count: campaignResults.reduce((sum, cr) => sum + cr.customers_assigned, 0),
        error_count: errors.length,
        campaign_results: campaignResults,
        errors,
        processing_summary: summary,
        started_at: new Date(startTime).toISOString(),
        completed_at: new Date(endTime).toISOString(),
        total_duration_ms: totalDuration
      };

      // Publish result to Kafka
      await this.publishResultToKafka(request.request_id, result);

      return result;

    } catch (error) {
      processingLogger.error('Optimized processing failed:', error);
      throw error;
    }
  }

  private async processAllCampaignsOptimized(
    groups: ProcessingCampaignGroup[],
    campaignResults: CampaignProcessingResult[],
    errors: ProcessingError[],
    options: any,
    logger: any
  ): Promise<void> {
    // Track assigned customers per group to avoid duplicates
    const assignedCustomers = new Map<string, Set<string>>(); // groupId -> Set<cif>

    // Initialize tracking for each group
    for (const group of groups) {
      assignedCustomers.set(group.id, new Set());
    }

    // Process each group
    for (const group of groups) {
      logger.info(`Processing campaign group: ${group.name}`);
      
      // Sort campaigns by priority (lowest number = highest priority)
      const sortedCampaigns = group.campaigns.sort((a: ProcessingCampaign, b: ProcessingCampaign) => a.priority - b.priority);
      
      // Process each campaign in priority order
      for (const campaign of sortedCampaigns) {
        try {
          const campaignStartTime = Date.now();
          logger.info(`Processing campaign: ${campaign.name} (priority: ${campaign.priority})`);
          
          // Execute single optimized query for this campaign
          const queryResult = await this.executeCampaignQuery(campaign, assignedCustomers.get(group.id)!, options);
          
          // Process query results
          const customerAssignments = this.processQueryResults(queryResult, options);
          
          // Update assigned customers tracking
          for (const assignment of customerAssignments) {
            assignedCustomers.get(group.id)!.add(assignment.cif);
          }

          const campaignEndTime = Date.now();
          const campaignDuration = campaignEndTime - campaignStartTime;

          // Create campaign result
          const campaignResult: CampaignProcessingResult = {
            campaign_id: campaign.id,
            campaign_name: campaign.name,
            campaign_group_id: group.id,
            campaign_group_name: group.name,
            priority: campaign.priority,
            customers_assigned: customerAssignments.length,
            customers_with_contacts: customerAssignments.filter(ca => ca.selected_contacts.length > 0).length,
            total_contacts_selected: customerAssignments.reduce((sum, ca) => sum + ca.selected_contacts.length, 0),
            processing_duration_ms: campaignDuration,
            customer_assignments: customerAssignments
          };

          campaignResults.push(campaignResult);
          
          logger.info(`Campaign ${campaign.name}: ${customerAssignments.length} customers assigned, ${campaignResult.total_contacts_selected} contacts selected`);
          
        } catch (campaignError) {
          logger.error(`Error processing campaign ${campaign.name}:`, campaignError);
          errors.push({
            campaign_id: campaign.id,
            error_code: 'CAMPAIGN_PROCESSING_ERROR',
            error_message: `Failed to process campaign ${campaign.name}: ${campaignError instanceof Error ? campaignError.message : 'Unknown error'}`
          });
        }
      }
    }
  }

  private async executeCampaignQuery(
    campaign: ProcessingCampaign,
    assignedCifsInGroup: Set<string>,
    options: any
  ): Promise<QueryResult[]> {
    const query = this.buildOptimizedCampaignQuery(campaign, assignedCifsInGroup, options);
    
    const queryStartTime = Date.now();
    const result = await db.raw(query);
    const queryEndTime = Date.now();
    
    this.queryCount++;
    this.totalQueryDuration += (queryEndTime - queryStartTime);
    
    return result.rows;
  }

  private buildOptimizedCampaignQuery(
    campaign: ProcessingCampaign,
    assignedCifsInGroup: Set<string>,
    options: any
  ): string {
    // Build customer selection conditions
    const customerConditions = this.buildCustomerConditions(campaign.base_conditions);
    
    // Build exclusion clause for already assigned customers
    const excludeClause = assignedCifsInGroup.size > 0 
      ? `AND c.cif NOT IN (${Array.from(assignedCifsInGroup).map(cif => `'${cif}'`).join(',')})`
      : '';

    // Build contact selection queries
    const contactQueries = this.buildContactSelectionQueries(campaign.contact_selection_rules, options);

    return `
      WITH campaign_customers AS (
        SELECT DISTINCT 
          c.id as customer_id,
          c.cif,
          l.account_number,
          c.segment,
          c.status,
          ca.total_loans,
          ca.active_loans,
          ca.overdue_loans,
          ca.client_outstanding,
          ca.total_due_amount,
          ca.overdue_outstanding,
          ca.max_dpd,
          ca.avg_dpd,
          ca.utilization_ratio
        FROM bank_sync_service.customers c
        JOIN bank_sync_service.loans l ON c.cif = l.cif
        LEFT JOIN bank_sync_service.customer_aggregates ca ON c.cif = ca.cif
        LEFT JOIN bank_sync_service.loan_custom_fields lcf ON l.account_number = lcf.account_number
        WHERE ${customerConditions}
        ${excludeClause}
      ),
      all_contacts AS (
        ${contactQueries}
      )
      SELECT 
        cc.*,
        ac.contact_id,
        ac.contact_type,
        ac.contact_value,
        ac.related_party_type,
        ac.related_party_cif,
        ac.related_party_name,
        ac.relationship_type,
        ac.rule_priority,
        ac.is_primary,
        ac.is_verified,
        ac.source
      FROM campaign_customers cc
      LEFT JOIN all_contacts ac ON cc.customer_id = ac.customer_id
      ORDER BY cc.customer_id, ac.rule_priority NULLS LAST, ac.is_primary DESC;
    `;
  }

  private buildCustomerConditions(conditions: ProcessingCondition[]): string {
    if (conditions.length === 0) return '1=1';

    const sqlConditions = conditions.map(condition => {
      return this.buildConditionSQL(condition);
    }).filter(condition => condition !== null);

    return sqlConditions.length > 0 ? sqlConditions.join(' AND ') : '1=1';
  }

  private buildConditionSQL(condition: ProcessingCondition): string | null {
    const { field_name, operator, field_value, data_source } = condition;
    
    let fieldReference: string;
    let value = field_value;

    // Map data source to table alias and field
    switch (data_source) {
      case 'bank_sync_service.customers':
        fieldReference = `c.${field_name}`;
        break;
      case 'bank_sync_service.customer_aggregates':
        fieldReference = `ca.${field_name}`;
        // For numeric fields, don't quote the value
        if (['total_loans', 'active_loans', 'overdue_loans', 'client_outstanding', 
             'total_due_amount', 'overdue_outstanding', 'max_dpd', 'avg_dpd', 'utilization_ratio'].includes(field_name)) {
          value = field_value; // No quotes for numbers
        }
        break;
      case 'bank_sync_service.loans':
        fieldReference = `l.${field_name}`;
        // For numeric fields, don't quote the value
        if (['outstanding', 'due_amount', 'dpd', 'original_amount'].includes(field_name)) {
          value = field_value; // No quotes for numbers
        }
        break;
      case 'custom_fields':
        fieldReference = `lcf.fields->>'${field_name}'`;
        break;
      default:
        logger.warn(`Unknown data source: ${data_source}`);
        return null;
    }

    // Build condition based on operator
    switch (operator) {
      case '=':
        return `${fieldReference} = '${value}'`;
      case '!=':
        return `${fieldReference} != '${value}'`;
      case '>':
        return `${fieldReference} > ${value}`;
      case '>=':
        return `${fieldReference} >= ${value}`;
      case '<':
        return `${fieldReference} < ${value}`;
      case '<=':
        return `${fieldReference} <= ${value}`;
      case 'LIKE':
        return `${fieldReference} ILIKE '%${value}%'`;
      case 'NOT_LIKE':
        return `${fieldReference} NOT ILIKE '%${value}%'`;
      case 'IN':
        const inValues = value.split(',').map(v => `'${v.trim()}'`).join(',');
        return `${fieldReference} IN (${inValues})`;
      case 'NOT_IN':
        const notInValues = value.split(',').map(v => `'${v.trim()}'`).join(',');
        return `${fieldReference} NOT IN (${notInValues})`;
      case 'IS_NULL':
        return `${fieldReference} IS NULL`;
      case 'IS_NOT_NULL':
        return `${fieldReference} IS NOT NULL`;
      default:
        logger.warn(`Unknown operator: ${operator}`);
        return null;
    }
  }

  private buildContactSelectionQueries(rules: ProcessingContactRule[], options: any): string {
    if (rules.length === 0) return 'SELECT NULL as customer_id WHERE FALSE';

    const queries: string[] = [];

    for (const rule of rules) {
      for (const output of rule.outputs as ProcessingContactOutput[]) {
        // Build queries based on related party type
        if (output.related_party_type === 'customer') {
          // Customer phones from bank_sync
          queries.push(`
            SELECT 
              cc.customer_id,
              p.id as contact_id,
              p.type as contact_type,
              p.number as contact_value,
              '${output.related_party_type}' as related_party_type,
              cc.cif as related_party_cif,
              NULL as related_party_name,
              NULL as relationship_type,
              ${rule.rule_priority} as rule_priority,
              p.is_primary,
              p.is_verified,
              'bank_sync' as source
            FROM campaign_customers cc
            JOIN bank_sync_service.phones p ON cc.cif = p.cif
            ${output.contact_type !== 'all' ? `AND p.type = '${output.contact_type}'` : ''}
            ${!options.include_unverified_contacts ? 'AND p.is_verified = true' : ''}
          `);

          // Customer phones from user input
          queries.push(`
            SELECT 
              cc.customer_id,
              wp.id as contact_id,
              wp.type as contact_type,
              wp.number as contact_value,
              '${output.related_party_type}' as related_party_type,
              cc.cif as related_party_cif,
              NULL as related_party_name,
              NULL as relationship_type,
              ${rule.rule_priority} as rule_priority,
              wp.is_primary,
              wp.is_verified,
              'user_input' as source
            FROM campaign_customers cc
            JOIN workflow_service.phones wp ON cc.cif = wp.cif
            ${output.contact_type !== 'all' ? `AND wp.type = '${output.contact_type}'` : ''}
            ${!options.include_unverified_contacts ? 'AND wp.is_verified = true' : ''}
          `);

        } else if (output.related_party_type === 'reference_customer_all') {
          // All reference customer phones from bank_sync
          queries.push(`
            SELECT 
              cc.customer_id,
              rp.id as contact_id,
              rp.type as contact_type,
              rp.number as contact_value,
              '${output.related_party_type}' as related_party_type,
              rc.ref_cif as related_party_cif,
              rc.name as related_party_name,
              rc.relationship_type,
              ${rule.rule_priority} as rule_priority,
              rp.is_primary,
              rp.is_verified,
              'bank_sync' as source
            FROM campaign_customers cc
            JOIN bank_sync_service.reference_customers rc ON cc.cif = rc.primary_cif
            JOIN bank_sync_service.phones rp ON rc.ref_cif = rp.cif
            ${output.contact_type !== 'all' ? `AND rp.type = '${output.contact_type}'` : ''}
            ${!options.include_unverified_contacts ? 'AND rp.is_verified = true' : ''}
          `);

          // All reference customer phones from user input
          queries.push(`
            SELECT 
              cc.customer_id,
              wrp.id as contact_id,
              wrp.type as contact_type,
              wrp.number as contact_value,
              '${output.related_party_type}' as related_party_type,
              wrc.ref_cif as related_party_cif,
              wrc.name as related_party_name,
              wrc.relationship_type,
              ${rule.rule_priority} as rule_priority,
              wrp.is_primary,
              wrp.is_verified,
              'user_input' as source
            FROM campaign_customers cc
            JOIN workflow_service.reference_customers wrc ON cc.cif = wrc.primary_cif
            JOIN workflow_service.phones wrp ON wrc.ref_cif = wrp.cif
            ${output.contact_type !== 'all' ? `AND wrp.type = '${output.contact_type}'` : ''}
            ${!options.include_unverified_contacts ? 'AND wrp.is_verified = true' : ''}
          `);

        } else if (output.related_party_type === 'reference_customer_parent') {
          // Parent/spouse reference phones
          queries.push(`
            SELECT 
              cc.customer_id,
              rp.id as contact_id,
              rp.type as contact_type,
              rp.number as contact_value,
              '${output.related_party_type}' as related_party_type,
              rc.ref_cif as related_party_cif,
              rc.name as related_party_name,
              rc.relationship_type,
              ${rule.rule_priority} as rule_priority,
              rp.is_primary,
              rp.is_verified,
              'bank_sync' as source
            FROM campaign_customers cc
            JOIN bank_sync_service.reference_customers rc ON cc.cif = rc.primary_cif
            JOIN bank_sync_service.phones rp ON rc.ref_cif = rp.cif
            WHERE (
              LOWER(rc.relationship_type) LIKE '%parent%' OR
              LOWER(rc.relationship_type) LIKE '%spouse%' OR
              LOWER(rc.relationship_type) LIKE '%father%' OR
              LOWER(rc.relationship_type) LIKE '%mother%'
            )
            ${output.contact_type !== 'all' ? `AND rp.type = '${output.contact_type}'` : ''}
            ${!options.include_unverified_contacts ? 'AND rp.is_verified = true' : ''}
          `);
        }
      }
    }

    return queries.length > 0 ? queries.join(' UNION ALL ') : 'SELECT NULL as customer_id WHERE FALSE';
  }

  private processQueryResults(
    queryResults: QueryResult[],    
    options: any
  ): CustomerAssignment[] {
    const assignmentMap = new Map<string, CustomerAssignment>();

    for (const row of queryResults) {
      const key = `${row.customer_id}-${row.cif}-${row.account_number}`;
      
      if (!assignmentMap.has(key)) {
        assignmentMap.set(key, {
          customer_id: row.customer_id,
          cif: row.cif,
          account_number: row.account_number,
          assigned_at: new Date().toISOString(),
          selected_contacts: []
        });
      }

      const assignment = assignmentMap.get(key)!;

      // Add contact if it exists
      if (row.contact_id) {
        const contact: SelectedContact = {
          contact_id: row.contact_id,
          contact_type: row.contact_type!,
          contact_value: row.contact_value!,
          related_party_type: row.related_party_type!,
          related_party_cif: row.related_party_cif!,
          related_party_name: row.related_party_name,
          relationship_type: row.relationship_type,
          rule_priority: row.rule_priority!,
          is_primary: row.is_primary!,
          is_verified: row.is_verified!,
          source: row.source! as 'bank_sync' | 'user_input'
        };

        assignment.selected_contacts.push(contact);
      }
    }

    // Apply contact limits if specified
    if (options.max_contacts_per_customer > 0) {
      for (const assignment of assignmentMap.values()) {
        assignment.selected_contacts = assignment.selected_contacts
          .sort((a, b) => {
            // Sort by rule priority, then by is_primary, then by is_verified
            if (a.rule_priority !== b.rule_priority) {
              return a.rule_priority - b.rule_priority;
            }
            if (a.is_primary !== b.is_primary) {
              return b.is_primary ? 1 : -1;
            }
            return b.is_verified ? 1 : -1;
          })
          .slice(0, options.max_contacts_per_customer);
      }
    }

    return Array.from(assignmentMap.values());
  }


  private generateProcessingSummary(
    campaignResults: CampaignProcessingResult[],
    errors: ProcessingError[],
    totalDuration: number
  ): ProcessingSummary {
    const totalCustomers = campaignResults.reduce((sum, cr) => sum + cr.customers_assigned, 0);
    const totalContacts = campaignResults.reduce((sum, cr) => sum + cr.total_contacts_selected, 0);
    
    const campaignAssignmentsByGroup: Record<string, number> = {};
    let mostAssignedCampaign = { campaign_id: '', campaign_name: '', assignment_count: 0 };

    for (const result of campaignResults) {
      const groupKey = result.campaign_group_id;
      campaignAssignmentsByGroup[groupKey] = (campaignAssignmentsByGroup[groupKey] || 0) + result.customers_assigned;

      if (result.customers_assigned > mostAssignedCampaign.assignment_count) {
        mostAssignedCampaign = {
          campaign_id: result.campaign_id,
          campaign_name: result.campaign_name,
          assignment_count: result.customers_assigned
        };
      }
    }

    // Analyze errors
    const campaignErrors = errors.filter(e => e.error_code === 'CAMPAIGN_PROCESSING_ERROR').length;
    const processingErrors = errors.length - campaignErrors;
    
    // Find most common error
    const errorCounts = errors.reduce((acc, error) => {
      acc[error.error_code] = (acc[error.error_code] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const mostCommonError = Object.keys(errorCounts).length > 0 
      ? Object.entries(errorCounts).reduce((a, b) => errorCounts[a[0]] > errorCounts[b[0]] ? a : b)[0]
      : 'None';

    const performanceMetrics: PerformanceMetrics = {
      total_database_queries: this.queryCount,
      average_query_duration_ms: this.queryCount > 0 ? this.totalQueryDuration / this.queryCount : 0,
      cache_hit_rate: 0, // TODO: Implement cache hit rate tracking
      customers_per_second: totalDuration > 0 ? (totalCustomers / totalDuration) * 1000 : 0
    };

    return {
      total_customers: totalCustomers,
      total_campaigns_processed: campaignResults.length,
      total_groups_processed: new Set(campaignResults.map(cr => cr.campaign_group_id)).size,
      customers_with_assignments: totalCustomers,
      customers_without_assignments: 0,
      campaign_assignments_by_group: campaignAssignmentsByGroup,
      most_assigned_campaign: mostAssignedCampaign,
      total_contacts_selected: totalContacts,
      total_processing_duration_ms: totalDuration,
      total_errors: errors.length,
      error_summary: {
        campaign_errors: campaignErrors,
        processing_errors: processingErrors,
        most_common_error: mostCommonError
      },
      performance_metrics: performanceMetrics
    };
  }

  private async publishResultToKafka(requestId: string, result: BatchProcessingResult): Promise<void> {
    try {
      await this.kafkaService.publishCampaignProcessResult({
        requestId: requestId,
        processedCount: result.processed_count,
        results: result.campaign_results.flatMap(cr => 
          cr.customer_assignments.map(ca => ({
            customerId: ca.customer_id,
            accountNumber: ca.account_number,
            assignedCampaigns: [{
              campaignId: cr.campaign_id,
              campaignName: cr.campaign_name,
              campaignGroupId: cr.campaign_group_id,
              campaignGroupName: cr.campaign_group_name
            }],
            assignedGroups: [cr.campaign_group_name],
            selectedContacts: ca.selected_contacts.map(c => ({
              type: c.contact_type,
              value: c.contact_value,
              relatedPartyType: c.related_party_type
            }))
          }))
        ),
        errors: result.errors.map(e => ({
          customerId: e.customer_id,
          error: e.error_message,
          code: e.error_code
        })),
        timestamp: new Date().toISOString(),
        processingDuration: result.total_duration_ms
      });
    } catch (error) {
      logger.error('Failed to publish result to Kafka:', error);
      // Don't throw here - the processing was successful even if Kafka fails
    }
  }
}