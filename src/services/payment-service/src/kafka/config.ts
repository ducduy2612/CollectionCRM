import { Kafka, logLevel } from 'kafkajs';

export const kafka = new Kafka({
  clientId: process.env.KAFKA_CLIENT_ID || 'payment-service',
  brokers: (process.env.KAFKA_BROKERS || 'localhost:9092').split(','),
  logLevel: process.env.NODE_ENV === 'production' ? logLevel.ERROR : logLevel.INFO,
  retry: {
    initialRetryTime: parseInt(process.env.KAFKA_RETRY_INITIAL_TIME || '5000'),
    retries: parseInt(process.env.KAFKA_RETRY_ATTEMPTS || '8'),
  },
});