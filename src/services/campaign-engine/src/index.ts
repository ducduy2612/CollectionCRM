import { Kafka } from 'kafkajs';
import dotenv from 'dotenv';
import logger from './utils/logger';
import { fetchCampaignConfig, fetchCustomFields } from './config/campaign.config';
import { processCustomerBatch, setCampaignConfigCache, setCustomFieldsCache } from './engine/processor';

dotenv.config();

const kafka = new Kafka({
  clientId: 'campaign-engine',
  brokers: process.env.KAFKA_BROKERS ? process.env.KAFKA_BROKERS.split(',') : ['localhost:9092'],
});

const consumer = kafka.consumer({ groupId: 'campaign-engine-group' });
const producer = kafka.producer();

const INPUT_TOPIC = process.env.KAFKA_INPUT_TOPIC || 'customer-processing-requests';
const OUTPUT_TOPIC = process.env.KAFKA_OUTPUT_TOPIC || 'campaign-processing-results';

const run = async () => {
  await consumer.connect();
  await producer.connect();
  logger.info('Kafka consumer and producer connected');

  // Fetch and cache campaign configuration and custom fields
  try {
    const campaignConfig = await fetchCampaignConfig();
    const customFields = await fetchCustomFields();
    setCampaignConfigCache(campaignConfig);
    setCustomFieldsCache(customFields);
    logger.info('Campaign configuration and custom fields loaded successfully.');
  } catch (error) {
    logger.error('Failed to load campaign configuration or custom fields, exiting:', error);
    process.exit(1);
  }

  await consumer.subscribe({ topic: INPUT_TOPIC, fromBeginning: false });
  logger.info(`Subscribed to topic: ${INPUT_TOPIC}`);

  await consumer.run({
    eachBatch: async ({ batch, resolveOffset, heartbeat, commitOffsetsIfNecessary, uncommittedOffsets }) => {
      logger.info(`Received batch with ${batch.messages.length} messages from topic ${batch.topic}`);
      // Process messages in batch
      for (const message of batch.messages) {
        if (!message.value) {
          logger.warn('Received message with null or undefined value');
          resolveOffset(message.offset);
          continue;
        }
        try {
          const customerId = message.value.toString(); // Assuming message value is customer ID string
          const customerIdsInBatch = batch.messages.map(msg => msg.value?.toString()).filter(Boolean) as string[];
          logger.info(`Processing batch of ${customerIdsInBatch.length} customer IDs.`);

          const processedResults = await processCustomerBatch(customerIdsInBatch);

          // Publish results to output topic
          const messages = processedResults.map(result => ({
            value: JSON.stringify(result),
            key: result.customerId, // Use customerId as key for partitioning
          }));

          await producer.send({
            topic: OUTPUT_TOPIC,
            messages: messages,
          });
          logger.info(`Published results for ${processedResults.length} customers to topic ${OUTPUT_TOPIC}`);
          logger.info(`Published result for customer ID ${customerId} to topic ${OUTPUT_TOPIC}`);

          resolveOffset(message.offset);
          await commitOffsetsIfNecessary();
          await heartbeat();

        } catch (error) {
          logger.error(`Error processing message for customer ID ${message.value?.toString()}:`, error);
          // Depending on error handling strategy, you might want to send to a dead-letter queue
          // For now, we resolve the offset to avoid reprocessing the same failing message indefinitely
          resolveOffset(message.offset);
        }
      }
    },
  });
};

run().catch(async (e) => {
  logger.error('Error in campaign engine:', e);
  try {
    await consumer.disconnect();
    await producer.disconnect();
  } catch (e) {
    logger.error('Error disconnecting Kafka:', e);
  }
  process.exit(1);
});

// Handle graceful shutdown
process.on('SIGINT', async () => {
  logger.info('SIGINT received, disconnecting Kafka...');
  await consumer.disconnect();
  await producer.disconnect();
  logger.info('Kafka disconnected. Exiting.');
  process.exit(0);
});

process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, disconnecting Kafka...');
  await consumer.disconnect();
  await producer.disconnect();
  logger.info('Kafka disconnected. Exiting.');
  process.exit(0);
});