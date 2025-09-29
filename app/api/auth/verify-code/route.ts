import { NextRequest, NextResponse } from 'next/server';
/**
 * @openapi
 * /api/auth/verify-code:
 *   post:
 *     tags: [auth]
 *     summary: Verify email code and issue reset token
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, code]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               code:
 *                 type: string
 *                 pattern: "^\\d{6}$"
 *     responses:
 *       200:
 *         description: Code verified
 *       400:
 *         description: Invalid email or code
 *       429:
 *         description: Rate limit exceeded
 *       500:
 *         description: Internal server error
 */
import { LDAPRepositoryImpl } from '../../../../back/src/infrastructure/repositories/ldap.repository.impl';
import { LDAPServiceImpl } from '../../../../back/src/application/services/ldap.service.impl';
import { LDAPConfig } from '../../../../back/src/types/ldap.types';
import { verifyCode } from '@/lib/email-verification';
import { isValidEmail } from '@/lib/email-service';
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
    logger.info('Petición de verificación de código recibida', {
      action: 'verify_code_request',
      ip: clientIP,
      data: { timestamp: new Date().toISOString() }
    });

    // Rate limiting más estricto para verificación de códigos
    const rateLimitResult = await rateLimiter.checkLimit(clientIP, 'verify_code');
    if (!rateLimitResult.allowed) {
      logger.warn('Rate limit excedido para verificación de código', {
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
          message: 'Demasiados intentos de verificación. Intenta nuevamente en unos minutos.',
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
      logger.warn('Error al parsear JSON en petición de verificación', {
        action: 'parse_json_error',
        ip: clientIP,
        data: { error: error instanceof Error ? error.message : 'Invalid JSON' }
      });
      
      return NextResponse.json(
        { success: false, message: 'Formato de petición inválido' },
        { status: 400 }
      );
    }

    const { email, code } = body;

    // Validar que se proporcionaron los datos requeridos
    if (!email || !code) {
      logger.warn('Petición de verificación con datos faltantes', {
        action: 'verify_code_missing_data',
        ip: clientIP,
        data: { hasEmail: !!email, hasCode: !!code }
      });
      
      return NextResponse.json(
        { success: false, message: 'Email y código son requeridos' },
        { status: 400 }
      );
    }

    // Validar formato del email
    if (!isValidEmail(email)) {
      logger.warn('Email inválido en petición de verificación', {
        action: 'verify_code_invalid_email',
        ip: clientIP,
        data: { email }
      });
      
      return NextResponse.json(
        { success: false, message: 'Formato de email inválido' },
        { status: 400 }
      );
    }

    // Validar formato del código (6 dígitos)
    if (!/^\d{6}$/.test(code)) {
      logger.warn('Código inválido en petición de verificación', {
        action: 'verify_code_invalid_format',
        ip: clientIP,
        data: { email, codeLength: code.length }
      });
      
      return NextResponse.json(
        { success: false, message: 'El código debe tener 6 dígitos numéricos' },
        { status: 400 }
      );
    }

    logger.info(`Verificando código para: ${email}`, {
      action: 'verify_code_process',
      ip: clientIP,
      data: { email, codeLength: code.length }
    });

    // Verificar que el email existe en LDAP
    const userResult = await ldapService.getUserByEmail(email);
    
    if (!userResult.success || !userResult.data) {
      logger.warn(`Email no encontrado en LDAP para verificación: ${email}`, {
        action: 'verify_code_email_not_found',
        ip: clientIP,
        data: { email }
      });

      return NextResponse.json(
        { 
          success: false, 
          message: 'Email no encontrado en el sistema' 
        },
        { status: 400 }
      );
    }

    // Verificar el código
    const verificationResult = await verifyCode(email, code);

    if (verificationResult.isValid) {
      // Generar token de reset y actualizar en LDAP
      const resetToken = verificationResult.token;
      const resetExpires = new Date(Date.now() + 5 * 60 * 1000).toISOString(); // 5 minutos
      
      const currentDescription = userResult.data.description || '';
      const newDescription = currentDescription
        .replace(/TR:[^|]*/, `TR:${resetToken}`)
        .replace(/RE:[^|]*/, `RE:${resetExpires.substring(0, 10)}`);

      const updateResult = await ldapService.updateUser(userResult.data.uid, {
        description: newDescription
      });

      if (!updateResult.success) {
        logger.error('Error al actualizar token de reset en LDAP', {
          action: 'verify_code_ldap_update_error',
          ip: clientIP,
          data: { email, error: updateResult.error }
        });
        
        return NextResponse.json(
          { success: false, message: 'Error al generar token de reset. Intenta nuevamente.' },
          { status: 500 }
        );
      }

      logger.info(`Código verificado exitosamente para: ${email}`, {
        action: 'verify_code_success',
        ip: clientIP,
        data: { email }
      });

      return NextResponse.json({
        success: true,
        message: verificationResult.message,
        data: {
          email,
          token: resetToken,
          expiresIn: 5 // minutos
        }
      });
    } else {
      logger.warn(`Código inválido o expirado para: ${email}`, {
        action: 'verify_code_failed',
        ip: clientIP,
        data: { email, reason: verificationResult.message }
      });

      return NextResponse.json(
        { 
          success: false, 
          message: verificationResult.message 
        },
        { status: 400 }
      );
    }

  } catch (error) {
    const clientIP = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    
    logger.error('Error interno en verificación de código', {
      action: 'verify_code_internal_error',
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
