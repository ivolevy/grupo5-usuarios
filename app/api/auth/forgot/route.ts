import { NextRequest, NextResponse } from 'next/server';
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
 *         description: Verification code sent
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Código de verificación enviado al email"
 *                 data:
 *                   type: object
 *                   properties:
 *                     email:
 *                       type: string
 *                       format: email
 *                     expiresIn:
 *                       type: number
 *                       description: "Tiempo de expiración en minutos"
 *                       example: 15
 *       400:
 *         description: Invalid request
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Email inválido o usuario no encontrado"
 *       429:
 *         description: Rate limit exceeded
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Demasiados intentos. Intenta más tarde"
 *       500:
 *         description: Internal server error
 */
import { storeVerificationCode } from '@/lib/email-verification';
import { sendVerificationCode, isValidEmail } from '@/lib/email-service';
import { logger } from '@/lib/logger';
import { rateLimiter } from '@/lib/rate-limiter';

export async function POST(request: NextRequest) {
  try {
    // Logging de la petición entrante
    const clientIP = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    logger.info('Petición de recupero de contraseña recibida', {
      action: 'forgot_password_request',
      ip: clientIP,
      data: { timestamp: new Date().toISOString() }
    });

    // Rate limiting
    const rateLimitResult = await rateLimiter.checkLimit(clientIP, 'forgot_password');
    if (!rateLimitResult.allowed) {
      logger.warn('Rate limit excedido para recupero de contraseña', {
        action: 'rate_limit_exceeded',
        ip: clientIP,
        data: { 
          attempts: rateLimitResult.attempts,
          resetTime: rateLimitResult.resetTime
        }
      });
      
      return NextResponse.json(
        { 
          success: false, 
          message: 'Demasiadas solicitudes. Intenta nuevamente en unos minutos.',
          retryAfter: rateLimitResult.resetTime
        },
        { 
          status: 429,
          headers: {
            'Retry-After': rateLimitResult.resetTime.toString()
          }
        }
      );
    }

    // Parsear el cuerpo de la petición
    let body;
    try {
      body = await request.json();
    } catch (error) {
      logger.warn('Error al parsear JSON en petición de recupero', {
        action: 'parse_json_error',
        ip: clientIP,
        data: { error: error instanceof Error ? error.message : 'Invalid JSON' }
      });
      
      return NextResponse.json(
        { success: false, message: 'Formato de petición inválido' },
        { status: 400 }
      );
    }

    const { email } = body;

    // Validar que se proporcionó el email
    if (!email) {
      logger.warn('Petición de recupero sin email', {
        action: 'forgot_password_no_email',
        ip: clientIP
      });
      
      return NextResponse.json(
        { success: false, message: 'Email es requerido' },
        { status: 400 }
      );
    }

    // Validar formato del email
    if (!isValidEmail(email)) {
      logger.warn('Email inválido en petición de recupero', {
        action: 'forgot_password_invalid_email',
        ip: clientIP,
        data: { email }
      });
      
      return NextResponse.json(
        { success: false, message: 'Formato de email inválido' },
        { status: 400 }
      );
    }

    logger.info(`Procesando solicitud de recupero para: ${email}`, {
      action: 'forgot_password_process',
      ip: clientIP,
      data: { email }
    });

    // Generar y almacenar código de verificación
    const code = await storeVerificationCode(email);
    
    // Si no se pudo generar el código (email no existe), retornar mensaje específico
    if (!code) {
      logger.info(`Solicitud de recupero para email no registrado: ${email}`, {
        action: 'forgot_password_email_not_found',
        ip: clientIP,
        data: { email }
      });

      return NextResponse.json({
        success: false,
        message: 'El email no está registrado en nuestro sistema.',
        data: {
          email,
          emailExists: false
        }
      });
    }
    
    // Enviar email con el código
    const emailSent = await sendVerificationCode(email, code);

    if (emailSent) {
      logger.info(`Recupero de contraseña procesado exitosamente para: ${email}`, {
        action: 'forgot_password_success',
        ip: clientIP,
        data: { email }
      });

      return NextResponse.json({
        success: true,
        message: 'Código de verificación enviado a tu email.',
        data: {
          email,
          emailExists: true,
          codeExpiresIn: 5 // minutos
        }
      });
    } else {
      logger.error(`Error al enviar email de recupero para: ${email}`, {
        action: 'forgot_password_email_error',
        ip: clientIP,
        data: { email }
      });

      return NextResponse.json(
        { success: false, message: 'Error al enviar el email de verificación. Intenta nuevamente.' },
        { status: 500 }
      );
    }

  } catch (error) {
    const clientIP = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    
    logger.error('Error interno en recupero de contraseña', {
      action: 'forgot_password_internal_error',
      ip: clientIP,
      data: { 
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      }
    });

    return NextResponse.json(
      { success: false, message: 'Error interno del servidor. Intenta nuevamente más tarde.' },
      { status: 500 }
    );
  }
}

// Manejar otros métodos HTTP
export async function GET() {
  return NextResponse.json(
    { success: false, message: 'Método no permitido' },
    { status: 405 }
  );
}
