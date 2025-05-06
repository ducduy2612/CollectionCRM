# Collection CRM User Personas

This document outlines detailed user personas for the Collection CRM system, focusing on two key roles: Collection Agents and Supervisors. These personas are based on the system's data model, architecture, and operational requirements.

## Persona 1: Collection Agent

### Demographics and Background

**Name:** Minh Nguyen  
**Age:** 28  
**Education:** Bachelor's degree in Business Administration  
**Work Experience:** 3 years in call center operations, 2 years as a collection agent  
**Location:** Works at the main office in Ho Chi Minh City  
**Family:** Single, lives with parents  

### Profile Summary
Minh is a mid-career collection agent who handles both early and mid-stage collections. He is comfortable with technology but not highly technical. He works primarily in the call center environment and is evaluated based on his collection success rate and call efficiency metrics.

### Goals and Motivations
- Meet or exceed monthly collection targets to earn performance bonuses
- Efficiently process as many cases as possible during work hours
- Maintain a good relationship with customers while being effective at collections
- Advance to a senior agent or team lead position within the next year
- Minimize administrative work to focus on customer interactions
- Learn effective negotiation techniques to improve collection success rate

### Pain Points and Challenges
- Difficulty managing large caseloads efficiently
- Incomplete or outdated customer information leading to wasted time
- Repetitive data entry across multiple systems
- Lack of context when receiving auto-dialed calls in predictive mode
- Difficulty prioritizing which customers to contact first
- Limited visibility into payment history and customer interactions
- Stress from dealing with difficult customers and meeting targets
- System slowdowns during peak hours affecting productivity

### Technical Proficiency
- **Level:** Moderate
- Comfortable with standard office software and web applications
- Can learn new software quickly with proper training
- Uses smartphone apps regularly in personal life
- Limited understanding of database concepts or advanced system features
- Prefers intuitive interfaces with minimal training requirements
- Relies on IT support for complex technical issues

### Key Tasks and Responsibilities

**In Manual Mode:**
- Review assigned customer list at the beginning of each month
- Prioritize customers based on delinquency status, loan amount, and payment history
- Make outbound calls to delinquent customers
- Record detailed notes about customer interactions
- Negotiate payment arrangements with customers
- Update customer contact information when changes are discovered
- Track promises to pay and follow up on missed payments
- Escalate difficult cases to supervisors when necessary

**In Auto Mode (Predictive Dialing):**
- Receive connected calls routed from campaigns
- Quickly review customer information displayed on the 360 screen
- Engage with customers professionally with minimal preparation time
- Record call outcomes and action results
- Schedule follow-up actions when needed
- Handle a higher volume of shorter interactions

### Preferred Tools and Workflows

**Manual Mode Workflow:**
1. Log into the CRM system at the start of shift
2. Review daily targets and assigned customer list
3. Sort customers by priority (DPD, outstanding amount)
4. Make outbound calls by clicking phone numbers on screen
5. Document customer interactions using action recording forms
6. Schedule follow-ups and set reminders for promised payments
7. Update customer status and case information
8. Review daily performance metrics before end of shift

**Auto Mode Workflow:**
1. Log into the CRM and enter the auto-dialer queue
2. Receive notification of incoming connected call
3. Review customer 360 screen while greeting customer
4. Conduct collection conversation following script guidelines
5. Record call outcome and next steps
6. Complete after-call work before receiving next call
7. Take short breaks between call blocks to maintain focus

### System Usage Patterns
- Uses the system 8+ hours per day
- Handles 60-100 customer interactions daily
- Primarily uses web interface on desktop computer
- Frequently switches between customer records
- Heavy usage of search functionality to find information quickly
- Relies on notifications for follow-up reminders
- Needs quick access to customer payment history and contact logs

### Customer 360 Screen Interactions

#### In Manual Mode
The customer 360 screen serves as Minh's command center for customer interactions, providing comprehensive information organized in an intuitive layout.

**Key Information Elements:**
1. **Customer Overview Section**
   - Customer name, CIF number, and segment classification
   - Customer type (INDIVIDUAL/ORGANIZATION) with relevant details
   - Current status indicator (ACTIVE/INACTIVE)
   - Risk classification and delinquency history summary
   - Primary contact methods with verification status indicators
   - Customer case status (from CustomerCase entity)

2. **Contact Information Panel**
   - All phone numbers with clear labeling (MOBILE, HOME, WORK, etc.)
   - Click-to-call functionality for each number
   - Success rate indicator for each phone number (% of successful contacts)
   - Best time to call based on previous successful contacts
   - Email addresses with verification status
   - Physical addresses with verification status
   - Reference contacts (guarantors, family members) with their contact details

3. **Loan Summary Dashboard**
   - Visual indicators of loan health (color-coded by DPD)
   - Outstanding balances across all loans
   - Total due amount requiring immediate attention
   - Payment due dates with countdown timers for urgent cases
   - Loan product types and account numbers
   - Collateral information linked to loans

4. **Action History Timeline**
   - Chronological view of all previous interactions
   - Quick filters for action types (CALL, SMS, EMAIL, VISIT)
   - Outcome of each action with color coding
   - Notes from previous agents with highlighted important details
   - Promises to pay with status indicators (kept/broken)
   - Audio recordings of previous calls accessible with one click

5. **Payment History Section**
   - Recent payment transactions with dates and amounts
   - Payment method used for each transaction
   - Payment patterns visualization (regular/irregular)
   - Missed payment indicators
   - Next scheduled/promised payment with countdown

6. **Action Recording Panel**
   - Quick-access buttons for common action types
   - Templated notes with customizable fields
   - Outcome selection with relevant follow-up fields
   - Promise-to-pay scheduler with reminder setup
   - Follow-up action scheduler

**Workflow Interaction:**
- Minh typically spends 1-2 minutes reviewing the customer 360 screen before initiating a call
- He prioritizes reviewing recent action history and payment patterns
- He prepares talking points based on loan status and previous interactions
- During the call, he navigates between sections to reference relevant information
- After the call, he immediately records the action outcome and schedules any follow-ups
- He may update contact information if changes are discovered during the call

#### In Auto Mode (Predictive Dialing)
In auto mode, Minh has minimal preparation time as calls are connected automatically. The customer 360 screen must present critical information instantly.

**Key Information Elements:**
1. **Instant Recognition Panel**
   - Large display of customer name and greeting script
   - Loan product type and delinquency status (DPD)
   - Outstanding and due amounts highlighted prominently
   - Visual risk indicators and alert flags
   - Campaign context (why this customer is being called today)

2. **Quick Reference Cards**
   - Collapsible/expandable information cards
   - Last interaction summary card (date, type, outcome, agent)
   - Payment history snapshot (last payment date, amount, method)
   - Current promises or arrangements card
   - Special handling instructions or compliance notes

3. **Script Guidance System**
   - Dynamic script suggestions based on customer profile
   - Objection handling prompts based on common scenarios
   - Compliance statements required for specific situations

4. **Real-time Action Interface**
   - Single-click action recording options
   - Quick-select outcome buttons
   - Rapid follow-up scheduling

5. **Customer Sentiment Indicators**
   - Previous cooperation level (from CustomerStatusType)
   - Payment reliability score
   - Communication preference indicators
   - Potential hardship flags
   - Dispute history alerts

**Workflow Interaction:**
- When a call connects, Minh has 3-5 seconds to orient himself with the customer information
- The system highlights the most critical information needed for immediate context
- During the conversation, he can quickly expand relevant sections as needed
- He uses quick-action buttons to record outcomes without disrupting the call flow
- After call completion, he has a brief window (15-30 seconds) to complete notes before the next call
- The system automatically captures call duration and basic metadata

## Persona 2: Collection Supervisor

### Demographics and Background

**Name:** Linh Tran  
**Age:** 35  
**Education:** Master's degree in Finance, Six Sigma Green Belt certification  
**Work Experience:** 5 years as a collection agent, 4 years as a team supervisor  
**Location:** Main office in Ho Chi Minh City, occasionally visits regional offices  
**Family:** Married with one child  

### Profile Summary
Linh manages the entire collection department with multiple teams of agents across different collection stages. She is responsible for overall department performance, resource allocation, and strategy implementation across all collection campaigns. She has strong analytical skills and a deep understanding of the collection process from her years as an agent.

### Goals and Motivations
- Maximize overall collection rates and efficiency metrics across all teams
- Optimize resource allocation to handle delinquent accounts effectively across the department
- Develop agents' skills and improve retention rates throughout the organization
- Implement data-driven collection strategies to improve outcomes for all campaigns
- Demonstrate leadership capabilities for potential advancement to senior management
- Balance workload across all agents to prevent burnout and ensure optimal staffing
- Maintain compliance with regulatory requirements and company policies

### Pain Points and Challenges
- Difficulty balancing administrative duties with department-wide management
- Limited visibility into real-time performance across all collection teams
- Time-consuming process of reassigning customers between agents across different teams
- Lack of flexible tools for enterprise-wide campaign configuration and analysis
- Challenges in identifying underperforming agents and teams for targeted coaching
- Managing department morale while maintaining high performance standards
- Coordinating with other departments (legal, customer service) on complex cases
- Extensive reporting requirements taking time away from strategic activities

### Technical Proficiency
- **Level:** Above Average
- Comfortable with advanced features of business software
- Can create and modify reports and dashboards
- Understands database concepts and basic SQL queries
- Capable of analyzing data using Excel and visualization tools
- Can troubleshoot common technical issues for team members
- Interested in learning new technologies that improve efficiency
- Participates in system testing and provides feedback on new features

### Key Tasks and Responsibilities

**Department Management:**
- Monitor performance metrics across all collection teams and individual agents
- Oversee team leaders who conduct coaching sessions with agents
- Establish quality standards for call handling and collection techniques
- Ensure compliance with collection regulations and policies across all operations
- Conduct department-wide meetings to share best practices and updates
- Oversee staffing levels and resource allocation across all teams

**Customer Assignment:**
- Review organization-wide customer portfolios and delinquency reports
- Establish policies and criteria for reassigning customers between agents:
  - Agent workload and capacity across teams
  - Agent skills and experience level
  - Customer risk profile and complexity
  - Language requirements and geographic considerations
- Ensure balanced caseloads across the entire department
- Implement special handling protocols for high-value or sensitive accounts
- Adjust assignment strategies based on performance analytics

**Campaign Configuration:**
- Design enterprise-wide collection campaign strategies based on:
  - Days Past Due (DPD) segments
  - Outstanding loan amounts
  - Product types (mortgage, auto, personal loans, credit cards)
  - Previous payment behavior
  - Geographic location
- Configure parameters for the entire call center's predictive dialer system
- Establish optimal contact strategies (time of day, frequency) for all campaigns
- Monitor all campaign performance metrics and make strategic adjustments
- Analyze results to continuously refine future campaign strategies
- Coordinate with IT for technical implementation of campaigns across the organization

### Preferred Tools and Workflows

**Daily Workflow:**
1. Review previous day's department-wide performance metrics
2. Check system for escalated cases requiring executive attention
3. Hold brief leadership meeting with team supervisors to set daily priorities
4. Monitor real-time dashboards showing all call center activities during peak hours
5. Oversee quality assurance processes and selective call monitoring
6. Handle administrative tasks and executive reporting requirements
7. Analyze organization-wide performance data to identify improvement areas
8. Plan and adjust upcoming campaign strategies across all collection efforts

**Weekly/Monthly Workflow:**
1. Review comprehensive performance reports for the entire collection operation
2. Reassess customer assignment strategies across all teams
3. Configure new enterprise-wide campaigns based on portfolio analysis
4. Conduct department meetings with all team supervisors to review goals and strategies
5. Coordinate with other departments on cross-functional issues
6. Prepare and present performance reports to executive management
7. Lead strategic planning sessions with team supervisors and other department heads

### System Usage Patterns
- Uses both operational and analytical features of the CRM with emphasis on executive dashboards
- Frequently generates and reviews organization-wide performance reports
- Regularly accesses department-level monitoring tools and aggregated metrics
- Spends significant time configuring enterprise-wide campaigns and assignment strategies
- Uses dashboard views to monitor real-time activities across all collection teams
- Requires access to historical data for trend analysis and forecasting
- Needs administrative privileges for department-wide management functions and system configuration

## Design Implications

These personas highlight several key requirements for the Collection CRM system:

1. **Dual-Mode Interface**: The system must support both manual and auto-dialer modes with appropriate interfaces for each context.

2. **Information Prioritization**: Critical information must be instantly accessible, especially in auto-dialer mode where preparation time is minimal.

3. **Workflow Efficiency**: The system should minimize clicks and streamline common tasks to improve agent productivity.

4. **Performance Analytics**: Supervisors need robust reporting and analytics tools to monitor team performance and optimize strategies.

5. **Flexible Assignment**: The system must support efficient reassignment of customers between agents based on multiple criteria.

6. **Campaign Management**: Comprehensive tools for configuring, monitoring, and analyzing collection campaigns are essential.

7. **Integration**: Seamless integration with telephony systems, payment processing, and other bank systems is critical for operational efficiency.

8. **Scalability**: The system must support approximately 2,000 concurrent collection agents while maintaining performance.

By addressing the needs, pain points, and workflows of these key personas, the Collection CRM system can significantly improve operational efficiency and collection outcomes.