import { logger } from './logger';
import { userCreatedEventSchema } from './kafka-schemas';

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
      data: {
        eventType,
        messageId,
        producer
      }
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
        data: {
          eventType,
          messageId,
          status: result.status
        }
      });
      return true;
    } else {
      const errorBody = await response.text();
      let errorDetails = errorBody;
      
      // Intentar parsear como JSON para obtener más detalles
      try {
        const errorJson = JSON.parse(errorBody);
        errorDetails = JSON.stringify(errorJson, null, 2);
        
        // Log adicional si es un error de validación de schema
        if (errorJson.message?.includes('schema') || errorJson.error?.includes('schema')) {
          logger.error('Error de validación de schema en Kafka', {
            action: 'kafka_schema_validation_error',
            data: {
              eventType,
              messageId,
              status: response.status,
              error: errorDetails,
              payload: typeof payload === 'string' ? JSON.parse(payload) : payload
            }
          });
        }
      } catch {
        // Si no es JSON, usar el texto tal cual
      }
      
      logger.error('Error enviando evento a Kafka', {
        action: 'kafka_send_error',
        data: {
          eventType,
          messageId,
          status: response.status,
          error: errorDetails
        }
      });
      return false;
    }

  } catch (error) {
    logger.error('Excepción enviando evento a Kafka', {
      action: 'kafka_send_exception',
      data: {
        eventType,
        error: error instanceof Error ? error.message : 'Error desconocido'
      }
    });
    return false;
  }
}

/**
 * Envía evento de usuario creado a Kafka
 * ⚠️ ADVERTENCIA: Este evento incluye la contraseña en texto plano.
 * Asegúrate de que Kafka esté configurado con TLS/SSL y acceso restringido.
 */
export async function sendUserCreatedEvent(userData: {
  userId: string;
  nombre_completo: string;
  email: string;
  password: string;
  nationalityOrOrigin: string;
  roles: string[];
  createdAt: string;
  telefono?: string; // Campo opcional
}): Promise<boolean> {
  try {
    // Validar el payload antes de enviarlo
    const validatedPayload = userCreatedEventSchema.parse(userData);
    
    // Construir payload con SOLO los campos requeridos por el schema del servidor
    // El schema del servidor NO incluye telefono, así que lo omitimos
    const payload = {
      userId: validatedPayload.userId,
      nombre_completo: validatedPayload.nombre_completo,
      email: validatedPayload.email,
      password: validatedPayload.password,
      nationalityOrOrigin: validatedPayload.nationalityOrOrigin,
      roles: validatedPayload.roles,
      createdAt: new Date(validatedPayload.createdAt).toISOString(),
      // NO incluir telefono - el schema del servidor no lo acepta
    };

    return sendEventToKafka('users.user.created', payload, 'users-service');
  } catch (validationError) {
    logger.error('Error validando payload antes de enviar a Kafka', {
      action: 'kafka_payload_validation_error',
      data: {
        error: validationError instanceof Error ? validationError.message : 'Error desconocido',
        userData
      }
    });
    return false;
  }
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
