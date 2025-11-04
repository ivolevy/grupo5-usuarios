import { NextResponse } from 'next/server';
import { initializeKafkaConsumer } from '@/lib/kafka-consumer-init';
import { logger } from '@/lib/logger';

/**
 * POST /api/kafka/init - Forzar inicialización del consumer
 * Útil para debug o para asegurar que se inicie
 */
export async function POST() {
  try {
    logger.info('Inicializando consumer manualmente desde endpoint', {
      action: 'kafka_consumer_manual_init',
    });

    await initializeKafkaConsumer();

    return NextResponse.json({
      success: true,
      message: 'Consumer inicializado exitosamente'
    });
  } catch (error) {
    logger.error('Error inicializando consumer manualmente', {
      action: 'kafka_consumer_manual_init_error',
      data: {
        error: error instanceof Error ? error.message : 'Error desconocido'
      }
    });

    return NextResponse.json({
      success: false,
      message: 'Error inicializando consumer',
      error: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
}

