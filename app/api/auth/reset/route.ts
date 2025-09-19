import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { hashPassword, validatePasswordStrength } from '@/lib/auth';
import { emailService } from '@/lib/email-service';
import { validateData, resetPasswordSchema } from '@/lib/validations';
import { logger } from '@/lib/logger';
import { getClientIp } from '@/lib/rate-limiter';

// POST /api/auth/reset - Resetear contraseña
export async function POST(request: NextRequest) {
  try {
    const clientIp = getClientIp(request);
    const body = await request.json();
    
    // Validar datos de entrada
    const validation = validateData(resetPasswordSchema, body);
    if (!validation.success) {
      return NextResponse.json({
        success: false,
        message: 'Datos de entrada inválidos',
        error: validation.error
      }, { status: 400 });
    }

    const { token, password } = validation.data;

    // Buscar usuario por token de reset
    const user = await prisma.usuarios.findFirst({ 
      where: { password_reset_token: token }
    });

    if (!user) {
      return NextResponse.json({
        success: false,
        message: 'Token inválido o expirado'
      }, { status: 400 });
    }

    // Verificar que el token no haya expirado
    if (!user.password_reset_expires) {
      return NextResponse.json({
        success: false,
        message: 'Token inválido o expirado'
      }, { status: 400 });
    }

    const now = new Date();
    const expiresAt = new Date(user.password_reset_expires);
    
    if (now > expiresAt) {
      // Limpiar token expirado
      await prisma.usuarios.update(
        { id: user.id },
        {
          password_reset_token: null,
          password_reset_expires: null
        }
      );

      return NextResponse.json({
        success: false,
        message: 'Token inválido o expirado'
      }, { status: 400 });
    }

    // Validar fortaleza de la nueva contraseña
    const passwordValidation = validatePasswordStrength(password);
    if (!passwordValidation.isValid) {
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
    const updatedUser = await prisma.usuarios.update(
      { id: user.id },
      {
        password: hashedPassword,
        password_reset_token: null,
        password_reset_expires: null,
        updated_at: new Date().toISOString()
      }
    );

    // Enviar email de confirmación
    try {
      await emailService.enviarConfirmacionRecupero(user.email);
    } catch (emailError) {
      // No fallar el proceso si el email no se puede enviar
      logger.error('Error sending password reset confirmation email', {
        action: 'email_confirmation_error',
        ip: clientIp,
        userId: user.id,
        email: user.email,
        error: emailError instanceof Error ? emailError.message : 'Unknown error'
      });
    }

    logger.userAction('password_reset_completed', user.id, clientIp, {
      email: user.email,
      passwordChanged: true
    });

    return NextResponse.json({
      success: true,
      message: 'Contraseña actualizada exitosamente'
    });

  } catch (error) {
    const clientIp = getClientIp(request);
    logger.error('Error resetting password', {
      action: 'reset_password_error',
      ip: clientIp,
      message: error instanceof Error ? error.message : 'Unknown error'
    });

    return NextResponse.json({
      success: false,
      message: 'Error interno del servidor'
    }, { status: 500 });
  }
}
