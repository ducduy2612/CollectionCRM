import db from '../config/database';
import { campaignCache } from '../services/cache.service';
import { 
  Campaign, 
  CampaignGroup, 
  BaseCondition, 
  ContactSelectionRule,
  CustomField,
  CreateCampaignRequest,
  CreateCampaignGroupRequest,
  UpdateCampaignRequest,
  UpdateCampaignGroupRequest
} from '../models/campaign.models';

export class CampaignRepository {
  private static readonly CACHE_TTL = 3600; // 1 hour

  // Campaign Groups
  async createCampaignGroup(data: CreateCampaignGroupRequest): Promise<CampaignGroup> {
    const [group] = await db('campaign_engine.campaign_groups')
      .insert(data)
      .returning('*');
    
    await this.clearProcessingCache();
    return group;
  }

  async getCampaignGroups(): Promise<CampaignGroup[]> {
    return db('campaign_engine.campaign_groups')
      .select('*')
      .orderBy('name');
  }

  async getCampaignGroupById(id: string): Promise<CampaignGroup | null> {
    const group = await db('campaign_engine.campaign_groups')
      .where('id', id)
      .first();
    return group || null;
  }

  async updateCampaignGroup(id: string, data: UpdateCampaignGroupRequest): Promise<CampaignGroup | null> {
    const [group] = await db('campaign_engine.campaign_groups')
      .where('id', id)
      .update({ ...data, updated_at: db.fn.now() })
      .returning('*');
    
    if (group) {
      await this.clearProcessingCache();
    }
    return group || null;
  }

  async deleteCampaignGroup(id: string): Promise<boolean> {
    const deleted = await db('campaign_engine.campaign_groups')
      .where('id', id)
      .del();
    
    if (deleted) {
      await this.clearProcessingCache();
    }
    return deleted > 0;
  }

  // Campaigns
  async createCampaign(data: CreateCampaignRequest): Promise<Campaign> {
    return db.transaction(async (trx: any) => {
      // Create campaign
      const [campaign] = await trx('campaign_engine.campaigns')
        .insert({
          campaign_group_id: data.campaign_group_id,
          name: data.name,
          priority: data.priority
        })
        .returning('*');

      // Create base conditions if provided
      if (data.base_conditions && data.base_conditions.length > 0) {
        await trx('campaign_engine.base_conditions').insert(
          data.base_conditions.map(condition => ({
            ...condition,
            campaign_id: campaign.id
          }))
        );
      }

      // Create contact selection rules if provided
      if (data.contact_selection_rules && data.contact_selection_rules.length > 0) {
        for (const rule of data.contact_selection_rules) {
          const [contactRule] = await trx('campaign_engine.contact_selection_rules')
            .insert({
              campaign_id: campaign.id,
              rule_priority: rule.rule_priority
            })
            .returning('*');

          // Create rule conditions
          if (rule.conditions.length > 0) {
            await trx('campaign_engine.contact_rule_conditions').insert(
              rule.conditions.map(condition => ({
                ...condition,
                contact_selection_rule_id: contactRule.id
              }))
            );
          }

          // Create rule outputs
          if (rule.outputs.length > 0) {
            await trx('campaign_engine.contact_rule_outputs').insert(
              rule.outputs.map(output => ({
                contact_selection_rule_id: contactRule.id,
                related_party_type: output.related_party_type,
                contact_type: output.contact_type,
                relationship_patterns: Array.isArray(output.relationship_patterns) && output.relationship_patterns.length > 0 ? JSON.stringify(output.relationship_patterns) : null
              }))
            );
          }
        }
      }

      await this.clearProcessingCache();
      return campaign;
    });
  }

  async getCampaigns(campaignGroupId?: string): Promise<Campaign[]> {
    let query = db('campaign_engine.campaigns as c')
      .leftJoin('campaign_engine.campaign_groups as cg', 'c.campaign_group_id', 'cg.id')
      .leftJoin(
        db('campaign_engine.base_conditions')
          .select('campaign_id')
          .count('* as base_conditions_count')
          .groupBy('campaign_id')
          .as('bc'),
        'c.id',
        'bc.campaign_id'
      )
      .leftJoin(
        db('campaign_engine.contact_selection_rules')
          .select('campaign_id')
          .count('* as contact_rules_count')
          .groupBy('campaign_id')
          .as('csr'),
        'c.id',
        'csr.campaign_id'
      )
      .select(
        'c.*',
        'cg.name as campaign_group_name',
        db.raw('COALESCE(bc.base_conditions_count, 0) as base_conditions_count'),
        db.raw('COALESCE(csr.contact_rules_count, 0) as contact_rules_count')
      );

    if (campaignGroupId) {
      query = query.where('c.campaign_group_id', campaignGroupId);
    }

    return query.orderBy('cg.name').orderBy('c.priority');
  }

  async getCampaignById(id: string): Promise<Campaign | null> {
    const campaign = await db('campaign_engine.campaigns as c')
      .leftJoin('campaign_engine.campaign_groups as cg', 'c.campaign_group_id', 'cg.id')
      .select(
        'c.*',
        'cg.name as campaign_group_name'
      )
      .where('c.id', id)
      .first();
    
    return campaign || null;
  }

  async updateCampaign(id: string, data: UpdateCampaignRequest): Promise<Campaign | null> {
    return db.transaction(async (trx: any) => {
      // Update campaign basic info
      const [campaign] = await trx('campaign_engine.campaigns')
        .where('id', id)
        .update({ 
          name: data.name,
          campaign_group_id: data.campaign_group_id,
          priority: data.priority,
          updated_at: trx.fn.now() 
        })
        .returning('*');

      if (!campaign) {
        return null;
      }

      // If base_conditions are provided, replace them
      if (data.base_conditions !== undefined) {
        // Delete existing base conditions
        await trx('campaign_engine.base_conditions')
          .where('campaign_id', id)
          .del();

        // Insert new base conditions if any
        if (data.base_conditions.length > 0) {
          await trx('campaign_engine.base_conditions').insert(
            data.base_conditions.map(condition => ({
              ...condition,
              campaign_id: id
            }))
          );
        }
      }

      // If contact_selection_rules are provided, replace them
      if (data.contact_selection_rules !== undefined) {
        // Delete existing contact selection rules (cascade will handle conditions and outputs)
        await trx('campaign_engine.contact_selection_rules')
          .where('campaign_id', id)
          .del();

        // Insert new contact selection rules if any
        if (data.contact_selection_rules.length > 0) {
          for (const rule of data.contact_selection_rules) {
            const [contactRule] = await trx('campaign_engine.contact_selection_rules')
              .insert({
                campaign_id: id,
                rule_priority: rule.rule_priority
              })
              .returning('*');

            // Create rule conditions
            if (rule.conditions.length > 0) {
              await trx('campaign_engine.contact_rule_conditions').insert(
                rule.conditions.map(condition => ({
                  ...condition,
                  contact_selection_rule_id: contactRule.id
                }))
              );
            }

            // Create rule outputs
            if (rule.outputs.length > 0) {
              await trx('campaign_engine.contact_rule_outputs').insert(
                rule.outputs.map(output => ({
                  contact_selection_rule_id: contactRule.id,
                  related_party_type: output.related_party_type,
                  contact_type: output.contact_type,
                  relationship_patterns: Array.isArray(output.relationship_patterns) && output.relationship_patterns.length > 0 ? JSON.stringify(output.relationship_patterns) : null
                }))
              );
            }
          }
        }
      }

      await this.clearProcessingCache();
      return campaign;
    });
  }

  async deleteCampaign(id: string): Promise<boolean> {
    const deleted = await db('campaign_engine.campaigns')
      .where('id', id)
      .del();
    
    if (deleted) {
      await this.clearProcessingCache();
    }
    return deleted > 0;
  }

  // Base Conditions
  async getBaseConditions(campaignId: string): Promise<BaseCondition[]> {
    return db('campaign_engine.base_conditions')
      .where('campaign_id', campaignId)
      .orderBy('created_at');
  }

  // Contact Selection Rules
  async getContactSelectionRules(campaignId: string): Promise<ContactSelectionRule[]> {
    try {
      const rules = await db('campaign_engine.contact_selection_rules')
        .where('campaign_id', campaignId)
        .orderBy('rule_priority');

      // Get conditions and outputs for each rule
      for (const rule of rules) {
        rule.conditions = await db('campaign_engine.contact_rule_conditions')
          .where('contact_selection_rule_id', rule.id)
          .orderBy('created_at');

        const outputs = await db('campaign_engine.contact_rule_outputs')
          .where('contact_selection_rule_id', rule.id)
          .orderBy('created_at');
        
        // JSONB is already parsed by PostgreSQL/Knex, no need to JSON.parse()
        rule.outputs = outputs.map((output: any) => ({
          ...output,
          relationship_patterns: output.relationship_patterns || undefined
        }));
      }
      return rules;
    } catch (error) {
      throw error;
    }
  }

  // Custom Fields
  async getCustomFields(): Promise<CustomField[]> {
    return db('campaign_engine.custom_fields')
      .select('*')
      .orderBy('field_name');
  }

  async createCustomField(data: { field_name: string; data_type: string; description?: string }): Promise<CustomField> {
    return db.transaction(async (trx: any) => {
      // Find the next available field column
      const usedColumns = await trx('campaign_engine.custom_fields')
        .select('field_column')
        .orderBy('field_column');
      
      const allColumns = Array.from({ length: 20 }, (_, i) => `field_${i + 1}`);
      const usedColumnSet = new Set(usedColumns.map((row: any) => row.field_column));
      const nextColumn = allColumns.find(col => !usedColumnSet.has(col));
      
      if (!nextColumn) {
        throw new Error('All 20 custom field columns are already in use');
      }
      
      const [field] = await trx('campaign_engine.custom_fields')
        .insert({
          ...data,
          field_column: nextColumn
        })
        .returning('*');
      
      await this.clearProcessingCache();
      return field;
    });
  }

  // Cache management - only clear processing cache when campaigns change
  private async clearProcessingCache(): Promise<void> {
    await campaignCache.delete('campaign-configuration');
  }

  // Processing-specific methods
  async getCampaignConfiguration(): Promise<any> {
    return campaignCache.getOrSet(
      'campaign-configuration',
      async () => {
        // Get all campaign groups with their campaigns
        const groups = await db('campaign_engine.campaign_groups as cg')
          .select('cg.*')
          .orderBy('cg.name');

        for (const group of groups) {
          // Get campaigns for each group
          group.campaigns = await db('campaign_engine.campaigns as c')
            .where('c.campaign_group_id', group.id)
            .select('c.*')
            .orderBy('c.priority');

          // Get base conditions and contact rules for each campaign
          for (const campaign of group.campaigns) {
            campaign.base_conditions = await db('campaign_engine.base_conditions')
              .where('campaign_id', campaign.id)
              .select('*');

            campaign.contact_selection_rules = await db('campaign_engine.contact_selection_rules as csr')
              .where('csr.campaign_id', campaign.id)
              .select('csr.*')
              .orderBy('csr.rule_priority');

            // Get conditions and outputs for each contact rule
            for (const rule of campaign.contact_selection_rules) {
              rule.conditions = await db('campaign_engine.contact_rule_conditions')
                .where('contact_selection_rule_id', rule.id)
                .select('*');

              const outputs = await db('campaign_engine.contact_rule_outputs')
                .where('contact_selection_rule_id', rule.id)
                .select('*');
              
              // relationship_patterns is already parsed from JSONB
              rule.outputs = outputs;
            }
          }
        }

        // Get custom fields
        const customFields = await db('campaign_engine.custom_fields')
          .select('*')
          .orderBy('field_name');

        return {
          campaign_groups: groups,
          custom_fields: customFields
        };
      },
      CampaignRepository.CACHE_TTL
    );
  }

  async getQueueStatistics(): Promise<{
    activeQueues: number;
    totalCampaigns: number;
    campaignGroups: number;
  }> {
    // Get campaign groups count
    const groupsCount = await db('campaign_engine.campaign_groups')
      .count('* as count')
      .first();

    // Get total campaigns count
    const campaignsCount = await db('campaign_engine.campaigns')
      .count('* as count')
      .first();

    return {
      activeQueues: parseInt(groupsCount?.count as string) || 0,
      totalCampaigns: parseInt(campaignsCount?.count as string) || 0,
      campaignGroups: parseInt(groupsCount?.count as string) || 0
    };
  }
}