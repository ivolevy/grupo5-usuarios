import { logger } from './logger';

// Configuración de la API REST de Kafka
const KAFKA_API_URL = process.env.KAFKA_API_URL || 'http://34.172.179.60/events';
const API_KEY = process.env.KAFKA_API_KEY || 'microservices-api-key-2024-secure';

/**
 * Envía un evento a Kafka usando la API REST
 */
export async function sendEventToKafka(
  eventType: string,
  payload: any,
  producer: string = 'users-service'
): Promise<boolean> {
  try {
    const messageId = `msg-${eventType}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const correlationId = `corr-${eventType}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const idempotencyKey = `${eventType}-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;

    const event = {
      messageId,
      eventType,
      schemaVersion: "1.0",
      occurredAt: new Date().toISOString(),
      producer,
      correlationId,
      idempotencyKey,
      payload: JSON.stringify(payload)
    };

    logger.info('Enviando evento a Kafka', {
      action: 'kafka_send_event',
      eventType,
      messageId,
      producer
    });

    const response = await fetch(KAFKA_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': API_KEY
      },
      body: JSON.stringify(event)
    });

    if (response.ok) {
      const result = await response.json();
      logger.info('Evento enviado exitosamente a Kafka', {
        action: 'kafka_event_sent',
        eventType,
        messageId,
        status: result.status
      });
      return true;
    } else {
      const errorBody = await response.text();
      logger.error('Error enviando evento a Kafka', {
        action: 'kafka_send_error',
        eventType,
        messageId,
        status: response.status,
        error: errorBody
      });
      return false;
    }

  } catch (error) {
    logger.error('Excepción enviando evento a Kafka', {
      action: 'kafka_send_exception',
      eventType,
      error: error instanceof Error ? error.message : 'Error desconocido'
    });
    return false;
  }
}

/**
 * Envía evento de usuario creado a Kafka
 */
export async function sendUserCreatedEvent(userData: {
  userId: string;
  nationalityOrOrigin: string;
  roles: string[];
  createdAt: string;
}): Promise<boolean> {
  return sendEventToKafka('users.user.created', userData, 'users-service');
}

/**
 * Envía evento de usuario actualizado a Kafka
 */
export async function sendUserUpdatedEvent(userData: {
  userId: string;
  nationalityOrOrigin: string;
  roles: string[];
  updatedAt: string;
  previousData: {
    nationalityOrOrigin: string;
    roles: string[];
  };
}): Promise<boolean> {
  return sendEventToKafka('users.user.updated', userData, 'users-service');
}

/**
 * Envía evento de usuario eliminado a Kafka
 */
export async function sendUserDeletedEvent(userData: {
  userId: string;
  nationalityOrOrigin: string;
  roles: string[];
  createdAt: string;
  deletedAt: string;
  deletionReason: 'user_request' | 'admin_action' | 'inactivity' | 'policy_violation' | 'other';
}): Promise<boolean> {
  return sendEventToKafka('users.user.deleted', userData, 'users-service');
}
