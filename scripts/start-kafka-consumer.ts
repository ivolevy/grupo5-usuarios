#!/usr/bin/env node
/**
 * Script para iniciar el consumer de Kafka como servicio independiente
 * 
 * Uso:
 *   npm run start:kafka-consumer
 *   o
 *   tsx scripts/start-kafka-consumer.ts
 */

import { getKafkaConsumer } from '../lib/kafka-consumer';
import { logger } from '../lib/logger';

async function main() {
  const consumer = getKafkaConsumer();

  logger.info('Iniciando Kafka consumer...', {
    action: 'kafka_consumer_script_start',
  });

  try {
    // Iniciar el consumer
    await consumer.start();

    logger.info('Kafka consumer iniciado exitosamente', {
      action: 'kafka_consumer_script_started',
    });

    // Mantener el proceso vivo
    // El consumer se ejecutará en background
    process.on('SIGINT', async () => {
      logger.info('Recibida señal SIGINT, deteniendo consumer...', {
        action: 'kafka_consumer_script_sigint',
      });
      await consumer.stop();
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      logger.info('Recibida señal SIGTERM, deteniendo consumer...', {
        action: 'kafka_consumer_script_sigterm',
      });
      await consumer.stop();
      process.exit(0);
    });

    // Mantener el proceso corriendo
    setInterval(() => {
      const status = consumer.getStatus();
      if (!status.isRunning) {
        logger.warn('Consumer se detuvo inesperadamente', {
          action: 'kafka_consumer_script_unexpected_stop',
        });
      }
    }, 30000); // Verificar cada 30 segundos

  } catch (error) {
    logger.error('Error iniciando Kafka consumer', {
      action: 'kafka_consumer_script_error',
      data: {
        error: error instanceof Error ? error.message : 'Error desconocido'
      }
    });
    process.exit(1);
  }
}

// Ejecutar
main().catch((error) => {
  logger.error('Error fatal en script de consumer', {
    action: 'kafka_consumer_script_fatal_error',
    data: {
      error: error instanceof Error ? error.message : 'Error desconocido'
    }
  });
  process.exit(1);
});

