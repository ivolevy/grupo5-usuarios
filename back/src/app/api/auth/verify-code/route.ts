import { NextRequest, NextResponse } from 'next/server';
import { getServices } from '@/lib/database-config';
import { initializeCodeStorageService } from '@/lib/code-storage';
import { validateData, verifyCodeSchema } from '@/lib/validations';
import { logger } from '@/lib/logger';
import { getClientIp } from '@/lib/rate-limiter';

// POST /api/auth/verify-code - Verificar código de recupero
export async function POST(request: NextRequest) {
  try {
    const clientIp = getClientIp(request);
    const body = await request.json();
    
    // Validar datos de entrada
    const validation = validateData(verifyCodeSchema, body);
    if (!validation.success) {
      return NextResponse.json({
        success: false,
        message: 'Datos de entrada inválidos',
        error: validation.error
      }, { status: 400 });
    }

    const { email, code } = validation.data;

    // Obtener servicios (LDAP o Supabase según configuración)
    const { userRepository } = await getServices();

    // Buscar el usuario por email
    const user = await userRepository.findByEmail(email);

    if (!user) {
      return NextResponse.json({
        success: false,
        message: 'Código inválido o expirado'
      }, { status: 400 });
    }

    // Inicializar y usar el servicio de códigos
    const codeStorageService = await initializeCodeStorageService();
    
    // Validar el código usando el servicio de almacenamiento
    console.log(`🔍 [CODE VERIFICATION] Validando código para ${email}...`);
    const validationResult = await codeStorageService.validateCode(email, code);

    if (!validationResult.valid) {
      console.log(`❌ [CODE VERIFICATION] Código inválido para ${email}: ${validationResult.message}`);
      return NextResponse.json({
        success: false,
        message: validationResult.message
      }, { status: 400 });
    }

    console.log(`✅ [CODE VERIFICATION] Código válido para ${email}`);

    // Generar token de reset después de validar el código
    const { token, expiresAt } = await codeStorageService.generateResetToken(email);
    console.log(`🔑 [CODE VERIFICATION] Token de reset generado para ${email}`);

    const userData = user.toPlainObject();
    logger.userAction('password_reset_code_verified', userData.id, clientIp, {
      email,
      code: '***' // No logear el código real por seguridad
    });

    // Devolver el token para el siguiente paso
    return NextResponse.json({
      success: true,
      message: 'Código verificado correctamente',
      data: {
        token
      }
    });

  } catch (error) {
    const clientIp = getClientIp(request);
    logger.error('Error verifying reset code', {
      action: 'verify_code_error',
      ip: clientIp,
      message: error instanceof Error ? error.message : 'Unknown error'
    });

    return NextResponse.json({
      success: false,
      message: 'Error interno del servidor'
    }, { status: 500 });
  }
}
