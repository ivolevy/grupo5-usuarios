/**
 * Inicialización automática del Kafka Consumer
 * Este módulo se importa para iniciar el consumer automáticamente al arrancar el servidor
 */

import './server-only'; // Forzar que solo se ejecute en el servidor

import { getKafkaConsumer } from './kafka-consumer';
import { logger } from './logger';

let isInitialized = false;
let initPromise: Promise<void> | null = null;
let initAttempted = false;

/**
 * Inicializa el consumer de Kafka si está habilitado
 * Solo se ejecuta una vez (singleton pattern)
 */
export async function initializeKafkaConsumer(): Promise<void> {
  // Si ya está inicializado, retornar
  if (isInitialized) {
    return;
  }

  // Si ya hay una inicialización en curso, esperar a que termine
  if (initPromise) {
    return initPromise;
  }

  // Verificar si el consumer está habilitado
  const enabled = process.env.KAFKA_CONSUMER_ENABLED !== 'false';
  
  if (!enabled) {
    logger.info('Kafka consumer está deshabilitado (KAFKA_CONSUMER_ENABLED=false)', {
      action: 'kafka_consumer_disabled',
    });
    isInitialized = true;
    return;
  }

  // Iniciar el consumer en background
  initPromise = (async () => {
    try {
      const consumer = getKafkaConsumer();
      
      logger.info('Iniciando Kafka consumer automáticamente...', {
        action: 'kafka_consumer_auto_init',
      });

      // Iniciar el consumer (esto puede tomar tiempo)
      await consumer.start();

      isInitialized = true;

      logger.info('Kafka consumer iniciado exitosamente', {
        action: 'kafka_consumer_auto_init_success',
      });

    } catch (error) {
      logger.error('Error en inicialización automática del consumer', {
        action: 'kafka_consumer_auto_init_fatal_error',
        data: {
          error: error instanceof Error ? error.message : 'Error desconocido',
          stack: error instanceof Error ? error.stack : undefined
        }
      });
      isInitialized = true; // Marcar como inicializado para no reintentar
    }
  })();

  return initPromise;
}

// Inicializar automáticamente cuando se importa el módulo
// Solo en el servidor (no en el cliente)
if (typeof window === 'undefined' && !initAttempted) {
  initAttempted = true;
  
  // Usar setImmediate para no bloquear el arranque del servidor
  setImmediate(() => {
    initializeKafkaConsumer().catch((error) => {
      logger.error('Error fatal al inicializar consumer automáticamente', {
        action: 'kafka_consumer_auto_init_fatal',
        data: {
          error: error instanceof Error ? error.message : 'Error desconocido',
          stack: error instanceof Error ? error.stack : undefined
        }
      });
    });
  });
}
