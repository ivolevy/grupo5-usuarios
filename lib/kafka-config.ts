import { Kafka } from 'kafkajs';

// Configuración de Kafka
export const kafkaConfig = {
  clientId: process.env.KAFKA_CLIENT_ID || 'grupo5-usuarios-app',
  brokers: (process.env.KAFKA_BROKERS || '34.172.179.60:9094').split(','),
  // No SSL/SASL - usando PLAINTEXT
};

// Instancia de Kafka
export const kafka = new Kafka(kafkaConfig);

// Topics disponibles
export const KAFKA_TOPICS = {
  USERS_EVENTS: 'users.events',
  FLIGHTS_EVENTS: 'flights.events',
  RESERVATIONS_EVENTS: 'reservations.events',
  PAYMENTS_EVENTS: 'payments.events',
  SEARCH_EVENTS: 'search.events',
  METRICS_EVENTS: 'metrics.events',
  CORE_INGRESS: 'core.ingress'
} as const;

// Configuración del producer
export const producerConfig = {
  groupId: 'grupo5-usuarios-producer',
  maxInFlightRequests: 1,
  idempotent: true,
  transactionTimeout: 30000,
};

// Configuración del consumer (si necesitamos consumir)
export const consumerConfig = {
  groupId: 'grupo5-usuarios-consumer',
  sessionTimeout: 30000,
  heartbeatInterval: 3000,
  maxBytesPerPartition: 1048576,
  allowAutoTopicCreation: false,
  maxBytes: 10485760,
  maxWaitTimeInMs: 5000,
};
