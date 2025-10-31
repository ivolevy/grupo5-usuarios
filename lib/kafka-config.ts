// Configuración de Kafka API REST
export const kafkaConfig = {
  apiUrl: process.env.KAFKA_API_URL || 'http://34.172.179.60',
  apiKey: process.env.KAFKA_API_KEY || 'microservices-api-key-2024-secure',
  timeout: 10000, // 10 segundos
};

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

// Configuración para eventos de usuario
export const userEventConfig = {
  topic: KAFKA_TOPICS.USERS_EVENTS,
  keyPrefix: 'user-',
  schemaVersion: '1.0',
};