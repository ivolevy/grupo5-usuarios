import { Producer } from 'kafkajs';
import { kafka, KAFKA_TOPICS } from './kafka-config';
import { createKafkaUserMessage, KafkaUserMessage, validateUserCreatedEvent } from './kafka-schemas';
import { logger } from './logger';

class KafkaProducerService {
  private producer: Producer | null = null;
  private isConnected = false;

  /**
   * Conecta el producer a Kafka
   */
  async connect(): Promise<void> {
    try {
      if (this.isConnected && this.producer) {
        return;
      }

      this.producer = kafka.producer({
        maxInFlightRequests: 1,
        idempotent: true,
        transactionTimeout: 30000,
      });

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
   * Desconecta el producer de Kafka
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

  /**
   * Envía un evento de usuario creado a Kafka
   */
  async sendUserCreatedEvent(userData: {
    id: string;
    nacionalidad: string;
    rol: string;
    created_at: string;
  }): Promise<void> {
    try {
      if (!this.producer || !this.isConnected) {
        await this.connect();
      }

      // Validar y crear el mensaje
      const message = createKafkaUserMessage(userData);
      
      // Validar el payload antes de enviar
      validateUserCreatedEvent(message.payload);

      const key = `user-${userData.id}`;
      const value = JSON.stringify(message);

      logger.info('Enviando evento de usuario creado a Kafka', {
        action: 'kafka_send_user_created',
      });

      if (!this.producer) {
        throw new Error('Producer no está inicializado');
      }

      const result = await this.producer.send({
        topic: KAFKA_TOPICS.USERS_EVENTS,
        messages: [
          {
            key,
            value,
            partition: 0, // Usar partición 0 para mantener orden
          },
        ],
      });

      logger.info('Evento de usuario creado enviado exitosamente', {
        action: 'kafka_user_created_sent',
      });

    } catch (error) {
      logger.error('Error enviando evento de usuario creado a Kafka', {
        action: 'kafka_send_user_created_error',
      });
      throw new Error('Error enviando evento a Kafka');
    }
  }

  /**
   * Envía un mensaje personalizado a cualquier topic
   */
  async sendMessage(
    topic: string,
    key: string,
    message: any
  ): Promise<void> {
    try {
      if (!this.producer || !this.isConnected) {
        await this.connect();
      }

      const value = typeof message === 'string' ? message : JSON.stringify(message);

      logger.info('Enviando mensaje a Kafka', {
        action: 'kafka_send_message',
      });

      if (!this.producer) {
        throw new Error('Producer no está inicializado');
      }

      const result = await this.producer.send({
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
   * Verifica si el producer está conectado
   */
  isProducerConnected(): boolean {
    return this.isConnected && this.producer !== null;
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
