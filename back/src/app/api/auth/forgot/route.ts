import { NextRequest, NextResponse } from 'next/server';
import { getServices } from '@/lib/database-config';
import { emailServiceResend } from '@/lib/email-service-resend';
import { initializeCodeStorageService } from '@/lib/code-storage';
import { validateData, forgotPasswordSchema } from '@/lib/validations';
import { logger } from '@/lib/logger';
import { getClientIp } from '@/lib/rate-limiter';

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

    // Obtener servicios (LDAP o Supabase según configuración)
    const { userRepository } = await getServices();

    // Buscar el usuario por email
    const user = await userRepository.findByEmail(email);

    // Siempre devolver éxito para no revelar si el email existe
    // Pero solo procesar si el usuario existe
    if (user) {
      try {
        // Inicializar y usar el servicio de códigos
        const codeStorageService = await initializeCodeStorageService();
        const { code, expiresAt } = await codeStorageService.createCode(email);

        console.log(`🔐 [PASSWORD RESET] Generando código para ${email}: ${code}`);
        console.log(`⏰ [PASSWORD RESET] Código expira en: ${expiresAt}`);

        // Enviar email con código usando Resend
        await emailServiceResend.enviarCodigoRecupero(email, code);
        
        console.log(`✅ [PASSWORD RESET] Email de recupero enviado exitosamente a ${email}`);
        
        const userData = user.toPlainObject();
        logger.userAction('password_reset_requested', userData.id, clientIp, {
          email,
          code: '***', // No logear el código real por seguridad
          expiresAt
        });
      } catch (emailError) {
        console.error(`❌ [PASSWORD RESET] Error enviando email a ${email}:`, emailError);
        
        const userData = user.toPlainObject();
        logger.error('Error sending password reset email', {
          action: 'email_send_error',
          ip: clientIp,
          userId: userData.id,
          data: {
            email,
            error: emailError instanceof Error ? emailError.message : 'Unknown error'
          }
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
