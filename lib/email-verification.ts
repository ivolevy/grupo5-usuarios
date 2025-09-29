import { logger } from './logger';
import { LDAPRepositoryImpl } from '../back/src/infrastructure/repositories/ldap.repository.impl';
import { LDAPServiceImpl } from '../back/src/application/services/ldap.service.impl';
import { LDAPConfig } from '../back/src/types/ldap.types';

// Configuración para códigos de verificación
const CODE_EXPIRATION_MINUTES = 5; // 5 minutos
const CODE_LENGTH = 6;

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

export interface VerificationCodeData {
  email: string;
  code: string;
  expiresAt: Date;
  attempts: number;
}

/**
 * Genera un código de verificación de 6 dígitos
 */
export function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Calcula la fecha de expiración del código
 */
export function getCodeExpiration(): Date {
  const now = new Date();
  now.setMinutes(now.getMinutes() + CODE_EXPIRATION_MINUTES);
  return now;
}

/**
 * Verifica si un código ha expirado
 */
export function isCodeExpired(expiresAt: Date): boolean {
  return new Date() > new Date(expiresAt);
}

/**
 * Almacena un código de verificación para un email
 */
export async function storeVerificationCode(email: string): Promise<string | false> {
  try {
    const code = generateVerificationCode();
    const expiresAt = getCodeExpiration();
    
    logger.info(`Generando código de verificación para ${email}`, {
      action: 'generate_verification_code',
      data: { email, expiresAt: expiresAt.toISOString() }
    });

    // Buscar el usuario en LDAP
    const userResult = await ldapService.getUserByEmail(email);
    
    if (!userResult.success || !userResult.data) {
      // Si no existe el usuario, no enviamos el código por seguridad
      logger.warn(`Intento de generar código para email no registrado: ${email}`, {
        action: 'verification_code_attempt',
        data: { email }
      });
      return false;
    }

    const user = userResult.data;
    
    // Actualizar el usuario en LDAP con el nuevo código
    const currentDescription = user.description || '';
    const newDescription = currentDescription
      .replace(/TR:[^|]*/, `TR:${code}`)
      .replace(/RE:[^|]*/, `RE:${expiresAt.toISOString().replace(/:/g, '-')}`);

    // Si no hay campos TR: o RE:, agregarlos
    let finalDescription = newDescription;
    if (!finalDescription.includes('TR:')) {
      finalDescription += `|TR:${code}`;
    }
    if (!finalDescription.includes('RE:')) {
      finalDescription += `|RE:${expiresAt.toISOString().replace(/:/g, '-')}`;
    }

    logger.info(`Actualizando description en LDAP:`, {
      action: 'store_verification_code_update',
      data: { 
        email,
        currentDescription,
        newDescription,
        finalDescription,
        code,
        expiresAt: expiresAt.toISOString().substring(0, 10)
      }
    });

    const updateResult = await ldapService.updateUser(user.uid, {
      description: finalDescription
    });

    if (!updateResult.success) {
      logger.error(`Error al actualizar código en LDAP para ${email}`, {
        action: 'store_verification_code_ldap_error',
        data: { email, error: updateResult.error }
      });
      return false;
    }

    logger.info(`Código de verificación almacenado para ${email}`, {
      action: 'verification_code_stored',
      data: { email, expiresAt: expiresAt.toISOString() }
    });

    return code;
  } catch (error) {
    logger.error(`Error al almacenar código de verificación para ${email}`, {
      action: 'store_verification_code_error',
      data: { email, error: error instanceof Error ? error.message : 'Unknown error' }
    });
    throw error;
  }
}

/**
 * Verifica un código de verificación
 */
export async function verifyCode(email: string, code: string): Promise<{
  isValid: boolean;
  message: string;
  token?: string;
}> {
  try {
    logger.info(`Verificando código para ${email}`, {
      action: 'verify_code_attempt',
      data: { email, codeLength: code.length }
    });

    // Buscar el usuario en LDAP
    const userResult = await ldapService.getUserByEmail(email);
    
    if (!userResult.success || !userResult.data) {
      logger.warn(`Intento de verificar código para email no registrado: ${email}`, {
        action: 'verify_code_invalid_email',
        data: { email }
      });
      return {
        isValid: false,
        message: 'Email no registrado en el sistema'
      };
    }

    const user = userResult.data;

    // Log detallado para diagnóstico
    logger.info(`Datos del usuario para verificación:`, {
      action: 'verify_code_user_data',
      data: { 
        email,
        uid: user.uid,
        description: user.description,
        passwordResetToken: user.passwordResetToken,
        passwordResetExpires: user.passwordResetExpires,
        codeToVerify: code
      }
    });

    // Verificar si el código coincide (está en el description)
    if (user.passwordResetToken !== code) {
      logger.warn(`Código incorrecto para ${email}`, {
        action: 'verify_code_incorrect',
        data: { 
          email,
          expectedCode: user.passwordResetToken,
          receivedCode: code,
          description: user.description
        }
      });
      return {
        isValid: false,
        message: 'Código de verificación incorrecto'
      };
    }

    // Verificar si el código ha expirado
    if (!user.passwordResetExpires || isCodeExpired(new Date(user.passwordResetExpires))) {
      logger.warn(`Código expirado para ${email}`, {
        action: 'verify_code_expired',
        data: { email, expiresAt: user.passwordResetExpires }
      });
      return {
        isValid: false,
        message: 'Código de verificación expirado'
      };
    }

    // Generar token temporal para reset de contraseña
    const resetToken = generateResetToken();
    
    // Actualizar el usuario en LDAP con el token de reset
    const currentDescription = user.description || '';
    const newDescription = currentDescription
      .replace(/TR:[^|]*/, `TR:${resetToken}`)
      .replace(/RE:[^|]*/, `RE:${getCodeExpiration().toISOString().replace(/:/g, '-')}`);

    const updateResult = await ldapService.updateUser(user.uid, {
      description: newDescription
    });

    if (!updateResult.success) {
      logger.error(`Error al actualizar token en LDAP para ${email}`, {
        action: 'verify_code_ldap_error',
        data: { email, error: updateResult.error }
      });
      return {
        isValid: false,
        message: 'Error interno del servidor'
      };
    }

    logger.info(`Código verificado exitosamente para ${email}`, {
      action: 'verify_code_success',
      data: { email }
    });

    return {
      isValid: true,
      message: 'Código verificado correctamente',
      token: resetToken
    };
  } catch (error) {
    logger.error(`Error al verificar código para ${email}`, {
      action: 'verify_code_error',
      data: { email, error: error instanceof Error ? error.message : 'Unknown error' }
    });
    throw error;
  }
}

/**
 * Genera un token seguro para reset de contraseña
 */
function generateResetToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 32; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Limpia códigos de verificación expirados (función de mantenimiento)
 */
export async function cleanupExpiredCodes(): Promise<void> {
  try {
    const now = new Date().toISOString();
    
    // Esta función podría implementarse como una tarea programada
    // Por ahora solo loggeamos que se ejecutó
    logger.info('Limpieza de códigos expirados ejecutada', {
      action: 'cleanup_expired_codes',
      data: { timestamp: now }
    });
  } catch (error) {
    logger.error('Error en limpieza de códigos expirados', {
      action: 'cleanup_expired_codes_error',
      data: { error: error instanceof Error ? error.message : 'Unknown error' }
    });
  }
}
