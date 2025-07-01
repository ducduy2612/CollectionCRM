import { PaymentEventProducer, KafkaConfig } from './producer';
import pino from 'pino';

let kafkaProducer: PaymentEventProducer | null = null;

export async function initializeKafka(): Promise<PaymentEventProducer> {
  const logger = pino({
    level: process.env.LOG_LEVEL || 'info',
    timestamp: true,
  });

  const kafkaConfig: KafkaConfig = {
    brokers: (process.env.KAFKA_BROKERS || 'kafka:9092').split(','),
    clientId: process.env.KAFKA_CLIENT_ID || 'payment-service',
    topic: process.env.KAFKA_TOPIC || 'payment.events',
    batchSize: parseInt(process.env.KAFKA_BATCH_SIZE || '100'),
    compression: process.env.KAFKA_COMPRESSION as any || 'gzip',
    retries: parseInt(process.env.KAFKA_RETRIES || '5'),
    acks: parseInt(process.env.KAFKA_ACKS || '-1') as any,
    timeout: parseInt(process.env.KAFKA_TIMEOUT || '30000'),
  };

  kafkaProducer = new PaymentEventProducer(kafkaConfig, logger.child({ component: 'kafka' }));
  await kafkaProducer.connect();
  
  return kafkaProducer;
}

export async function shutdownKafka(): Promise<void> {
  if (kafkaProducer) {
    await kafkaProducer.disconnect();
    kafkaProducer = null;
  }
}

export function getKafkaProducer(): PaymentEventProducer {
  if (!kafkaProducer) {
    throw new Error('Kafka producer not initialized. Call initializeKafka() first.');
  }
  return kafkaProducer;
}