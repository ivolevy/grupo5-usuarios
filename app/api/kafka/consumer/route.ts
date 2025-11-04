import { NextRequest, NextResponse } from 'next/server';
import { getKafkaConsumer } from '@/lib/kafka-consumer';
import { logger } from '@/lib/logger';

/**
 * GET /api/kafka/consumer - Obtener estado del consumer
 */
export async function GET() {
  try {
    const consumer = getKafkaConsumer();
    const status = consumer.getStatus();

    return NextResponse.json({
      success: true,
      status,
      message: status.isRunning 
        ? 'Consumer está ejecutándose' 
        : 'Consumer está detenido'
    });
  } catch (error) {
    logger.error('Error obteniendo estado del consumer', {
      action: 'kafka_consumer_get_status_error',
      data: {
        error: error instanceof Error ? error.message : 'Error desconocido'
      }
    });

    return NextResponse.json({
      success: false,
      message: 'Error obteniendo estado del consumer',
      error: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
}

/**
 * POST /api/kafka/consumer - Iniciar el consumer
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const action = body.action || 'start';

    const consumer = getKafkaConsumer();

    if (action === 'start') {
      // Iniciar el consumer en background (no bloquear la respuesta)
      consumer.start().catch((error) => {
        logger.error('Error iniciando consumer en background', {
          action: 'kafka_consumer_start_background_error',
          data: {
            error: error instanceof Error ? error.message : 'Error desconocido'
          }
        });
      });

      return NextResponse.json({
        success: true,
        message: 'Consumer iniciado (procesando en background)',
        status: consumer.getStatus()
      });
    } else if (action === 'stop') {
      await consumer.stop();

      return NextResponse.json({
        success: true,
        message: 'Consumer detenido',
        status: consumer.getStatus()
      });
    } else {
      return NextResponse.json({
        success: false,
        message: 'Acción no válida. Use "start" o "stop"'
      }, { status: 400 });
    }

  } catch (error) {
    logger.error('Error en endpoint de consumer', {
      action: 'kafka_consumer_endpoint_error',
      data: {
        error: error instanceof Error ? error.message : 'Error desconocido'
      }
    });

    return NextResponse.json({
      success: false,
      message: 'Error procesando solicitud',
      error: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
}

