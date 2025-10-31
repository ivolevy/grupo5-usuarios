import { createKafkaUserMessage, KafkaUserMessage, validateUserCreatedEvent } from './kafka-schemas';
import { sendUserCreatedEvent as sendUserCreatedEventAPI } from './kafka-api-sender';
import { logger } from './logger';
import { Kafka } from 'kafkajs';

class KafkaProducerService {
  private kafka: Kafka;
  private producer: any = null;
  private isConnected = false;

  constructor() {
    // Silenciar warnings de KafkaJS
    process.env.KAFKAJS_NO_PARTITIONER_WARNING = '1';
    
    // Configurar Kafka directo
    this.kafka = new Kafka({
      clientId: 'grupo5-usuarios-app',
      brokers: ['34.172.179.60:9094'],
      // No SSL/SASL - usando PLAINTEXT
    });
  }

  /**
   * Conecta el producer a Kafka
   */
  async connect(): Promise<void> {
    try {
      if (this.isConnected && this.producer) {
        return;
      }

      this.producer = this.kafka.producer();

      await this.producer.connect();
      this.isConnected = true;

      logger.info('Kafka producer conectado exitosamente', {
        action: 'kafka_producer_connected',
      });
    } catch (error) {
      logger.error('Error conectando Kafka producer', {
        action: 'kafka_producer_connection_error',
      });
      throw new Error('Error conectando a Kafka');
    }
  }

  /**
   * Envía un evento de usuario creado usando la API REST de Kafka
   */
  async sendUserCreatedEvent(userData: {
    id: string;
    nacionalidad: string;
    rol: string;
    created_at: string;
  }): Promise<void> {
    try {
      // Usar la nueva API REST de Kafka
      const success = await sendUserCreatedEventAPI({
        userId: userData.id,
        nationalityOrOrigin: userData.nacionalidad,
        roles: [userData.rol],
        createdAt: userData.created_at,
      });

      if (success) {
        logger.info('Evento de usuario creado enviado exitosamente a Kafka via API REST', {
          action: 'kafka_user_created_sent_api',
          userId: userData.id
        });
      } else {
        logger.warn('Evento de usuario creado no pudo ser enviado a Kafka via API REST', {
          action: 'kafka_user_created_failed_api',
          userId: userData.id
        });
        throw new Error('Error enviando evento a Kafka via API REST');
      }

    } catch (error) {
      logger.error('Error enviando evento de usuario creado a Kafka via API REST', {
        action: 'kafka_send_user_created_error_api',
        userId: userData.id,
        message: error instanceof Error ? error.message : 'Error desconocido'
      });
      throw new Error('Error enviando evento a Kafka via API REST');
    }
  }

  /**
   * Envía un mensaje personalizado a cualquier topic directamente a Kafka
   */
  async sendMessage(
    topic: string,
    key: string,
    message: any
  ): Promise<void> {
    try {
      const value = typeof message === 'string' ? message : JSON.stringify(message);

      // Conectar si no está conectado
      if (!this.producer || !this.isConnected) {
        await this.connect();
      }

      if (!this.producer) {
        throw new Error('Producer no está inicializado');
      }

      logger.info('Enviando mensaje a Kafka', {
        action: 'kafka_send_message',
      });

      // Enviar directamente a Kafka
      await this.producer.send({
        topic,
        messages: [
          {
            key,
            value,
          },
        ],
      });

      logger.info('Mensaje enviado exitosamente a Kafka', {
        action: 'kafka_message_sent',
      });

    } catch (error) {
      logger.error('Error enviando mensaje a Kafka', {
        action: 'kafka_send_message_error',
      });
      throw new Error('Error enviando mensaje a Kafka');
    }
  }

  /**
   * Verifica si el servicio está configurado correctamente
   */
  isConfigured(): boolean {
    return !!(this.kafka && this.kafka);
  }

  /**
   * Verifica si Kafka está conectado
   */
  isKafkaConnected(): boolean {
    return this.isConnected && this.producer !== null;
  }

  /**
   * Desconecta el producer
   */
  async disconnect(): Promise<void> {
    try {
      if (this.producer && this.isConnected) {
        await this.producer.disconnect();
        this.isConnected = false;
        this.producer = null;

        logger.info('Kafka producer desconectado', {
          action: 'kafka_producer_disconnected',
        });
      }
    } catch (error) {
      logger.error('Error desconectando Kafka producer', {
        action: 'kafka_producer_disconnection_error',
      });
    }
  }
}

// Instancia singleton del producer
export const kafkaProducer = new KafkaProducerService();

// Función de conveniencia para enviar evento de usuario creado
export async function sendUserCreatedEvent(userData: {
  id: string;
  nacionalidad: string;
  rol: string;
  created_at: string;
}): Promise<void> {
  return kafkaProducer.sendUserCreatedEvent(userData);
}

// Función de conveniencia que usa directamente la API REST (recomendada)
export async function sendUserCreatedEventDirect(userData: {
  userId: string;
  nationalityOrOrigin: string;
  roles: string[];
  createdAt: string;
}): Promise<boolean> {
  return sendUserCreatedEventAPI(userData);
}
