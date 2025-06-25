// Simple test script to preview the generated SQL
// Run with: node test-sql-preview.js

// Mock the logger and database dependencies
const mockLogger = {
  info: console.log,
  warn: console.warn,
  error: console.error
};

// Mock the imports and dependencies
const ProcessingService = class {
  constructor() {}

  buildCustomerConditions(conditions) {
    if (conditions.length === 0) return '1=1';

    const sqlConditions = conditions.map(condition => {
      return this.buildConditionSQL(condition);
    }).filter(condition => condition !== null);

    return sqlConditions.length > 0 ? sqlConditions.join(' AND ') : '1=1';
  }

  buildConditionSQL(condition) {
    const { field_name, operator, field_value, data_source } = condition;
    
    let fieldReference;
    let isNumeric = false;

    // Mock isNumericField function
    const numericFields = ['total_loans', 'active_loans', 'overdue_loans', 'client_outstanding', 
         'total_due_amount', 'overdue_outstanding', 'overdue_due_amount',
         'max_dpd', 'avg_dpd', 'utilization_ratio', 'loan_outstanding', 
         'loan_due_amount', 'loan_dpd', 'original_amount'];

    switch (data_source) {
      case 'bank_sync_service.loan_campaign_data':
        fieldReference = `lcd.${field_name}`;
        isNumeric = numericFields.includes(field_name);
        break;
      case 'custom_fields':
        fieldReference = `lcd.custom_fields->>'${field_name}'`;
        isNumeric = false;
        break;
      default:
        console.warn(`Unknown data source: ${data_source}`);
        return null;
    }

    switch (operator) {
      case '=':
        return isNumeric 
          ? `${fieldReference} = ${field_value}`
          : `${fieldReference} = '${field_value}'`;
      case '!=':
        return isNumeric
          ? `${fieldReference} != ${field_value}`
          : `${fieldReference} != '${field_value}'`;
      case '>':
        return `${fieldReference} > ${field_value}`;
      case '>=':
        return `${fieldReference} >= ${field_value}`;
      case '<':
        return `${fieldReference} < ${field_value}`;
      case '<=':
        return `${fieldReference} <= ${field_value}`;
      default:
        return null;
    }
  }

  buildContactSelectionQueries(rules) {
    if (rules.length === 0) {
      return this.buildAllContactsQuery();
    }
    return this.buildContactsWithRuleExclusions(rules);
  }

  buildAllContactsQuery() {
    return `
      SELECT 
        cc.customer_id,
        p.id as contact_id,
        p.type as contact_type,
        p.number as contact_value,
        'customer' as related_party_type,
        cc.cif as related_party_cif,
        NULL as related_party_name,
        NULL as relationship_type,
        0 as rule_priority,
        p.is_primary,
        p.is_verified,
        'bank_sync' as source
      FROM campaign_customers cc
      JOIN bank_sync_service.phones p ON cc.cif = p.cif
      
      UNION ALL
      
      SELECT 
        cc.customer_id,
        wp.id as contact_id,
        wp.type as contact_type,
        wp.number as contact_value,
        'customer' as related_party_type,
        cc.cif as related_party_cif,
        NULL as related_party_name,
        NULL as relationship_type,
        0 as rule_priority,
        wp.is_primary,
        wp.is_verified,
        'user_input' as source
      FROM campaign_customers cc
      JOIN workflow_service.phones wp ON cc.cif = wp.cif
      
      UNION ALL
      
      SELECT 
        cc.customer_id,
        rp.id as contact_id,
        rp.type as contact_type,
        rp.number as contact_value,
        'reference' as related_party_type,
        rc.ref_cif as related_party_cif,
        rc.name as related_party_name,
        rc.relationship_type,
        0 as rule_priority,
        rp.is_primary,
        rp.is_verified,
        'bank_sync' as source
      FROM campaign_customers cc
      JOIN bank_sync_service.reference_customers rc ON cc.cif = rc.primary_cif
      JOIN bank_sync_service.phones rp ON rc.ref_cif = rp.cif
      
      UNION ALL
      
      SELECT 
        cc.customer_id,
        wrp.id as contact_id,
        wrp.type as contact_type,
        wrp.number as contact_value,
        'reference' as related_party_type,
        wrc.ref_cif as related_party_cif,
        wrc.name as related_party_name,
        wrc.relationship_type,
        0 as rule_priority,
        wrp.is_primary,
        wrp.is_verified,
        'user_input' as source
      FROM campaign_customers cc
      JOIN workflow_service.reference_customers wrc ON cc.cif = wrc.primary_cif
      JOIN workflow_service.phones wrp ON wrc.ref_cif = wrp.cif
    `;
  }

  buildContactsWithRuleExclusions(rules) {
    // Build CASE statements for each rule
    const ruleCases = [];
    for (let i = 0; i < rules.length; i++) {
      const rule = rules[i];
      const conditions = this.buildCustomerConditions(rule.conditions);
      ruleCases.push(`CASE WHEN ${conditions} THEN 1 ELSE 0 END as rule_${i}_applies`);
    }

    // Build exclusion conditions
    const exclusionConditions = [];
    for (let i = 0; i < rules.length; i++) {
      const rule = rules[i];
      
      for (const output of rule.outputs) {
        const exclusionParts = [`rule_${i}_applies = 1`];
        
        if (output.contact_type && output.contact_type !== 'all') {
          exclusionParts.push(`contact_type = '${output.contact_type}'`);
        }
        
        if (output.related_party_type && output.related_party_type !== 'all') {
          if (output.related_party_type === 'reference') {
            // For reference contacts, check if we need to filter by relationship patterns
            if (output.relationship_patterns && output.relationship_patterns.length > 0) {
              const relationshipConditions = output.relationship_patterns
                .map(pattern => `LOWER(relationship_type) LIKE '%${pattern.toLowerCase()}%'`)
                .join(' OR ');
              exclusionParts.push(`(
                related_party_type = 'reference' AND (${relationshipConditions})
              )`);
            } else {
              // No relationship filter, exclude all references
              exclusionParts.push(`related_party_type = 'reference'`);
            }
          } else {
            // For other party types (customer, etc.)
            exclusionParts.push(`related_party_type = '${output.related_party_type}'`);
          }
        }
        
        if (exclusionParts.length > 1) {
          exclusionConditions.push(`(${exclusionParts.join(' AND ')})`);
        }
      }
    }

    const excludeClause = exclusionConditions.length > 0 
      ? `WHERE NOT (${exclusionConditions.join(' OR ')})` 
      : '';

    return `
      SELECT * FROM (
        SELECT 
          cc.customer_id,
          p.id as contact_id,
          p.type as contact_type,
          p.number as contact_value,
          'customer' as related_party_type,
          cc.cif as related_party_cif,
          NULL as related_party_name,
          NULL as relationship_type,
          0 as rule_priority,
          p.is_primary,
          p.is_verified,
          'bank_sync' as source,
          ${ruleCases.join(',\n          ')}
        FROM campaign_customers cc
        JOIN bank_sync_service.phones p ON cc.cif = p.cif
        
        UNION ALL
        
        SELECT 
          cc.customer_id,
          wp.id as contact_id,
          wp.type as contact_type,
          wp.number as contact_value,
          'customer' as related_party_type,
          cc.cif as related_party_cif,
          NULL as related_party_name,
          NULL as relationship_type,
          0 as rule_priority,
          wp.is_primary,
          wp.is_verified,
          'user_input' as source,
          ${ruleCases.join(',\n          ')}
        FROM campaign_customers cc
        JOIN workflow_service.phones wp ON cc.cif = wp.cif
        
        UNION ALL
        
        SELECT 
          cc.customer_id,
          rp.id as contact_id,
          rp.type as contact_type,
          rp.number as contact_value,
          'reference' as related_party_type,
          rc.ref_cif as related_party_cif,
          rc.name as related_party_name,
          rc.relationship_type,
          0 as rule_priority,
          rp.is_primary,
          rp.is_verified,
          'bank_sync' as source,
          ${ruleCases.join(',\n          ')}
        FROM campaign_customers cc
        JOIN bank_sync_service.reference_customers rc ON cc.cif = rc.primary_cif
        JOIN bank_sync_service.phones rp ON rc.ref_cif = rp.cif
        
        UNION ALL
        
        SELECT 
          cc.customer_id,
          wrp.id as contact_id,
          wrp.type as contact_type,
          wrp.number as contact_value,
          'reference' as related_party_type,
          wrc.ref_cif as related_party_cif,
          wrc.name as related_party_name,
          wrc.relationship_type,
          0 as rule_priority,
          wrp.is_primary,
          wrp.is_verified,
          'user_input' as source,
          ${ruleCases.join(',\n          ')}
        FROM campaign_customers cc
        JOIN workflow_service.reference_customers wrc ON cc.cif = wrc.primary_cif
        JOIN workflow_service.phones wrp ON wrc.ref_cif = wrp.cif
      ) contacts_with_rules
      ${excludeClause}
    `;
  }

  buildOptimizedCampaignQuery(campaign, assignedCifsInGroup) {
    const customerConditions = this.buildCustomerConditions(campaign.base_conditions);
    
    const excludeClause = assignedCifsInGroup.size > 0 
      ? `AND lcd.cif NOT IN (${Array.from(assignedCifsInGroup).map(cif => `'${cif}'`).join(',')})`
      : '';

    const contactQueries = this.buildContactSelectionQueries(campaign.contact_selection_rules);

    return `
      WITH campaign_customers AS (
        SELECT DISTINCT 
          lcd.customer_id,
          lcd.cif,
          lcd.account_number,
          lcd.segment,
          lcd.customer_status as status,
          lcd.total_loans,
          lcd.active_loans,
          lcd.overdue_loans,
          lcd.client_outstanding,
          lcd.total_due_amount,
          lcd.overdue_outstanding,
          lcd.max_dpd,
          lcd.avg_dpd,
          lcd.utilization_ratio
        FROM bank_sync_service.loan_campaign_data lcd
        WHERE ${customerConditions}
        ${excludeClause}
      ),
      all_contacts AS (
        ${contactQueries}
      )
      SELECT 
        cc.*,
        fc.contact_id,
        fc.contact_type,
        fc.contact_value,
        fc.related_party_type,
        fc.related_party_cif,
        fc.related_party_name,
        fc.relationship_type,
        fc.rule_priority,
        fc.is_primary,
        fc.is_verified,
        fc.source
      FROM campaign_customers cc
      LEFT JOIN all_contacts fc ON cc.customer_id = fc.customer_id
      ORDER BY cc.customer_id, fc.rule_priority NULLS LAST, fc.is_primary DESC;
    `;
  }
};

// Sample campaign data WITH exclusion rules
const sampleCampaignWithRules = {
  id: 'campaign-001',
  name: 'High Value Overdue Campaign (With Exclusions)',
  priority: 1,
  base_conditions: [
    {
      id: 'cond-1',
      field_name: 'segment',
      operator: '=',
      field_value: 'VIP',
      data_source: 'bank_sync_service.loan_campaign_data'
    },
    {
      id: 'cond-2',
      field_name: 'max_dpd',
      operator: '>=',
      field_value: '30',
      data_source: 'bank_sync_service.loan_campaign_data'
    },
    {
      id: 'cond-3',
      field_name: 'client_outstanding',
      operator: '>',
      field_value: '1000000',
      data_source: 'bank_sync_service.loan_campaign_data'
    }
  ],
  contact_selection_rules: [
    {
      id: 'rule-1',
      rule_priority: 1,
      conditions: [
        {
          id: 'rule-cond-1',
          field_name: 'segment',
          operator: '=',
          field_value: 'VIP',
          data_source: 'bank_sync_service.loan_campaign_data'
        }
      ],
      outputs: [
        {
          id: 'output-1',
          related_party_type: 'reference',
          contact_type: 'mobile',
          relationship_patterns: ['colleague', 'friend', 'neighbor'] // Exclude these relationships
        }
      ]
    },
    {
      id: 'rule-2',
      rule_priority: 2,
      conditions: [
        {
          id: 'rule-cond-2',
          field_name: 'max_dpd',
          operator: '>',
          field_value: '60',
          data_source: 'bank_sync_service.loan_campaign_data'
        }
      ],
      outputs: [
        {
          id: 'output-2',
          related_party_type: 'customer',
          contact_type: 'office'
        }
      ]
    }
  ]
};

// Sample campaign data WITHOUT exclusion rules  
const sampleCampaignNoRules = {
  id: 'campaign-002',
  name: 'Simple Campaign (No Exclusions)',
  priority: 1,
  base_conditions: [
    {
      id: 'cond-1',
      field_name: 'segment',
      operator: '=',
      field_value: 'PREMIUM',
      data_source: 'bank_sync_service.loan_campaign_data'
    },
    {
      id: 'cond-2',
      field_name: 'max_dpd',
      operator: '>=',
      field_value: '15',
      data_source: 'bank_sync_service.loan_campaign_data'
    }
  ],
  contact_selection_rules: [] // NO EXCLUSION RULES
};

// Generate and display the SQL
const service = new ProcessingService();
const assignedCifs = new Set(['CIF001', 'CIF002', 'CIF003']);

console.log('='.repeat(100));
console.log('SCENARIO 1: CAMPAIGN WITH NO EXCLUSION RULES');
console.log('='.repeat(100));
const queryNoRules = service.buildOptimizedCampaignQuery(sampleCampaignNoRules, assignedCifs);
console.log(`Campaign: ${sampleCampaignNoRules.name}`);
console.log(`Base Conditions: ${sampleCampaignNoRules.base_conditions.length}`);
console.log(`Contact Rules: ${sampleCampaignNoRules.contact_selection_rules.length}`);
console.log('='.repeat(100));
console.log(queryNoRules);
console.log('='.repeat(100));

console.log('\n\n');

console.log('='.repeat(100));
console.log('SCENARIO 2: CAMPAIGN WITH EXCLUSION RULES');
console.log('='.repeat(100));
const queryWithRules = service.buildOptimizedCampaignQuery(sampleCampaignWithRules, assignedCifs);
console.log(`Campaign: ${sampleCampaignWithRules.name}`);
console.log(`Base Conditions: ${sampleCampaignWithRules.base_conditions.length}`);
console.log(`Contact Rules: ${sampleCampaignWithRules.contact_selection_rules.length}`);
console.log('='.repeat(100));
console.log(queryWithRules);
console.log('='.repeat(100));