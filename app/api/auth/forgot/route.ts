import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { emailService } from '@/lib/email-service';
import { validateData, forgotPasswordSchema } from '@/lib/validations';
import { logger } from '@/lib/logger';
import { getClientIp } from '@/lib/rate-limiter';

// Función para generar código de 6 dígitos
function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Función para generar token de reset
function generateResetToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 32; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// POST /api/auth/forgot - Solicitar recupero de contraseña
export async function POST(request: NextRequest) {
  try {
    const clientIp = getClientIp(request);
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
    // Pero solo procesar si el usuario existe
    if (user) {
      // Generar código de verificación
      const verificationCode = generateVerificationCode();
      const resetToken = generateResetToken();
      
      // Calcular expiración (15 minutos)
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

      // Actualizar usuario con token de reset
      await prisma.usuarios.update(
        { id: user.id },
        {
          password_reset_token: resetToken,
          password_reset_expires: expiresAt
        }
      );

      // Enviar email con código
      try {
        await emailService.enviarCodigoRecupero(email, verificationCode);
        
        logger.userAction('password_reset_requested', user.id, clientIp, {
          email,
          verificationCode, // Solo para logs, no se almacena en BD
          resetToken
        });
      } catch (emailError) {
        logger.error('Error sending password reset email', {
          action: 'email_send_error',
          ip: clientIp,
          userId: user.id,
          email,
          error: emailError instanceof Error ? emailError.message : 'Unknown error'
        });
        
        // Aún así devolver éxito para no revelar el error
      }
    }

    // Siempre devolver el mismo mensaje de éxito
    return NextResponse.json({
      success: true,
      message: 'Si el email existe en nuestro sistema, recibirás un código de verificación en unos minutos.'
    });

  } catch (error) {
    const clientIp = getClientIp(request);
    logger.error('Error in forgot password', {
      action: 'forgot_password_error',
      ip: clientIp,
      message: error instanceof Error ? error.message : 'Unknown error'
    });

    return NextResponse.json({
      success: false,
      message: 'Error interno del servidor'
    }, { status: 500 });
  }
}
