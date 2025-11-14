/**
 * @openapi
 * /api/auth/forgot:
 *   post:
 *     tags: [auth]
 *     summary: Request password recovery code
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: Recovery code sent (if email exists)
 *       400:
 *         description: Invalid email format
 *       429:
 *         description: Rate limit exceeded
 *       500:
 *         description: Internal server error
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { sendVerificationCode } from '@/lib/email-service';
import { storeVerificationCode } from '@/lib/email-verification';
import { logger } from '@/lib/logger';
import { rateLimiter } from '@/lib/rate-limiter';
import { z } from 'zod';
import { validateData } from '@/lib/validations';

const forgotPasswordSchema = z.object({
  email: z
    .string()
    .email('Debe ser un email válido')
    .min(1, 'El email es requerido'),
});

// Manejar peticiones OPTIONS (preflight CORS)
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    },
  });
}

export async function POST(request: NextRequest) {
  try {
    const clientIP = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    
    // Rate limiting
    const rateLimitResult = await rateLimiter.checkLimit(clientIP, 'forgot_password');
    if (!rateLimitResult.allowed) {
      return NextResponse.json({
        success: false,
        message: 'Demasiadas solicitudes. Intenta nuevamente en unos minutos.'
      }, { status: 429 });
    }

    const body = await request.json();
    
    // Validar datos de entrada
    const validation = validateData(forgotPasswordSchema, body);
    if (!validation.success) {
      return NextResponse.json({
        success: false,
        message: 'Datos de entrada inválidos',
        error: validation.error
      }, { status: 400 });
    }

    const { email } = validation.data;

    // Buscar el usuario por email - NO enviar email si no existe en la base de datos
    const user = await prisma.usuarios.findFirst({ email: email });

    // Solo procesar si el usuario existe en la base de datos
    if (!user) {
      // Log del intento sin revelar que el email no existe (seguridad)
      logger.info('Intento de recupero de contraseña para email no registrado', {
        action: 'forgot_password_email_not_found',
        data: { email: email.substring(0, 3) + '***', timestamp: new Date().toISOString() }
      });
      
      // Siempre devolver éxito para no revelar si el email existe (seguridad)
      return NextResponse.json({
        success: true,
        message: 'Si el email existe en nuestro sistema, recibirás un código de verificación en unos minutos.'
      }, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        }
      });
    }

    // El usuario existe, proceder con el envío del código
    try {
      // Generar y almacenar código de verificación en la base de datos
      const code = await storeVerificationCode(email);
      
      if (!code) {
        logger.error('Error al generar código de verificación', {
          action: 'forgot_password_code_generation_failed',
          data: { email }
        });
        
        return NextResponse.json({
          success: false,
          message: 'Error al generar el código de verificación. Intenta nuevamente.'
        }, { status: 500 });
      }

      // Enviar email con código solo si el usuario existe y el código se generó correctamente
      const emailSent = await sendVerificationCode(email, code);
      
      if (emailSent) {
        logger.info('Email de recupero enviado exitosamente', {
          action: 'password_recovery_email_sent',
          data: { email, timestamp: new Date().toISOString() }
        });
      } else {
        logger.error('Error al enviar email de recupero', {
          action: 'password_recovery_email_send_failed',
          data: { email }
        });
      }
    } catch (error) {
      logger.error('Error en proceso de recupero de contraseña', {
        action: 'password_recovery_error',
        data: { 
          email, 
          error: error instanceof Error ? error.message : 'Error desconocido',
          stack: error instanceof Error ? error.stack : undefined
        }
      });
    }

    // Siempre devolver éxito para no revelar si el email existe
    return NextResponse.json({
      success: true,
      message: 'Si el email existe en nuestro sistema, recibirás un código de verificación en unos minutos.'
    }, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      }
    });

  } catch (error) {
    logger.error('Error en solicitud de recupero de contraseña', {
      action: 'forgot_password_error',
      data: { 
        error: error instanceof Error ? error.message : 'Error desconocido',
        stack: error instanceof Error ? error.stack : undefined
      }
    });

    return NextResponse.json({
      success: false,
      message: 'Error interno del servidor'
    }, { status: 500 });
  }
}

