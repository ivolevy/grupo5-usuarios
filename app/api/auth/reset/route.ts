import { NextRequest, NextResponse } from 'next/server';
/**
 * @openapi
 * /api/auth/reset:
 *   post:
 *     tags: [auth]
 *     summary: Reset password using token
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [token, password]
 *             properties:
 *               token:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password updated successfully
 *       400:
 *         description: Invalid token or weak password
 *       429:
 *         description: Rate limit exceeded
 *       500:
 *         description: Internal server error
 */
import { prisma } from '@/lib/db';
import { hashPassword, validatePasswordStrength } from '@/lib/auth';
import { logger } from '@/lib/logger';
import { rateLimiter } from '@/lib/rate-limiter';

export async function POST(request: NextRequest) {
  try {
    // Logging de la petición entrante
    const clientIP = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    logger.info('Petición de reset de contraseña recibida', {
      action: 'reset_password_request',
      ip: clientIP,
      data: { timestamp: new Date().toISOString() }
    });

    // Rate limiting
    const rateLimitResult = await rateLimiter.checkLimit(clientIP, 'reset_password');
    if (!rateLimitResult.allowed) {
      logger.warn('Rate limit excedido para reset de contraseña', {
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
      logger.warn('Error al parsear JSON en petición de reset', {
        action: 'parse_json_error',
        ip: clientIP,
        data: { error: error instanceof Error ? error.message : 'Invalid JSON' }
      });
      
      return NextResponse.json(
        { success: false, message: 'Formato de petición inválido' },
        { status: 400 }
      );
    }

    const { token, password } = body;

    // Validar que se proporcionaron los datos requeridos
    if (!token || !password) {
      logger.warn('Petición de reset con datos faltantes', {
        action: 'reset_password_missing_data',
        ip: clientIP,
        data: { hasToken: !!token, hasPassword: !!password }
      });
      
      return NextResponse.json(
        { success: false, message: 'Token y nueva contraseña son requeridos' },
        { status: 400 }
      );
    }

    logger.info(`Procesando reset de contraseña con token`, {
      action: 'reset_password_process',
      ip: clientIP,
      data: { tokenLength: token.length }
    });

    // Buscar usuario por token de reset
    const users = await prisma.usuarios.findMany({
      where: { password_reset_token: token }
    });
    const user = users.length > 0 ? users[0] : null;

    if (!user) {
      logger.warn('Token de reset inválido', {
        action: 'reset_password_invalid_token',
        ip: clientIP,
        data: { tokenLength: token.length }
      });
      
      return NextResponse.json(
        { success: false, message: 'Token inválido o expirado' },
        { status: 400 }
      );
    }

    // Verificar que el token no haya expirado
    if (!user.password_reset_expires) {
      logger.warn('Token de reset sin fecha de expiración', {
        action: 'reset_password_no_expiry',
        ip: clientIP,
        data: { userId: user.id, email: user.email }
      });
      
      return NextResponse.json(
        { success: false, message: 'Token inválido o expirado' },
        { status: 400 }
      );
    }

    const now = new Date();
    const expiresAt = new Date(user.password_reset_expires);
    
    if (now > expiresAt) {
      // Limpiar token expirado
      await prisma.usuarios.update({ id: user.id }, {
        password_reset_token: undefined,
        password_reset_expires: undefined
      });

      logger.warn('Token de reset expirado', {
        action: 'reset_password_expired_token',
        ip: clientIP,
        data: { 
          userId: user.id, 
          email: user.email,
          expiresAt: user.password_reset_expires,
          now: now.toISOString()
        }
      });

      return NextResponse.json(
        { success: false, message: 'Token inválido o expirado' },
        { status: 400 }
      );
    }

    // Validar fortaleza de la nueva contraseña
    const passwordValidation = validatePasswordStrength(password);
    if (!passwordValidation.isValid) {
      logger.warn('Nueva contraseña no cumple requisitos de seguridad', {
        action: 'reset_password_weak_password',
        ip: clientIP,
        data: { 
          userId: user.id, 
          email: user.email,
          score: passwordValidation.score,
          feedback: passwordValidation.feedback
        }
      });
      
      return NextResponse.json({
        success: false,
        message: 'La nueva contraseña no cumple con los requisitos de seguridad',
        error: passwordValidation.feedback.join(', '),
        passwordStrength: {
          score: passwordValidation.score,
          maxScore: 5,
          feedback: passwordValidation.feedback
        }
      }, { status: 400 });
    }

    // Hashear nueva contraseña
    const hashedPassword = await hashPassword(password);

    // Actualizar contraseña y limpiar token de reset
    await prisma.usuarios.update({ id: user.id }, {
      password: hashedPassword,
      password_reset_token: undefined,
      password_reset_expires: undefined,
      updated_at: new Date().toISOString()
    });

    logger.info(`Contraseña actualizada exitosamente para: ${user.email}`, {
      action: 'reset_password_success',
      ip: clientIP,
      data: { userId: user.id, email: user.email }
    });

    return NextResponse.json({
      success: true,
      message: 'Contraseña actualizada exitosamente'
    });

  } catch (error) {
    const clientIP = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    
    logger.error('Error interno en reset de contraseña', {
      action: 'reset_password_internal_error',
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
