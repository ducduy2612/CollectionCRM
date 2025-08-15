# Collexis User Journey Maps and Workflows

This document outlines detailed user journey maps and workflows for the Collexis system, based on the previously defined user personas. The journeys focus on key workflows for Collection Agents and Supervisors, highlighting the sequence of steps, decision points, information needs, and potential optimization opportunities.

## 1. Collection Agent (Minh Nguyen) Journeys

### 1.1. Manual Mode Workflow

```mermaid
flowchart TD
    Start([Start of workday]) --> Login[Log into CRM system]
    Login --> ReviewTargets[Review daily targets and assigned customer list]
    ReviewTargets --> PrioritizeCustomers[Prioritize customers based on DPD, loan amount, payment history]
    
    PrioritizeCustomers --> SelectCustomer[Select customer to contact]
    
    SelectCustomer --> ReviewCustomer360[Review Customer 360 screen- Customer overview- Contact information- Loan summary- Action history- Payment history]
    
    ReviewCustomer360 --> PrepareCall[Prepare talking points based on customer history and loan status]
    
    PrepareCall --> MakeCall[Make outbound call by clicking phone number on screen]
    
    MakeCall --> CallConnected{Call connected?}
    CallConnected -->|Yes| CustomerEngagement[Engage with customer - Discuss delinquency - Negotiate payment]
    CallConnected -->|No| RecordFailedAttempt[Record failed attempt and reason]
    
    CustomerEngagement --> PaymentPromise{Customer promises to pay?}
    
    PaymentPromise -->|Yes| ScheduleFollowUp[Schedule follow-up for promised payment date]
    PaymentPromise -->|No| AssessNextSteps[Assess next steps based on customer situation]
    
    AssessNextSteps --> DecideAction{Decide action}
    DecideAction -->|Reschedule call| SetNextCall[Set next call date]
    DecideAction -->|Other action| RecordOtherAction[Record other action plan]
    
    RecordFailedAttempt --> UpdateCustomerInfo[Update customer contact information if needed]
    ScheduleFollowUp --> RecordAction[Record action outcome and detailed notes]
    SetNextCall --> RecordAction
    RecordOtherAction --> RecordAction
    
    RecordAction --> UpdateCustomerStatus[Update customer status and case information]
    UpdateCustomerStatus --> NextCustomer{More customers to contact?}
    
    NextCustomer -->|Yes| SelectCustomer
    NextCustomer -->|No| ReviewPerformance[Review daily performance metrics]
    
    ReviewPerformance --> End([End of workflow])
    
    UpdateCustomerInfo --> NextCustomer
```

**Starting Point:** Beginning of workday, agent logs into the CRM system
**End Goal:** Successfully contact assigned customers, negotiate payments, and record outcomes

**Key Steps and Information Needed:**

1. **Log into CRM system**
   - Information: Agent credentials
   - System: Authentication Microservice

2. **Review daily targets and assigned customer list**
   - Information: Performance targets, assigned customers
   - System: Collection Workflow Microservice (CustomerAgent entity)

3. **Prioritize customers**
   - Information: Days Past Due (DPD), outstanding amounts, payment history
   - System: Bank Synchronization Microservice (Loan entity)

4. **Review Customer 360 screen**
   - Information: Customer overview, contact information, loan summary, action history, payment history
   - System: Integration of data from multiple microservices

5. **Make outbound call**
   - Information: Contact phone numbers with success rate indicators
   - System: Integration with Call Center Software

6. **Record action outcomes**
   - Information: Call result, payment promises, follow-up dates
   - System: Collection Workflow Microservice (ActionRecord entity)

7. **Update customer status**
   - Information: Current customer situation, cooperation level
   - System: Collection Workflow Microservice (CustomerCase entity)

**Decision Points:**
- Prioritizing which customers to contact first
- Handling connected vs. failed calls
- Determining next steps based on customer response

**Potential Pain Points:**
- Large caseloads making prioritization difficult
- Incomplete or outdated customer information
- System slowdowns during peak hours
- Repetitive data entry across multiple screens

**Optimization Opportunities:**
- Smart prioritization algorithms for customer sorting
- Quick-access buttons for common actions
- Automated scheduling of follow-ups
- Templated notes with customizable fields

### 1.2. Auto Mode (Predictive Dialing) Workflow

```mermaid
flowchart TD
    Start([Start of auto-dialer session]) --> Login[Log into CRM system]
    Login --> EnterQueue[Enter auto-dialer queue]
    
    EnterQueue --> WaitForCall[Wait for system to connect call]
    
    WaitForCall --> CallConnected[Receive notification of incoming connected call]
    
    CallConnected --> QuickReview[Quick review of Customer 360 screen - Customer name and greeting script - Loan product and delinquency status - Outstanding amounts - Last interaction summary - Payment history snapshot]
    
    QuickReview --> GreetCustomer[Greet customer while continuing to review information]
    
    GreetCustomer --> AssessCustomer[Assess customer situation and follow script guidance]
    
    AssessCustomer --> NegotiatePayment[Negotiate payment arrangement]
    
    NegotiatePayment --> PaymentPromise{Customer promises to pay?}
    
    PaymentPromise -->|Yes| RecordPromise[Record promise to pay with date and amount]
    PaymentPromise -->|No| AssessReason[Assess reason for non-payment]
    
    AssessReason --> DecideAction{Decide action}
    DecideAction -->|Reschedule call| SetNextCall[Set next call date]
    DecideAction -->|Other action| RecordOtherAction[Record other action plan]
    
    RecordPromise --> RecordOutcome[Record call outcome and next steps]
    SetNextCall --> RecordOutcome
    RecordOtherAction --> RecordOutcome
    
    RecordOutcome --> CompleteAfterCallWork[Complete after-call work before next call]
    
    CompleteAfterCallWork --> ContinueSession{Continue session?}
    
    ContinueSession -->|Yes| WaitForCall
    ContinueSession -->|No| ExitQueue[Exit auto-dialer queue]
    
    ExitQueue --> End([End of auto-dialer session])
```

**Starting Point:** Agent enters the auto-dialer queue
**End Goal:** Handle high volume of calls efficiently with minimal preparation time

**Key Steps and Information Needed:**

1. **Enter auto-dialer queue**
   - Information: Agent ID, campaign assignment
   - System: Integration with Call Center Software

2. **Quick review of Customer 360 screen**
   - Information: Instant recognition panel with critical customer information
   - System: Integration of data from multiple microservices with optimized display

3. **Assess customer situation**
   - Information: Script guidance, objection handling prompts
   - System: Collection Workflow Microservice

4. **Record call outcome**
   - Information: Quick-select outcome buttons, rapid follow-up scheduling
   - System: Collection Workflow Microservice (ActionRecord entity)

5. **Complete after-call work**
   - Information: Brief window (15-30 seconds) to complete notes
   - System: Collection Workflow Microservice

**Decision Points:**
- Assessing customer situation quickly with minimal preparation
- Determining appropriate script and negotiation approach
- Deciding on next steps based on customer response
- Managing time efficiently between calls

**Potential Pain Points:**
- Lack of context when receiving auto-dialed calls
- Limited time to review customer information
- Stress from handling high call volumes
- System delays impacting after-call work completion

**Optimization Opportunities:**
- Intelligent information prioritization on the Customer 360 screen
- Single-click action recording options
- Dynamic script suggestions based on customer profile
- Automated call metadata capture

### 1.3. Mode Switching Workflow

```mermaid
flowchart TD
    Start([Start of workday]) --> Login[Log into CRM system]
    
    Login --> CheckSchedule[Check daily schedule and campaign assignments]
    
    CheckSchedule --> DecideMode{Decide initial mode}
    
    DecideMode -->|Manual mode| EnterManualMode[Enter manual mode - Load assigned customer list - Set up prioritization filters]
    DecideMode -->|Auto mode| EnterAutoMode[Enter auto-dialer queue - Select assigned campaign - Prepare for connected calls]
    
    EnterManualMode --> WorkInManualMode[Work in manual mode]
    EnterAutoMode --> WorkInAutoMode[Work in auto-dialer mode]
    
    WorkInManualMode --> SwitchNeeded1{Switch needed?}
    WorkInAutoMode --> SwitchNeeded2{Switch needed?}
    
    SwitchNeeded1 -->|Yes| SwitchReason1{Reason for switch}
    SwitchNeeded1 -->|No| ContinueManual[Continue manual mode work]
    
    SwitchNeeded2 -->|Yes| SwitchReason2{Reason for switch}
    SwitchNeeded2 -->|No| ContinueAuto[Continue auto-dialer mode]
    
    SwitchReason1 -->|Campaign start| PrepareForAuto[Complete current task and prepare for auto mode]
    SwitchReason1 -->|Follow-up needed| StayInManual[Remain in manual mode for follow-up tasks]
    
    SwitchReason2 -->|Campaign end| ReturnToManual[Exit auto-dialer queue and return to manual mode]
    SwitchReason2 -->|Break time| TakeBreak[Exit current mode and take scheduled break]
    
    PrepareForAuto --> EnterAutoMode
    StayInManual --> ContinueManual
    
    ReturnToManual --> EnterManualMode
    TakeBreak --> ResumeWork[Resume work after break]
    
    ResumeWork --> DecideMode
    
    ContinueManual --> EndOfDay1{End of day?}
    ContinueAuto --> EndOfDay2{End of day?}
    
    EndOfDay1 -->|Yes| Logout1[Complete final tasks and log out]
    EndOfDay1 -->|No| WorkInManualMode
    
    EndOfDay2 -->|Yes| Logout2[Complete final tasks and log out]
    EndOfDay2 -->|No| WorkInAutoMode
    
    Logout1 --> End([End of workday])
    Logout2 --> End
```

**Starting Point:** Agent needs to switch between manual and auto modes
**End Goal:** Efficiently transition between modes while maintaining productivity

**Key Steps and Information Needed:**

1. **Check daily schedule and campaign assignments**
   - Information: Campaign schedules, assigned customer lists
   - System: Collection Workflow Microservice

2. **Decide initial mode**
   - Information: Campaign start times, priority follow-ups
   - System: Collection Workflow Microservice

3. **Switch between modes**
   - Information: Campaign status, workload in each mode
   - System: Integration between CRM and Call Center Software

**Decision Points:**
- When to switch between manual and auto modes
- How to prioritize work when returning to manual mode
- When to take breaks between modes

**Potential Pain Points:**
- Loss of context when switching modes
- Incomplete tasks when forced to switch modes
- Mental adjustment required between different work rhythms

**Optimization Opportunities:**
- Seamless transition between interfaces
- Task preservation when switching modes
- Smart scheduling of mode switches based on workload
- Automated prioritization when returning to manual mode

## 2. Supervisor (Linh Tran) Journeys

### 2.1. Customer Reassignment Workflow

```mermaid
flowchart TD
    Start([Start reassignment process]) --> ReviewWorkloads[Review agent workloads and capacity]
    
    ReviewWorkloads --> IdentifyImbalances[Identify workload imbalances and capacity issues]
    
    IdentifyImbalances --> ReviewCustomerPortfolios[Review organization-wide customer portfolios]
    
    ReviewCustomerPortfolios --> ApplyReassignmentCriteria[Apply reassignment criteria - Agent workload and capacity - Agent skills and experience - Customer risk profile - Language requirements - Geographic considerations]
    
    ApplyReassignmentCriteria --> GenerateReassignmentPlan[Generate customer reassignment plan]
    
    GenerateReassignmentPlan --> ReviewPlan[Review reassignment plan and potential impact]
    
    ReviewPlan --> Approve{Approve plan?}
    
    Approve -->|Yes| ImplementReassignment[Implement reassignment in system]
    Approve -->|No| AdjustCriteria[Adjust reassignment criteria]
    
    AdjustCriteria --> ApplyReassignmentCriteria
    
    ImplementReassignment --> UpdateCustomerAgent[Update CustomerAgent records - End current assignments - Create new assignments]
    
    UpdateCustomerAgent --> NotifyAgents[Notify affected agents about reassignments]
    
    NotifyAgents --> MonitorTransition[Monitor transition and address any issues]
    
    MonitorTransition --> EvaluateResults[Evaluate results of reassignment]
    
    EvaluateResults --> End([End reassignment process])
```

**Starting Point:** Need to reassign customers due to workload imbalances or other factors
**End Goal:** Balanced workloads across agents with optimal customer-agent matching

**Key Steps and Information Needed:**

1. **Review agent workloads and capacity**
   - Information: Current assignments, performance metrics, capacity limits
   - System: Collection Workflow Microservice (Agent entity, CustomerAgent entity)

2. **Review customer portfolios**
   - Information: Customer risk profiles, delinquency status, loan amounts
   - System: Bank Synchronization Microservice (Customer entity, Loan entity)

3. **Apply reassignment criteria**
   - Information: Agent skills, customer characteristics, workload targets
   - System: Collection Workflow Microservice

4. **Implement reassignment**
   - Information: CustomerAgent mappings, effective dates
   - System: Collection Workflow Microservice (CustomerAgent entity)

**Decision Points:**
- Determining which customers to reassign
- Matching customers to appropriate agents
- Approving the reassignment plan
- Handling special cases or high-value customers

**Potential Pain Points:**
- Time-consuming process of reassigning customers
- Ensuring balanced workloads while maintaining appropriate customer-agent matches
- Managing the transition period
- Communicating changes effectively to agents

**Optimization Opportunities:**
- Automated workload balancing algorithms
- Bulk reassignment tools
- Performance prediction based on customer-agent matching
- Streamlined notification process

### 2.2. Campaign Configuration Workflow

```mermaid
flowchart TD
    Start([Start campaign configuration]) --> AnalyzePortfolio[Analyze loan portfolio data]
    
    AnalyzePortfolio --> IdentifySegments[Identify customer segments - DPD ranges - Loan product types - Outstanding amounts - Payment behavior - Geographic location]
    
    IdentifySegments --> DefineStrategy[Define collection strategy for each segment]
    
    DefineStrategy --> ConfigureCampaigns[Configure campaign parameters - Contact frequency - Time of day - Script selection - Agent skill requirements]
    
    ConfigureCampaigns --> SetPriorities[Set campaign priorities and resource allocation]
    
    SetPriorities --> ReviewConfiguration[Review campaign configuration and projected outcomes]
    
    ReviewConfiguration --> Approve{Approve configuration?}
    
    Approve -->|Yes| ImplementCampaign[Implement campaign in system]
    Approve -->|No| AdjustConfiguration[Adjust campaign configuration]
    
    AdjustConfiguration --> ConfigureCampaigns
    
    ImplementCampaign --> IntegrateWithCallCenter[Integrate with call center predictive dialer system]
    
    IntegrateWithCallCenter --> NotifyTeams[Notify team leaders about new campaigns]
    
    NotifyTeams --> LaunchCampaign[Launch campaign]
    
    LaunchCampaign --> MonitorPerformance[Monitor campaign performance and make adjustments]
    
    MonitorPerformance --> EvaluateResults[Evaluate campaign results]
    
    EvaluateResults --> End([End campaign cycle])
```

**Starting Point:** Need to create or update collection campaigns
**End Goal:** Optimized campaigns that maximize collection outcomes

**Key Steps and Information Needed:**

1. **Analyze loan portfolio data**
   - Information: Loan status, delinquency rates, customer segments
   - System: Bank Synchronization Microservice (Loan entity)

2. **Define collection strategy**
   - Information: Historical performance data, resource constraints
   - System: Collection Workflow Microservice

3. **Configure campaign parameters**
   - Information: Contact strategies, script templates, agent skills
   - System: Integration with Call Center Software

4. **Monitor campaign performance**
   - Information: Real-time metrics, contact rates, collection rates
   - System: Collection Workflow Microservice and Call Center Software

**Decision Points:**
- Segmenting customers for different campaigns
- Allocating resources across campaigns
- Setting contact strategies (time, frequency)
- Adjusting campaigns based on performance

**Potential Pain Points:**
- Complex configuration process across multiple systems
- Balancing multiple campaigns with limited resources
- Predicting campaign outcomes accurately
- Making timely adjustments to underperforming campaigns

**Optimization Opportunities:**
- AI-driven segmentation and strategy recommendations
- Automated campaign optimization based on performance
- Integrated campaign management across systems
- Real-time performance dashboards

### 2.3. Agent Performance Monitoring Workflow

```mermaid
flowchart TD
    Start([Start performance monitoring]) --> ReviewDashboards[Review real-time performance dashboards]
    
    ReviewDashboards --> AnalyzeMetrics[Analyze key performance metrics - Collection rates - Call volumes - Promise-to-pay rates - Customer feedback]
    
    AnalyzeMetrics --> IdentifyPatterns[Identify performance patterns and trends]
    
    IdentifyPatterns --> CompareToTargets[Compare performance to targets]
    
    CompareToTargets --> PerformanceIssue{Performance issues?}
    
    PerformanceIssue -->|Yes| IdentifyCauses[Identify root causes of performance issues]
    PerformanceIssue -->|No| RecognizeSuccess[Recognize successful performance]
    
    IdentifyCauses --> DetermineAction{Determine action}
    
    DetermineAction -->|Coaching needed| ScheduleCoaching[Schedule coaching session with agent]
    DetermineAction -->|Process issue| AddressProcessIssue[Address process or system issue]
    DetermineAction -->|Resource issue| AdjustResources[Adjust resource allocation]
    
    ScheduleCoaching --> ConductCoaching[Conduct coaching session and document outcomes]
    AddressProcessIssue --> ImplementChanges[Implement process changes]
    AdjustResources --> ReallocateWork[Reallocate work or adjust assignments]
    
    ConductCoaching --> SetFollowUp[Set follow-up date to review improvement]
    ImplementChanges --> MonitorChanges[Monitor impact of process changes]
    ReallocateWork --> EvaluateAdjustment[Evaluate effect of resource adjustment]
    
    RecognizeSuccess --> ShareBestPractices[Share best practices with team]
    
    SetFollowUp --> DocumentActions[Document actions taken and expected outcomes]
    MonitorChanges --> DocumentActions
    EvaluateAdjustment --> DocumentActions
    ShareBestPractices --> DocumentActions
    
    DocumentActions --> PrepareReports[Prepare performance reports for executive management]
    
    PrepareReports --> End([End monitoring cycle])
```

**Starting Point:** Regular performance monitoring cycle or specific performance concern
**End Goal:** Optimized agent performance and continuous improvement

**Key Steps and Information Needed:**

1. **Review performance dashboards**
   - Information: Real-time and historical performance metrics
   - System: Collection Workflow Microservice (ActionRecord entity)

2. **Analyze key performance metrics**
   - Information: Collection rates, call volumes, promise-to-pay rates
   - System: Collection Workflow Microservice and Call Center Software

3. **Identify root causes of performance issues**
   - Information: Call recordings, action records, customer feedback
   - System: Collection Workflow Microservice and Call Center Software

4. **Conduct coaching and implement changes**
   - Information: Performance improvement plans, best practices
   - System: Collection Workflow Microservice

**Decision Points:**
- Determining whether performance issues exist
- Identifying the root causes of performance issues
- Selecting appropriate interventions (coaching, process changes, resource adjustments)
- Setting appropriate follow-up timelines

**Potential Pain Points:**
- Limited visibility into real-time performance
- Difficulty isolating causes of performance issues
- Time constraints for coaching and follow-up
- Balancing performance management with other responsibilities

**Optimization Opportunities:**
- Automated performance alerts and anomaly detection
- AI-assisted root cause analysis
- Integrated coaching tools and resources
- Streamlined reporting and documentation

## Summary of User Journeys and Workflows

The user journey maps and workflows created for the Collexis system provide a comprehensive view of how Collection Agents and Supervisors interact with the system to perform their key tasks. These journeys highlight:

1. **For Collection Agents:**
   - The structured approach to handling customer interactions in both manual and auto modes
   - The critical information needed at each step of the collection process
   - The decision points that determine the flow of activities
   - The challenges of switching between different work modes

2. **For Supervisors:**
   - The complex process of optimizing resource allocation through customer reassignment
   - The strategic approach to campaign configuration and management
   - The systematic monitoring and improvement of agent performance

The journeys also identify several common pain points and optimization opportunities that can be addressed in the system design:

- **Information Access:** Ensuring critical information is available at the right time
- **Process Efficiency:** Streamlining workflows to reduce administrative burden
- **Decision Support:** Providing guidance at key decision points
- **System Integration:** Ensuring seamless interaction between different components

These user journey maps provide a foundation for detailed system design and can be used to validate that the Collexis system effectively supports the needs of its primary users.