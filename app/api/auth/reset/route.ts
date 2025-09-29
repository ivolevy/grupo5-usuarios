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
import { LDAPRepositoryImpl } from '../../../../back/src/infrastructure/repositories/ldap.repository.impl';
import { LDAPServiceImpl } from '../../../../back/src/application/services/ldap.service.impl';
import { LDAPConfig } from '../../../../back/src/types/ldap.types';
import { hashPassword, validatePasswordStrength } from '@/lib/auth';
import { logger } from '@/lib/logger';
import { rateLimiter } from '@/lib/rate-limiter';

// Configuración LDAP
const ldapConfig: LDAPConfig = {
  url: process.env.LDAP_URL || 'ldap://35.184.48.90:389',
  baseDN: process.env.LDAP_BASE_DN || 'dc=empresa,dc=local',
  bindDN: process.env.LDAP_BIND_DN || 'cn=admin,dc=empresa,dc=local',
  bindPassword: process.env.LDAP_BIND_PASSWORD || 'boca2002',
  usersOU: process.env.LDAP_USERS_OU || 'ou=users,dc=empresa,dc=local'
};

// Instanciar servicios LDAP
const ldapRepository = new LDAPRepositoryImpl(ldapConfig);
const ldapService = new LDAPServiceImpl(ldapRepository);

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

    // Buscar usuario por token de reset en LDAP
    // Necesitamos buscar en todos los usuarios y verificar el token en el campo description
    const allUsersResult = await ldapService.getAllUsers();
    
    if (!allUsersResult.success || !allUsersResult.data) {
      logger.error('Error al obtener usuarios de LDAP para buscar token', {
        action: 'reset_password_ldap_error',
        ip: clientIP,
        data: { tokenLength: token.length }
      });
      
      return NextResponse.json(
        { success: false, message: 'Error interno del servidor' },
        { status: 500 }
      );
    }

    // Buscar usuario con el token de reset
    let user = null;
    logger.info(`Buscando usuario con token: ${token}`, {
      action: 'reset_password_token_search',
      ip: clientIP,
      data: { 
        tokenLength: token.length,
        totalUsers: allUsersResult.data.length
      }
    });
    
    for (const ldapUser of allUsersResult.data) {
      logger.info(`Verificando usuario: ${ldapUser.uid}`, {
        action: 'reset_password_user_check',
        ip: clientIP,
        data: { 
          uid: ldapUser.uid,
          email: ldapUser.mail,
          hasToken: !!ldapUser.passwordResetToken,
          token: ldapUser.passwordResetToken,
          expires: ldapUser.passwordResetExpires,
          description: ldapUser.description
        }
      });
      
      if (ldapUser.passwordResetToken === token) {
        user = ldapUser;
        logger.info(`Usuario encontrado con token: ${ldapUser.uid}`, {
          action: 'reset_password_user_found',
          ip: clientIP,
          data: { 
            uid: ldapUser.uid,
            email: ldapUser.mail,
            expires: ldapUser.passwordResetExpires
          }
        });
        break;
      }
    }

    if (!user) {
      logger.warn('Token de reset inválido en LDAP', {
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
    if (!user.passwordResetExpires) {
      logger.warn('Token de reset sin fecha de expiración en LDAP', {
        action: 'reset_password_no_expiry',
        ip: clientIP,
        data: { userId: user.uid, email: user.mail }
      });
      
      return NextResponse.json(
        { success: false, message: 'Token inválido o expirado' },
        { status: 400 }
      );
    }

    // Log detallado de la fecha de expiración
    logger.info('Verificando expiración del token', {
      action: 'reset_password_check_expiry',
      ip: clientIP,
      data: { 
        userId: user.uid, 
        email: user.mail,
        expiresAt: user.passwordResetExpires,
        now: new Date().toISOString()
      }
    });

    const now = new Date();
    let expiresAt: Date;
    
    // Si la fecha no tiene hora, agregar 23:59:59 para que sea válida hasta el final del día
    if (user.passwordResetExpires.length === 10) { // Formato: YYYY-MM-DD
      expiresAt = new Date(user.passwordResetExpires + 'T23:59:59.999Z');
      logger.info('Fecha sin hora detectada, agregando 23:59:59', {
        action: 'reset_password_fix_date',
        ip: clientIP,
        data: { 
          original: user.passwordResetExpires,
          fixed: expiresAt.toISOString()
        }
      });
    } else {
      expiresAt = new Date(user.passwordResetExpires);
    }
    
    if (now > expiresAt) {
      // Limpiar token expirado en LDAP
      const currentDescription = user.description || '';
      const newDescription = currentDescription
        .replace(/TR:[^|]*/, 'TR:')
        .replace(/RE:[^|]*/, 'RE:');
      
      await ldapService.updateUser(user.uid, { description: newDescription });

      logger.warn('Token de reset expirado en LDAP', {
        action: 'reset_password_expired_token',
        ip: clientIP,
        data: { 
          userId: user.uid, 
          email: user.mail,
          expiresAt: user.passwordResetExpires,
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
          userId: user.uid, 
          email: user.mail,
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

    // Actualizar contraseña y limpiar token de reset en LDAP
    const currentDescription = user.description || '';
    const newDescription = currentDescription
      .replace(/TR:[^|]*/, 'TR:')
      .replace(/RE:[^|]*/, 'RE:')
      .replace(/U:[^|]*/, `U:${new Date().toISOString().substring(0, 10)}`);

    const updateResult = await ldapService.updateUser(user.uid, {
      userPassword: hashedPassword,
      description: newDescription
    });

    if (!updateResult.success) {
      logger.error('Error al actualizar contraseña en LDAP', {
        action: 'reset_password_ldap_update_error',
        ip: clientIP,
        data: { userId: user.uid, email: user.mail, error: updateResult.error }
      });
      
      return NextResponse.json(
        { success: false, message: 'Error al actualizar contraseña. Intenta nuevamente.' },
        { status: 500 }
      );
    }

    logger.info(`Contraseña actualizada exitosamente en LDAP para: ${user.mail}`, {
      action: 'reset_password_success',
      ip: clientIP,
      data: { userId: user.uid, email: user.mail }
    });

    return NextResponse.json({
      success: true,
      message: 'Contraseña actualizada exitosamente en LDAP'
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
