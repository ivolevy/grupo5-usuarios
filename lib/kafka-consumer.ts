import './server-only'; // Forzar que solo se ejecute en el servidor

import { Consumer, Kafka } from 'kafkajs';
import { kafka, KAFKA_TOPICS, consumerConfig } from './kafka-config';
import { logger } from './logger';
import { prisma } from './db';
import { hashPassword } from './auth';
import { userCreatedEventSchema } from './kafka-schemas';
import { randomUUID } from 'crypto';

// Tipo para el envelope del evento
interface KafkaEventEnvelope {
  messageId: string;
  eventType: string;
  schemaVersion: string;
  occurredAt: string;
  producer: string;
  correlationId: string;
  idempotencyKey: string;
  payload: string | object; // Puede venir como string JSON o como objeto
}

// Tipo para el payload de usuario creado
interface UserCreatedPayload {
  userId: string;
  nombre_completo: string;
  email: string;
  password: string;
  nationalityOrOrigin: string;
  roles: string[];
  createdAt: string;
  telefono?: string; // Campo opcional
}

class KafkaConsumerService {
  private consumer: Consumer | null = null;
  private isRunning = false;
  private isProcessing = false;

  /**
   * Conecta el consumer a Kafka
   */
  async connect(): Promise<void> {
    try {
      if (this.consumer) {
        return;
      }

      this.consumer = kafka.consumer({
        groupId: consumerConfig.groupId,
        sessionTimeout: consumerConfig.sessionTimeout,
        heartbeatInterval: consumerConfig.heartbeatInterval,
        maxBytesPerPartition: consumerConfig.maxBytesPerPartition,
        allowAutoTopicCreation: consumerConfig.allowAutoTopicCreation,
        maxBytes: consumerConfig.maxBytes,
        maxWaitTimeInMs: consumerConfig.maxWaitTimeInMs,
      });

      await this.consumer.connect();

      logger.info('Kafka consumer conectado exitosamente', {
        action: 'kafka_consumer_connected',
      });
    } catch (error) {
      logger.error('Error conectando Kafka consumer', {
        action: 'kafka_consumer_connection_error',
        data: {
          error: error instanceof Error ? error.message : 'Error desconocido'
        }
      });
      throw new Error('Error conectando a Kafka consumer');
    }
  }

  /**
   * Desconecta el consumer de Kafka
   */
  async disconnect(): Promise<void> {
    try {
      if (this.consumer) {
        await this.consumer.disconnect();
        this.consumer = null;
        this.isRunning = false;

        logger.info('Kafka consumer desconectado', {
          action: 'kafka_consumer_disconnected',
        });
      }
    } catch (error) {
      logger.error('Error desconectando Kafka consumer', {
        action: 'kafka_consumer_disconnection_error',
        data: {
          error: error instanceof Error ? error.message : 'Error desconocido'
        }
      });
    }
  }

  /**
   * Parsea el payload del evento
   */
  private parsePayload(payload: string | object): any {
    if (typeof payload === 'string') {
      try {
        return JSON.parse(payload);
      } catch (error) {
        logger.error('Error parseando payload JSON', {
          action: 'kafka_parse_payload_error',
          data: {
            error: error instanceof Error ? error.message : 'Error desconocido'
          }
        });
        throw new Error('Payload inválido');
      }
    }
    return payload;
  }

  /**
   * Procesa un evento de usuario creado
   */
  private async handleUserCreatedEvent(envelope: KafkaEventEnvelope): Promise<void> {
    try {
      const rawPayload = this.parsePayload(envelope.payload);
      
      // Validar el payload con el schema
      const payload = userCreatedEventSchema.parse(rawPayload) as UserCreatedPayload;

      logger.info('Procesando evento de usuario creado', {
        action: 'kafka_process_user_created',
        data: {
          userId: payload.userId,
          email: payload.email,
          messageId: envelope.messageId
        }
      });

      // Verificar si el usuario ya existe por email
      const existingUserByEmail = await prisma.usuarios.findFirst({ email: payload.email });
      if (existingUserByEmail) {
        logger.warn('Usuario ya existe por email, ignorando evento', {
          action: 'kafka_user_already_exists_email',
          data: {
            userId: payload.userId,
            email: payload.email,
            existingUserId: existingUserByEmail.id,
            messageId: envelope.messageId
          }
        });
        return;
      }

      // Verificar si el ID ya existe y generar uno nuevo si es necesario
      let finalUserId = payload.userId;
      let existingUserById = await prisma.usuarios.findUnique({ id: payload.userId });
      
      if (existingUserById) {
        logger.warn('ID del evento ya existe, generando nuevo ID', {
          action: 'kafka_user_id_exists_generating_new',
          data: {
            originalUserId: payload.userId,
            email: payload.email,
            messageId: envelope.messageId
          }
        });

        // Generar un nuevo ID que no exista
        let attempts = 0;
        const maxAttempts = 10; // Límite de intentos para evitar loops infinitos
        
        while (existingUserById && attempts < maxAttempts) {
          finalUserId = randomUUID();
          existingUserById = await prisma.usuarios.findUnique({ id: finalUserId });
          attempts++;
        }

        if (attempts >= maxAttempts) {
          logger.error('No se pudo generar un ID único después de múltiples intentos', {
            action: 'kafka_user_id_generation_failed',
            data: {
              originalUserId: payload.userId,
              email: payload.email,
              messageId: envelope.messageId
            }
          });
          throw new Error('No se pudo generar un ID único para el usuario');
        }

        logger.info('Nuevo ID generado exitosamente', {
          action: 'kafka_user_new_id_generated',
          data: {
            originalUserId: payload.userId,
            newUserId: finalUserId,
            email: payload.email,
            attempts: attempts,
            messageId: envelope.messageId
          }
        });
      }

      // Hashear la contraseña
      const hashedPassword = await hashPassword(payload.password);

      // Crear el usuario con el ID final (original o generado)
      const newUser = await prisma.usuarios.create({
        id: finalUserId, // Usar el ID original o el nuevo generado
        nombre_completo: payload.nombre_completo,
        email: payload.email,
        password: hashedPassword,
        rol: payload.roles[0] || 'usuario',
        email_verified: true,
        nacionalidad: payload.nationalityOrOrigin || 'No especificada',
        telefono: payload.telefono || undefined, // Campo opcional
        created_by_admin: false,
      });

      logger.info('Usuario creado exitosamente desde evento Kafka', {
        action: 'kafka_user_created_success',
        data: {
          userId: newUser.id,
          originalUserId: payload.userId,
          idWasRegenerated: payload.userId !== finalUserId,
          email: newUser.email,
          messageId: envelope.messageId
        }
      });

    } catch (error) {
      logger.error('Error procesando evento de usuario creado', {
        action: 'kafka_process_user_created_error',
        data: {
          error: error instanceof Error ? error.message : 'Error desconocido',
          messageId: envelope.messageId
        }
      });
      // Re-lanzar el error para que el consumer pueda manejarlo
      throw error;
    }
  }

  /**
   * Procesa un mensaje de Kafka
   */
  private async processMessage(message: any): Promise<void> {
    try {
      const value = message.value?.toString();
      if (!value) {
        logger.warn('Mensaje sin valor, ignorando', {
          action: 'kafka_message_empty',
        });
        return;
      }

      // Parsear el envelope del evento
      const envelope: KafkaEventEnvelope = JSON.parse(value);

      logger.info('Mensaje recibido de Kafka', {
        action: 'kafka_message_received',
        data: {
          eventType: envelope.eventType,
          messageId: envelope.messageId,
          producer: envelope.producer
        }
      });

      // Procesar según el tipo de evento
      switch (envelope.eventType) {
        case 'users.user.created':
          await this.handleUserCreatedEvent(envelope);
          break;
        default:
          logger.warn('Tipo de evento no manejado', {
            action: 'kafka_unhandled_event_type',
            data: {
              eventType: envelope.eventType,
              messageId: envelope.messageId
            }
          });
      }

    } catch (error) {
      logger.error('Error procesando mensaje de Kafka', {
        action: 'kafka_process_message_error',
        data: {
          error: error instanceof Error ? error.message : 'Error desconocido'
        }
      });
      // Re-lanzar para que el consumer pueda hacer retry si es necesario
      throw error;
    }
  }

  /**
   * Inicia el consumer y escucha eventos
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      logger.warn('Consumer ya está ejecutándose', {
        action: 'kafka_consumer_already_running',
      });
      return;
    }

    try {
      await this.connect();

      if (!this.consumer) {
        throw new Error('Consumer no inicializado');
      }

      // Suscribirse al topic de usuarios
      await this.consumer.subscribe({
        topic: KAFKA_TOPICS.USERS_EVENTS,
        fromBeginning: false, // Solo leer mensajes nuevos
      });

      // También escuchar en core.ingress si hay eventos allí
      await this.consumer.subscribe({
        topic: KAFKA_TOPICS.CORE_INGRESS,
        fromBeginning: false,
      });

      this.isRunning = true;

      logger.info('Kafka consumer iniciado y escuchando eventos', {
        action: 'kafka_consumer_started',
        data: {
          topics: [KAFKA_TOPICS.USERS_EVENTS, KAFKA_TOPICS.CORE_INGRESS]
        }
      });

      // Procesar mensajes
      await this.consumer.run({
        eachMessage: async ({ topic, partition, message }) => {
          try {
            this.isProcessing = true;
            await this.processMessage(message);
          } catch (error) {
            logger.error('Error en eachMessage handler', {
              action: 'kafka_each_message_error',
              data: {
                topic,
                partition,
                error: error instanceof Error ? error.message : 'Error desconocido'
              }
            });
            // No re-lanzamos para que el consumer continúe procesando otros mensajes
          } finally {
            this.isProcessing = false;
          }
        },
      });

    } catch (error) {
      this.isRunning = false;
      logger.error('Error iniciando Kafka consumer', {
        action: 'kafka_consumer_start_error',
        data: {
          error: error instanceof Error ? error.message : 'Error desconocido'
        }
      });
      throw error;
    }
  }

  /**
   * Detiene el consumer
   */
  async stop(): Promise<void> {
    if (!this.isRunning) {
      return;
    }

    try {
      await this.disconnect();
      this.isRunning = false;

      logger.info('Kafka consumer detenido', {
        action: 'kafka_consumer_stopped',
      });
    } catch (error) {
      logger.error('Error deteniendo Kafka consumer', {
        action: 'kafka_consumer_stop_error',
        data: {
          error: error instanceof Error ? error.message : 'Error desconocido'
        }
      });
    }
  }

  /**
   * Obtiene el estado del consumer
   */
  getStatus(): { isRunning: boolean; isProcessing: boolean } {
    return {
      isRunning: this.isRunning,
      isProcessing: this.isProcessing,
    };
  }
}

// Instancia singleton
let consumerInstance: KafkaConsumerService | null = null;

export function getKafkaConsumer(): KafkaConsumerService {
  if (!consumerInstance) {
    consumerInstance = new KafkaConsumerService();
  }
  return consumerInstance;
}

export { KafkaConsumerService };

