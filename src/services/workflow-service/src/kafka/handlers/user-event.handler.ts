import { EachMessagePayload } from 'kafkajs';
import { AppDataSource } from '../../config/data-source';
import { Agent, AgentType } from '../../entities/agent.entity';
import { logger } from '../../utils/logger';
import { KAFKA_TOPICS } from '../config';
import { UserCreatedEvent, UserUpdatedEvent, UserDeactivatedEvent } from '../types/events';

/**
 * User event handler class
 */
export class UserEventHandler {
  private agentRepository = AppDataSource.getRepository(Agent);

  /**
   * Process a user event message
   * @param payload - Kafka message payload
   */
  async processMessage(payload: EachMessagePayload): Promise<void> {
    const { topic, message } = payload;
    
    if (!message.value) {
      logger.warn({ message: 'Received empty message', topic });
      return;
    }

    try {
      const messageValue = JSON.parse(message.value.toString());
      
      switch (topic) {
        case KAFKA_TOPICS.USER_CREATED:
          await this.handleUserCreated(messageValue as UserCreatedEvent);
          break;
        case KAFKA_TOPICS.USER_UPDATED:
          await this.handleUserUpdated(messageValue as UserUpdatedEvent);
          break;
        case KAFKA_TOPICS.USER_DEACTIVATED:
          await this.handleUserDeactivated(messageValue as UserDeactivatedEvent);
          break;
        default:
          logger.warn({ message: `Unhandled topic: ${topic}` });
      }
    } catch (error) {
      logger.error({ message: `Error processing message from topic ${topic}`, error });
      throw error;
    }
  }

  /**
   * Handle user created event
   * @param event - User created event
   */
  private async handleUserCreated(event: UserCreatedEvent): Promise<void> {
    logger.info({ message: 'Processing user created event', userId: event.userId });

    try {
      // Check if this user is already linked to an agent
      const existingAgent = await this.agentRepository.findOne({
        where: { userId: event.userId }
      });

      if (existingAgent) {
        logger.info({
          message: 'User already linked to an agent',
          userId: event.userId,
          agentId: existingAgent.id
        });
        return;
      }

      // Automatically create a new agent for the user
      const newAgent = new Agent();
      
      // Generate an employee ID based on the user ID (e.g., EMP-{first 8 chars of userId})
      newAgent.employeeId = `EMP-${event.userId.substring(0, 8)}`;
      
      // Set agent properties from the user event
      newAgent.name = event.username;
      newAgent.email = event.email;
      newAgent.userId = event.userId;
      
      // Default values
      newAgent.team = 'Default Team'; // This could be determined based on user role or other logic
      
      // If the role is 'admin' or 'supervisor', set the agent type accordingly
      if (event.role.toLowerCase().includes('admin')) {
        newAgent.type = AgentType.ADMIN;
      } else if (event.role.toLowerCase().includes('supervisor')) {
        newAgent.type = AgentType.SUPERVISOR;
      } else {
        newAgent.type = AgentType.AGENT;
      }
      
      // Save the new agent
      const savedAgent = await this.agentRepository.save(newAgent);
      
      logger.info({
        message: 'New agent created and linked to user',
        userId: event.userId,
        agentId: savedAgent.id,
        employeeId: savedAgent.employeeId
      });
    } catch (error) {
      logger.error({ message: 'Error handling user created event', userId: event.userId, error });
      throw error;
    }
  }

  /**
   * Handle user updated event
   * @param event - User updated event
   */
  private async handleUserUpdated(event: UserUpdatedEvent): Promise<void> {
    logger.info({ message: 'Processing user updated event', userId: event.userId });

    try {
      // Find the agent linked to this user
      const agent = await this.agentRepository.findOne({
        where: { userId: event.userId }
      });

      if (!agent) {
        logger.info({ message: 'No agent found for updated user', userId: event.userId });
        return;
      }

      // Update agent information if needed
      // For example, if the user's email changed, we might want to update the agent's email
      let updated = false;

      if (event.email && agent.email !== event.email) {
        agent.email = event.email;
        updated = true;
      }

      // Handle user deactivation if isActive is set to false
      if (event.isActive === false && agent.isActive) {
        agent.isActive = false;
        updated = true;
      }

      if (updated) {
        await this.agentRepository.save(agent);
        logger.info({ 
          message: 'Agent updated based on user update', 
          userId: event.userId, 
          agentId: agent.id 
        });
      }
    } catch (error) {
      logger.error({ message: 'Error handling user updated event', userId: event.userId, error });
      throw error;
    }
  }

  /**
   * Handle user deactivated event
   * @param event - User deactivated event
   */
  private async handleUserDeactivated(event: UserDeactivatedEvent): Promise<void> {
    logger.info({ message: 'Processing user deactivated event', userId: event.userId });

    try {
      // Find the agent linked to this user
      const agent = await this.agentRepository.findOne({
        where: { userId: event.userId }
      });

      if (!agent) {
        logger.info({ message: 'No agent found for deactivated user', userId: event.userId });
        return;
      }

      // Deactivate the agent
      if (agent.isActive) {
        agent.isActive = false;
        await this.agentRepository.save(agent);
        logger.info({ 
          message: 'Agent deactivated due to user deactivation', 
          userId: event.userId, 
          agentId: agent.id,
          reason: event.reason
        });
      }
    } catch (error) {
      logger.error({ message: 'Error handling user deactivated event', userId: event.userId, error });
      throw error;
    }
  }
}

// Create a singleton instance
export const userEventHandler = new UserEventHandler();