import { NextRequest, NextResponse } from 'next/server';
import { getServices } from '@/lib/database-config';
import { hashPassword, validatePasswordStrength } from '@/lib/auth';
import { emailServiceResend } from '@/lib/email-service-resend';
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

    // Obtener servicios (LDAP o Supabase según configuración)
    const { userRepository, authService } = await getServices();

    // Para LDAP, simplificamos el proceso de reset de contraseña
    // En un sistema de producción, deberías implementar un sistema de tokens de reset
    // Por ahora, asumimos que el token es el email del usuario
    // TODO: Implementar sistema de tokens de reset para LDAP
    
    // Buscar usuario por email (usando token como email por ahora)
    const user = await userRepository.findByEmail(token);

    if (!user) {
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

    // Hashear nueva contraseña y actualizar
    const hashedPassword = await hashPassword(password);
    const userData = user.toPlainObject();
    
    const updatedUser = await userRepository.update(userData.id, {
      password: hashedPassword,
      updated_at: new Date().toISOString()
    });

    if (!updatedUser) {
      return NextResponse.json({
        success: false,
        message: 'Error al actualizar la contraseña'
      }, { status: 500 });
    }

    // Enviar email de confirmación
    try {
      console.log(`📧 [PASSWORD RESET] Enviando confirmación a ${userData.email}...`);
      await emailServiceResend.enviarConfirmacionRecupero(userData.email);
      console.log(`✅ [PASSWORD RESET] Email de confirmación enviado exitosamente a ${userData.email}`);
    } catch (emailError) {
      console.error(`❌ [PASSWORD RESET] Error enviando confirmación a ${userData.email}:`, emailError);
      // No fallar el proceso si el email no se puede enviar
      logger.error('Error sending password reset confirmation email', {
        action: 'email_confirmation_error',
        ip: clientIp,
        userId: userData.id,
        data: {
          email: userData.email,
          error: emailError instanceof Error ? emailError.message : 'Unknown error'
        }
      });
    }

    logger.userAction('password_reset_completed', userData.id, clientIp, {
      data: {
        email: userData.email,
        passwordChanged: true
      }
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
