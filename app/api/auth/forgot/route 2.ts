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
import { sendEmail } from '@/lib/email-service';
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

    // Buscar el usuario por email
    const user = await prisma.usuarios.findFirst({ email });

    // Siempre devolver éxito para no revelar si el email existe
    if (user) {
      try {
        // Generar código de 6 dígitos
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        
        // Guardar código en base de datos (implementar según necesidad)
        // Por ahora, solo logueamos el código
        logger.info('Código de recupero generado', {
          action: 'password_recovery_code_generated',
          email: email,
          code: code,
          timestamp: new Date().toISOString()
        });

        // Enviar email con código
        await sendEmail(email, code);
        
        logger.info('Email de recupero enviado', {
          action: 'password_recovery_email_sent',
          email: email,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        logger.error('Error enviando email de recupero', {
          action: 'password_recovery_email_error',
          email: email,
          error: error instanceof Error ? error.message : 'Error desconocido'
        });
      }
    }

    // Siempre devolver éxito para no revelar si el email existe
    return NextResponse.json({
      success: true,
      message: 'Si el email existe en nuestro sistema, recibirás un código de verificación en unos minutos.'
    });

  } catch (error) {
    logger.error('Error en solicitud de recupero de contraseña', {
      action: 'forgot_password_error',
      error: error instanceof Error ? error.message : 'Error desconocido'
    });

    return NextResponse.json({
      success: false,
      message: 'Error interno del servidor'
    }, { status: 500 });
  }
}
