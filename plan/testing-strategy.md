# Testing Strategy for Collection CRM

This document outlines the comprehensive testing strategy for the Collection CRM system, covering all phases of testing from unit testing to user acceptance testing.

## 1. Overview

The testing strategy for the Collection CRM system is designed to ensure that the system meets all functional and non-functional requirements, is reliable, secure, and performs well under expected load. The strategy covers the following key aspects:

1. **Testing Levels**: Unit, integration, system, and acceptance testing
2. **Testing Types**: Functional, non-functional, security, performance, and usability testing
3. **Testing Environments**: Development, testing, staging, and production
4. **Testing Tools and Frameworks**: Tools for test automation, performance testing, and security testing
5. **Test Data Management**: Approaches for generating and managing test data
6. **Defect Management**: Process for tracking and resolving defects
7. **Test Metrics and Reporting**: Metrics for measuring test coverage and quality

## 2. Testing Levels

### 2.1 Unit Testing

Unit testing focuses on testing individual components or functions in isolation to ensure they work as expected.

#### Approach

- **Test-Driven Development (TDD)**: Write tests before implementing functionality
- **Component Isolation**: Use mocks and stubs to isolate components
- **Automated Testing**: Implement automated unit tests as part of the CI/CD pipeline

#### Implementation Details

```typescript
// Example Unit Test for Customer Repository
import { CustomerRepository } from '../repositories/CustomerRepository';
import { Customer } from '../models/Customer';
import { mockDatabase } from '../__mocks__/database';

describe('CustomerRepository', () => {
  let customerRepository: CustomerRepository;
  
  beforeEach(() => {
    // Set up mock database
    mockDatabase.reset();
    customerRepository = new CustomerRepository(mockDatabase);
  });
  
  describe('findByNaturalKey', () => {
    it('should return customer when found', async () => {
      // Arrange
      const expectedCustomer: Customer = {
        id: '1',
        naturalKey: 'CIF123',
        cif: 'CIF123',
        type: 'INDIVIDUAL',
        name: 'John Doe',
        sourceSystem: 'T24',
        createdBy: 'system',
        updatedBy: 'system',
        createdAt: new Date(),
        updatedAt: new Date(),
        isEditable: false,
        lastSyncedAt: new Date(),
      };
      
      mockDatabase.customers.push(expectedCustomer);
      
      // Act
      const customer = await customerRepository.findByNaturalKey('CIF123');
      
      // Assert
      expect(customer).toEqual(expectedCustomer);
    });
    
    it('should return null when customer not found', async () => {
      // Act
      const customer = await customerRepository.findByNaturalKey('NONEXISTENT');
      
      // Assert
      expect(customer).toBeNull();
    });
  });
  
  describe('upsertByNaturalKey', () => {
    it('should insert new customer when not exists', async () => {
      // Arrange
      const newCustomer: Customer = {
        naturalKey: 'CIF123',
        cif: 'CIF123',
        type: 'INDIVIDUAL',
        name: 'John Doe',
        sourceSystem: 'T24',
        createdBy: 'system',
        updatedBy: 'system',
        createdAt: new Date(),
        updatedAt: new Date(),
        isEditable: false,
        lastSyncedAt: new Date(),
      };
      
      // Act
      const result = await customerRepository.upsertByNaturalKey(newCustomer);
      
      // Assert
      expect(result.id).toBeDefined();
      expect(mockDatabase.customers.length).toBe(1);
      expect(mockDatabase.customers[0].cif).toBe('CIF123');
    });
    
    it('should update existing customer when exists', async () => {
      // Arrange
      const existingCustomer: Customer = {
        id: '1',
        naturalKey: 'CIF123',
        cif: 'CIF123',
        type: 'INDIVIDUAL',
        name: 'John Doe',
        sourceSystem: 'T24',
        createdBy: 'system',
        updatedBy: 'system',
        createdAt: new Date(),
        updatedAt: new Date(),
        isEditable: false,
        lastSyncedAt: new Date(),
      };
      
      mockDatabase.customers.push(existingCustomer);
      
      const updatedCustomer: Customer = {
        ...existingCustomer,
        name: 'Jane Doe',
        updatedAt: new Date(),
      };
      
      // Act
      const result = await customerRepository.upsertByNaturalKey(updatedCustomer);
      
      // Assert
      expect(result.id).toBe('1');
      expect(mockDatabase.customers.length).toBe(1);
      expect(mockDatabase.customers[0].name).toBe('Jane Doe');
    });
  });
});
```

#### Coverage Goals

- **Code Coverage**: Aim for 80% code coverage for all microservices
- **Branch Coverage**: Ensure all conditional branches are tested
- **Edge Cases**: Test boundary conditions and error handling

### 2.2 Integration Testing

Integration testing focuses on testing the interactions between components or services to ensure they work together correctly.

#### Approach

- **API Testing**: Test service APIs using contract-based testing
- **Database Integration**: Test interactions with the database
- **Service Integration**: Test interactions between microservices
- **External System Integration**: Test integrations with external systems

#### Implementation Details

```typescript
// Example Integration Test for Bank Synchronization Service
import { BankSyncService } from '../services/BankSyncService';
import { CustomerRepository } from '../repositories/CustomerRepository';
import { LoanRepository } from '../repositories/LoanRepository';
import { T24Connector } from '../connectors/T24Connector';
import { EventBus } from '../events/EventBus';

describe('BankSyncService Integration', () => {
  let bankSyncService: BankSyncService;
  let customerRepository: CustomerRepository;
  let loanRepository: LoanRepository;
  let t24Connector: T24Connector;
  let eventBus: EventBus;
  
  beforeEach(() => {
    // Set up real repositories with test database
    customerRepository = new CustomerRepository(testDatabase);
    loanRepository = new LoanRepository(testDatabase);
    
    // Set up mock T24 connector
    t24Connector = {
      extractCustomers: jest.fn(),
      extractLoans: jest.fn(),
      extractCollaterals: jest.fn(),
    };
    
    // Set up mock event bus
    eventBus = {
      publish: jest.fn(),
      subscribe: jest.fn(),
    };
    
    // Create service with real repositories and mock connectors
    bankSyncService = new BankSyncService(
      customerRepository,
      loanRepository,
      t24Connector,
      eventBus
    );
  });
  
  describe('syncCustomers', () => {
    it('should sync customers from T24', async () => {
      // Arrange
      const mockCustomers = [
        {
          CIF_NUMBER: 'CIF123',
          CUSTOMER_TYPE: 'INDIVIDUAL',
          CUSTOMER_NAME: 'John Doe',
          DOB: '1980-01-01',
          NATIONAL_ID: 'ID123',
          GENDER: 'M',
        },
        {
          CIF_NUMBER: 'CIF456',
          CUSTOMER_TYPE: 'ORGANIZATION',
          COMPANY_NAME: 'Acme Corp',
          REG_NUMBER: 'REG123',
          TAX_ID: 'TAX123',
        },
      ];
      
      t24Connector.extractCustomers.mockResolvedValue(mockCustomers);
      
      // Act
      const result = await bankSyncService.syncCustomers();
      
      // Assert
      expect(result.success).toBe(true);
      expect(result.entitiesProcessed).toBe(2);
      
      // Verify customers were saved to repository
      const customer1 = await customerRepository.findByNaturalKey('CIF123');
      const customer2 = await customerRepository.findByNaturalKey('CIF456');
      
      expect(customer1).not.toBeNull();
      expect(customer1.name).toBe('John Doe');
      expect(customer1.type).toBe('INDIVIDUAL');
      
      expect(customer2).not.toBeNull();
      expect(customer2.companyName).toBe('Acme Corp');
      expect(customer2.type).toBe('ORGANIZATION');
      
      // Verify events were published
      expect(eventBus.publish).toHaveBeenCalledWith(
        'ENTITY_UPDATED',
        expect.objectContaining({
          entityType: 'Customer',
          affectedRecords: expect.arrayContaining(['CIF123', 'CIF456']),
        })
      );
    });
  });
});
```

#### Coverage Goals

- **API Coverage**: Test all service APIs
- **Integration Paths**: Test all integration paths between components
- **Error Handling**: Test error handling and recovery mechanisms

### 2.3 System Testing

System testing focuses on testing the entire system as a whole to ensure it meets the specified requirements.

#### Approach

- **End-to-End Testing**: Test complete business workflows
- **Scenario-Based Testing**: Test real-world scenarios
- **Cross-Functional Testing**: Test interactions across different functional areas

#### Implementation Details

```typescript
// Example System Test for Collection Workflow
import { systemTestDriver } from '../drivers/SystemTestDriver';

describe('Collection Workflow System Tests', () => {
  beforeAll(async () => {
    // Set up test data
    await systemTestDriver.setupTestData();
  });
  
  afterAll(async () => {
    // Clean up test data
    await systemTestDriver.cleanupTestData();
  });
  
  describe('Customer Assignment Workflow', () => {
    it('should assign customer to agent and record action', async () => {
      // Arrange
      const customer = await systemTestDriver.createTestCustomer();
      const agent = await systemTestDriver.createTestAgent();
      
      // Act
      // 1. Assign customer to agent
      const assignment = await systemTestDriver.assignCustomerToAgent(customer.cif, agent.id);
      
      // 2. Record collection action
      const action = await systemTestDriver.recordAction({
        cif: customer.cif,
        type: 'CALL',
        subtype: 'CALL_OUTBOUND',
        actionResult: 'CONTACTED',
        actionDate: new Date(),
        notes: 'Test action',
        createdBy: agent.id,
      });
      
      // 3. Update customer case
      const caseAction = await systemTestDriver.recordCaseAction({
        cif: customer.cif,
        actionDate: new Date(),
        notes: 'Test case action',
        customerStatus: 'COOPERATIVE',
        createdBy: agent.id,
      });
      
      // Assert
      // 1. Verify assignment
      const customerCase = await systemTestDriver.getCustomerCase(customer.cif);
      expect(customerCase.assignedCallAgentId).toBe(agent.id);
      
      // 2. Verify action record
      const actions = await systemTestDriver.getCustomerActions(customer.cif);
      expect(actions).toContainEqual(expect.objectContaining({
        id: action.id,
        type: 'CALL',
        actionResult: 'CONTACTED',
      }));
      
      // 3. Verify case action
      expect(customerCase.customerStatus).toBe('COOPERATIVE');
    });
  });
  
  describe('Payment Processing Workflow', () => {
    it('should process payment and update loan balance', async () => {
      // Arrange
      const customer = await systemTestDriver.createTestCustomer();
      const loan = await systemTestDriver.createTestLoan(customer.cif);
      const initialOutstanding = loan.outstanding;
      const paymentAmount = 1000;
      
      // Act
      // 1. Process payment
      const payment = await systemTestDriver.processPayment({
        referenceNumber: 'REF123',
        loanAccountNumber: loan.accountNumber,
        cif: customer.cif,
        amount: paymentAmount,
        currency: loan.currency,
        paymentDate: new Date(),
        paymentMethod: 'BANK_TRANSFER',
        status: 'COMPLETED',
      });
      
      // 2. Get updated loan
      const updatedLoan = await systemTestDriver.getLoan(loan.accountNumber);
      
      // Assert
      // 1. Verify payment record
      expect(payment.status).toBe('COMPLETED');
      
      // 2. Verify loan balance update
      expect(updatedLoan.outstanding).toBe(initialOutstanding - paymentAmount);
      
      // 3. Verify payment history
      const payments = await systemTestDriver.getLoanPayments(loan.accountNumber);
      expect(payments).toContainEqual(expect.objectContaining({
        referenceNumber: 'REF123',
        amount: paymentAmount,
        status: 'COMPLETED',
      }));
    });
  });
});
```

#### Coverage Goals

- **Business Process Coverage**: Test all key business processes
- **Scenario Coverage**: Test common and critical scenarios
- **Integration Coverage**: Test all system integrations

### 2.4 Acceptance Testing

Acceptance testing focuses on validating that the system meets the business requirements and is ready for production.

#### Approach

- **User Acceptance Testing (UAT)**: Test with real users
- **Alpha/Beta Testing**: Controlled release to select users
- **Acceptance Criteria Validation**: Validate against defined acceptance criteria

#### Implementation Details

```typescript
// Example Acceptance Test Scenarios
const acceptanceTestScenarios = [
  {
    id: 'UAT-001',
    title: 'Customer Search and View',
    description: 'Search for a customer and view their details',
    steps: [
      'Log in as a collection agent',
      'Navigate to the customer search page',
      'Search for a customer by CIF number',
      'View customer details',
      'View customer loans',
      'View customer contact information',
    ],
    expectedResults: [
      'Customer search returns correct results',
      'Customer details are displayed correctly',
      'Customer loans are displayed correctly',
      'Customer contact information is displayed correctly',
    ],
    status: 'Not Started',
  },
  {
    id: 'UAT-002',
    title: 'Record Collection Action',
    description: 'Record a collection action for a customer',
    steps: [
      'Log in as a collection agent',
      'Search for a customer',
      'Navigate to the action recording page',
      'Select action type "Call"',
      'Select action subtype "Outbound Call"',
      'Select action result "Contacted"',
      'Enter action notes',
      'Submit the action',
    ],
    expectedResults: [
      'Action is recorded successfully',
      'Action appears in customer action history',
      'Action is associated with the correct customer',
      'Action details are displayed correctly',
    ],
    status: 'Not Started',
  },
  {
    id: 'UAT-003',
    title: 'Customer Assignment',
    description: 'Assign a customer to a collection agent',
    steps: [
      'Log in as a supervisor',
      'Navigate to the customer assignment page',
      'Search for a customer',
      'Select an agent',
      'Assign the customer to the agent',
    ],
    expectedResults: [
      'Customer is assigned to the agent successfully',
      'Assignment appears in agent workload',
      'Assignment history is updated',
      'Agent can see the assigned customer in their dashboard',
    ],
    status: 'Not Started',
  },
];
```

#### Coverage Goals

- **Requirement Coverage**: Test all functional requirements
- **User Role Coverage**: Test all user roles and permissions
- **Business Scenario Coverage**: Test all business scenarios

## 3. Testing Types

### 3.1 Functional Testing

Functional testing focuses on validating that the system functions according to the specified requirements.

#### Key Areas

1. **Customer Management**
   - Customer search and filtering
   - Customer details and history
   - Customer contact management

2. **Loan Management**
   - Loan search and filtering
   - Loan details and history
   - Payment tracking

3. **Collection Workflow**
   - Action recording
   - Case management
   - Agent assignment

4. **Reporting and Analytics**
   - Dashboard functionality
   - Report generation
   - Data export

#### Test Cases

```typescript
// Example Functional Test Cases for Customer Management
const customerManagementTestCases = [
  {
    id: 'FUNC-CM-001',
    title: 'Customer Search by CIF',
    description: 'Search for a customer by CIF number',
    preconditions: 'User is logged in with appropriate permissions',
    steps: [
      'Navigate to customer search page',
      'Enter CIF number in search field',
      'Click search button',
    ],
    expectedResults: [
      'Customer with matching CIF is displayed',
      'Customer details are accurate',
    ],
    priority: 'High',
  },
  {
    id: 'FUNC-CM-002',
    title: 'Customer Search by Name',
    description: 'Search for a customer by name',
    preconditions: 'User is logged in with appropriate permissions',
    steps: [
      'Navigate to customer search page',
      'Enter customer name in search field',
      'Click search button',
    ],
    expectedResults: [
      'Customers with matching names are displayed',
      'Results are sorted by relevance',
      'Pagination works correctly if multiple results',
    ],
    priority: 'High',
  },
  {
    id: 'FUNC-CM-003',
    title: 'Update Customer Contact Information',
    description: 'Update customer phone number',
    preconditions: 'User is logged in with appropriate permissions',
    steps: [
      'Navigate to customer details page',
      'Click edit button for phone information',
      'Update phone number',
      'Save changes',
    ],
    expectedResults: [
      'Phone number is updated successfully',
      'Update is reflected in customer details',
      'Update history is recorded',
    ],
    priority: 'Medium',
  },
];
```

### 3.2 Non-Functional Testing

Non-functional testing focuses on validating the system's performance, reliability, usability, and other quality attributes.

#### 3.2.1 Performance Testing

Performance testing evaluates the system's responsiveness, throughput, and resource utilization under various conditions.

##### Load Testing

```typescript
// Example Load Test Scenario
const loadTestScenario = {
  id: 'PERF-001',
  title: 'Customer Search Load Test',
  description: 'Test customer search performance under load',
  parameters: {
    virtualUsers: 500,
    rampUpPeriod: '5m',
    duration: '30m',
    targetTransactionsPerSecond: 100,
  },
  steps: [
    'Log in as collection agent',
    'Navigate to customer search page',
    'Search for customers with random criteria',
    'View customer details',
    'Log out',
  ],
  successCriteria: [
    'Average response time < 2 seconds',
    'Error rate < 1%',
    'CPU utilization < 70%',
    'Memory utilization < 80%',
  ],
};
```

##### Stress Testing

```typescript
// Example Stress Test Scenario
const stressTestScenario = {
  id: 'PERF-002',
  title: 'System Stress Test',
  description: 'Test system behavior under extreme load',
  parameters: {
    virtualUsers: 2000,
    rampUpPeriod: '10m',
    duration: '1h',
    targetTransactionsPerSecond: 200,
  },
  steps: [
    'Simulate concurrent user logins',
    'Perform mixed workload (searches, updates, actions)',
    'Generate reports',
    'Process payments',
  ],
  successCriteria: [
    'System remains operational',
    'Graceful degradation under extreme load',
    'No data corruption',
    'Recovery after load reduction',
  ],
};
```

##### Endurance Testing

```typescript
// Example Endurance Test Scenario
const enduranceTestScenario = {
  id: 'PERF-003',
  title: 'System Endurance Test',
  description: 'Test system stability over extended period',
  parameters: {
    virtualUsers: 1000,
    rampUpPeriod: '30m',
    duration: '24h',
    targetTransactionsPerSecond: 50,
  },
  steps: [
    'Simulate normal workload pattern',
    'Include all major system functions',
    'Monitor system resources',
    'Perform periodic checks',
  ],
  successCriteria: [
    'No memory leaks',
    'Consistent response times',
    'No unexpected errors',
    'Resource utilization remains stable',
  ],
};
```

#### 3.2.2 Security Testing

Security testing evaluates the system's ability to protect data and maintain functionality in the face of malicious attacks.

##### Vulnerability Assessment

```typescript
// Example Vulnerability Assessment Plan
const vulnerabilityAssessmentPlan = {
  id: 'SEC-001',
  title: 'System Vulnerability Assessment',
  description: 'Identify security vulnerabilities in the system',
  areas: [
    'Network security',
    'Application security',
    'Database security',
    'Authentication and authorization',
    'Data protection',
  ],
  tools: [
    'OWASP ZAP',
    'Nessus',
    'SonarQube',
    'Dependency Check',
  ],
  successCriteria: [
    'No critical vulnerabilities',
    'No high-risk vulnerabilities',
    'Medium and low-risk vulnerabilities documented',
  ],
};
```

##### Penetration Testing

```typescript
// Example Penetration Testing Plan
const penetrationTestingPlan = {
  id: 'SEC-002',
  title: 'System Penetration Testing',
  description: 'Attempt to exploit identified vulnerabilities',
  areas: [
    'Authentication bypass',
    'Authorization bypass',
    'Injection attacks',
    'Cross-site scripting',
    'Cross-site request forgery',
    'API security',
  ],
  methodology: [
    'Reconnaissance',
    'Scanning',
    'Vulnerability analysis',
    'Exploitation',
    'Post-exploitation',
    'Reporting',
  ],
  successCriteria: [
    'No critical or high-risk vulnerabilities exploitable',
    'All exploitable vulnerabilities documented',
    'Remediation recommendations provided',
  ],
};
```

##### Security Compliance Testing

```typescript
// Example Security Compliance Testing Plan
const securityComplianceTestingPlan = {
  id: 'SEC-003',
  title: 'Security Compliance Testing',
  description: 'Verify compliance with security standards and regulations',
  standards: [
    'OWASP Top 10',
    'GDPR',
    'PCI DSS',
    'ISO 27001',
  ],
  areas: [
    'Data protection',
    'Access control',
    'Audit logging',
    'Encryption',
    'Secure communication',
  ],
  successCriteria: [
    'Compliance with all applicable standards',
    'Documentation of compliance evidence',
    'Remediation plan for non-compliant areas',
  ],
};
```

#### 3.2.3 Usability Testing

Usability testing evaluates the system's ease of use, learnability, and user satisfaction.

##### User Interface Testing

```typescript
// Example User Interface Testing Plan
const userInterfaceTestingPlan = {
  id: 'UI-001',
  title: 'User Interface Testing',
  description: 'Evaluate the user interface design and functionality',
  areas: [
    'Layout and design',
    'Navigation',
    'Forms and inputs',
    'Feedback and messaging',
    'Accessibility',
  ],
  methodology: [
    'Heuristic evaluation',
    'Cognitive walkthrough',
    'User testing',
  ],
  successCriteria: [
    'Consistent design across all pages',
    'Intuitive navigation',
    'Clear error messages',
    'Accessible to users with disabilities',
  ],
};
```

##### User Experience Testing

```typescript
// Example User Experience Testing Plan
const userExperienceTestingPlan = {
  id: 'UX-001',
  title: 'User Experience Testing',
  description: 'Evaluate the overall user experience',
  areas: [
    'Task completion',
    'Efficiency',
    'Learnability',
    'Satisfaction',
    'Error handling',
  ],
  methodology: [
    'Task-based testing',
    'Think-aloud protocol',
    'Satisfaction surveys',
    'Eye tracking',
  ],
  successCriteria: [
    'High task completion rate',
    'Low time on task',
    'High satisfaction scores',
    'Low error rate',
  ],
};
```

### 3.3 Compatibility Testing

Compatibility testing evaluates the system's ability to function correctly in different environments.

#### Browser Compatibility

```typescript
// Example Browser Compatibility Testing Plan
const browserCompatibilityTestingPlan = {
  id: 'COMP-001',
  title: 'Browser Compatibility Testing',
  description: 'Test system compatibility with different browsers',
  browsers: [
    { name: 'Chrome', version: 'Latest' },
    { name: 'Firefox', version: 'Latest' },
    { name: 'Safari', version: 'Latest' },
    { name: 'Edge', version: 'Latest' },
    { name: 'Chrome', version: 'Latest-1' },
    { name: 'Firefox', version: 'Latest-1' },
  ],
  features: [
    'Layout and rendering',
    'JavaScript functionality',
    'Form submission',
    'File uploads',
    'Authentication',
    'PDF generation',
  ],
  successCriteria: [
    'Consistent appearance across browsers',
    'All features work correctly',
    'No browser-specific errors',
  ],
};
```

#### Device Compatibility

```typescript
// Example Device Compatibility Testing Plan
const deviceCompatibilityTestingPlan = {
  id: 'COMP-002',
  title: 'Device Compatibility Testing',
  description: 'Test system compatibility with different devices',
  devices: [
    { type: 'Desktop', resolution: '1920x1080' },
    { type: 'Desktop', resolution: '1366x768' },
    { type: 'Laptop', resolution: '1440x900' },
    { type: 'Tablet', resolution: '1024x768' },
    { type: 'Mobile', resolution: '375x667' },
    { type: 'Mobile', resolution: '360x640' },
  ],
  features: [
    'Responsive layout',
    'Touch interactions',
    'Form inputs',
    'Navigation',
  ],
  successCriteria: [
    'Responsive design adapts to different screen sizes',
    'All features work correctly on all devices',
    'No device-specific errors',
  ],
};
```

## 4. Testing Environments

### 4.1 Environment Setup

#### Development Environment

- **Purpose**: For developers to test their code
- **Data**: Minimal test data
- **Access**: Development team only
- **Deployment**: Continuous deployment from feature branches

#### Testing Environment

- **Purpose**: For QA team to test features
- **Data**: Comprehensive test data
- **Access**: Development and QA teams
- **Deployment**: Scheduled deployments from development

#### Staging Environment

- **Purpose**: For UAT and pre-production testing
- **Data**: Production-like data (anonymized)
- **Access**: Development, QA, and business teams
- **Deployment**: Scheduled deployments from testing

#### Production Environment

- **Purpose**: Live system
- **Data**: Real production data
- **Access**: Authorized users only
- **Deployment**: Controlled releases from staging

### 4.2 Environment Configuration

```typescript
// Example Environment Configuration
const environmentConfigurations = {
  development: {
    database: {
      host: 'dev-db.example.com',
      name: 'crm_dev',
      user: 'dev_user',
      poolSize: 10,
    },
    services: {
      bankSync: {
        url: 'http://dev-bank-sync.example.com',
        pollingInterval: 60000,
      },
      payment: {
        url: 'http://dev-payment.example.com',
        timeout: 30000,
      },
      workflow: {
        url: 'http://dev-workflow.example.com',
        timeout: 30000,
      },
      auth: {
        url: 'http://dev-auth.example.com',
        timeout: 10000,
      },
    },
    externalSystems: {
      t24: {
        url: 'http://dev-t24-mock.example.com',
        username: 'dev_user',
        timeout: 60000,
      }
    }
  }
}