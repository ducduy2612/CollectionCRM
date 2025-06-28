import db from '../config/database';

interface ProcessingRunFilters {
  status?: string;
  limit: number;
  offset: number;
}

interface CustomerAssignmentSearch {
  cif?: string;
  processingRunId?: string;
}

export class ProcessingResultsRepository {
  
  // Create a new processing run
  async createProcessingRun(data: {
    requestId: string;
    campaignGroupIds: string[] | null;
    processingOptions: any;
    startedAt: Date;
  }): Promise<string> {
    const result = await db('campaign_engine.campaign_processing_runs')
      .insert({
        request_id: data.requestId,
        campaign_group_ids: data.campaignGroupIds,
        processing_options: JSON.stringify(data.processingOptions),
        started_at: data.startedAt,
        status: 'running'
      })
      .returning('id');
    
    return result[0].id;
  }

  // Update processing run status
  async updateProcessingRun(requestId: string, data: {
    status: string;
    completedAt?: Date;
    processedCount?: number;
    successCount?: number;
    errorCount?: number;
    totalDurationMs?: number;
  }): Promise<void> {
    await db('campaign_engine.campaign_processing_runs')
      .where('request_id', requestId)
      .update({
        status: data.status,
        completed_at: data.completedAt,
        processed_count: data.processedCount,
        success_count: data.successCount,
        error_count: data.errorCount,
        total_duration_ms: data.totalDurationMs,
        updated_at: new Date()
      });
  }

  // Get processing run by ID
  async getProcessingRun(id: string): Promise<any> {
    const run = await db('campaign_engine.campaign_processing_runs')
      .where('id', id)
      .orWhere('request_id', id)
      .first();
    
    if (run && run.processing_options) {
      run.processing_options = typeof run.processing_options === 'string' 
        ? JSON.parse(run.processing_options) 
        : run.processing_options;
    }
    
    return run;
  }

  // Get all processing runs with filters
  async getProcessingRuns(filters: ProcessingRunFilters): Promise<any[]> {
    let query = db('campaign_engine.campaign_processing_runs')
      .select('*')
      .orderBy('started_at', 'desc')
      .limit(filters.limit)
      .offset(filters.offset);
    
    if (filters.status) {
      query = query.where('status', filters.status);
    }
    
    const runs = await query;
    
    // Parse JSON fields
    return runs.map(run => ({
      ...run,
      processing_options: typeof run.processing_options === 'string' 
        ? JSON.parse(run.processing_options) 
        : run.processing_options
    }));
  }


  // Get campaign results for a processing run
  async getCampaignResults(processingRunId: string): Promise<any[]> {
    return await db('campaign_engine.campaign_results')
      .where('processing_run_id', processingRunId)
      .orderBy('priority', 'asc');
  }



  // Get customer assignments for a campaign result
  async getCustomerAssignments(campaignResultId: string, limit: number, offset: number): Promise<any[]> {
    const assignments = await db('campaign_engine.customer_assignments as ca')
      .select('ca.*')
      .where('ca.campaign_result_id', campaignResultId)
      .limit(limit)
      .offset(offset);
    
    // Get contacts for each assignment
    for (const assignment of assignments) {
      assignment.selected_contacts = await db('campaign_engine.selected_contacts')
        .where('customer_assignment_id', assignment.id)
        .orderBy('rule_priority', 'asc');
    }
    
    return assignments;
  }


  // Get processing errors
  async getProcessingErrors(processingRunId: string): Promise<any[]> {
    return await db('campaign_engine.processing_errors')
      .where('processing_run_id', processingRunId)
      .orderBy('created_at', 'desc');
  }


  // Get processing statistics (returns all records, not just first)
  async getProcessingStatistics(processingRunId: string): Promise<any[]> {
    const allStats = await db('campaign_engine.campaign_statistics')
      .where('processing_run_id', processingRunId)
      .orderBy('created_at', 'desc');
    
    if (!allStats || allStats.length === 0) return [];
    
    // Parse JSON fields safely for each record
    return allStats.map(stats => ({
      ...stats,
      campaign_assignments_by_group: typeof stats.campaign_assignments_by_group === 'string' 
        ? JSON.parse(stats.campaign_assignments_by_group) 
        : stats.campaign_assignments_by_group,
      most_assigned_campaign: typeof stats.most_assigned_campaign === 'string' 
        ? JSON.parse(stats.most_assigned_campaign) 
        : stats.most_assigned_campaign,
      error_summary: typeof stats.error_summary === 'string' 
        ? JSON.parse(stats.error_summary) 
        : stats.error_summary,
      performance_metrics: typeof stats.performance_metrics === 'string' 
        ? JSON.parse(stats.performance_metrics) 
        : stats.performance_metrics
    }));
  }

  // Search customer assignments
  async searchCustomerAssignments(search: CustomerAssignmentSearch): Promise<any[]> {
    let query = db('campaign_engine.customer_assignments as ca')
      .select(
        'ca.*',
        'cr.campaign_id',
        'cr.campaign_name',
        'cr.campaign_group_id',
        'cr.campaign_group_name',
        'cpr.request_id',
        'cpr.started_at as processing_run_started_at'
      )
      .join('campaign_engine.campaign_results as cr', 'ca.campaign_result_id', 'cr.id')
      .join('campaign_engine.campaign_processing_runs as cpr', 'cr.processing_run_id', 'cpr.id');
    
    if (search.cif) {
      query = query.where('ca.cif', search.cif);
    }
    
    
    if (search.processingRunId) {
      query = query.where('cpr.id', search.processingRunId);
    }
    
    const assignments = await query.orderBy('ca.assigned_at', 'desc').limit(100);
    
    // Get contacts for each assignment
    for (const assignment of assignments) {
      assignment.selected_contacts = await db('campaign_engine.selected_contacts')
        .where('customer_assignment_id', assignment.id)
        .orderBy('rule_priority', 'asc');
    }
    
    return assignments;
  }

  // Get processing summary using the stored procedure
  async getProcessingSummary(processingRunId: string): Promise<any> {
    const result = await db.raw(
      `SELECT * FROM campaign_engine.get_processing_run_summary(?::uuid)`,
      [processingRunId]
    );
    
    return result.rows[0] || {
      request_id: null,
      total_customers: 0,
      total_campaigns: 0,
      total_groups: 0,
      total_contacts: 0,
      total_errors: 0,
      processing_duration_ms: 0,
      campaign_results_count: 0
    };
  }





}
