#!/usr/bin/env node
/**
 * Script para ejecutar el consumer de Kafka en Render
 * Este script está optimizado para ejecutarse como servicio independiente
 */

import { getKafkaConsumer } from '../lib/kafka-consumer';
import { logger } from '../lib/logger';

// Función para manejar señales de cierre
async function gracefulShutdown(signal: string) {
  logger.info(`Recibida señal ${signal}, cerrando consumer...`, {
    action: 'consumer_shutdown',
    data: { signal }
  });

  try {
    const consumer = getKafkaConsumer();
    await consumer.stop();
    logger.info('Consumer detenido correctamente', {
      action: 'consumer_shutdown_success'
    });
    process.exit(0);
  } catch (error) {
    logger.error('Error deteniendo consumer', {
      action: 'consumer_shutdown_error',
      data: {
        error: error instanceof Error ? error.message : 'Error desconocido'
      }
    });
    process.exit(1);
  }
}

// Manejar señales de terminación
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

// Manejar errores no capturados
process.on('uncaughtException', (error) => {
  logger.error('Excepción no capturada', {
    action: 'uncaught_exception',
    data: {
      error: error.message,
      stack: error.stack
    }
  });
  gracefulShutdown('uncaughtException');
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Promesa rechazada sin manejar', {
    action: 'unhandled_rejection',
    data: {
      reason: reason instanceof Error ? reason.message : String(reason)
    }
  });
});

// Función principal
async function main() {
  logger.info('🚀 Iniciando Kafka Consumer en Render...', {
    action: 'consumer_render_start',
    data: {
      nodeVersion: process.version,
      platform: process.platform,
      env: process.env.NODE_ENV || 'production'
    }
  });

  try {
    const consumer = getKafkaConsumer();

    // Verificar estado antes de iniciar
    const status = consumer.getStatus();
    if (status.isRunning) {
      logger.warn('Consumer ya está corriendo', {
        action: 'consumer_already_running'
      });
      return;
    }

    // Iniciar el consumer
    logger.info('Iniciando consumer...', {
      action: 'consumer_starting'
    });

    await consumer.start();

    logger.info('✅ Kafka Consumer iniciado exitosamente en Render', {
      action: 'consumer_render_started',
      data: {
        status: consumer.getStatus()
      }
    });

    // Mantener el proceso vivo
    // El consumer se ejecutará en background y este proceso no terminará
    // Render mantendrá el proceso corriendo porque es un servicio de larga duración

  } catch (error) {
    logger.error('❌ Error fatal iniciando consumer en Render', {
      action: 'consumer_render_fatal_error',
      data: {
        error: error instanceof Error ? error.message : 'Error desconocido',
        stack: error instanceof Error ? error.stack : undefined
      }
    });
    process.exit(1);
  }
}

// Ejecutar
main().catch((error) => {
  logger.error('Error fatal en script de consumer', {
    action: 'consumer_script_fatal',
    data: {
      error: error instanceof Error ? error.message : 'Error desconocido',
      stack: error instanceof Error ? error.stack : undefined
    }
  });
  process.exit(1);
});

