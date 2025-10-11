import { prisma } from './db';
import { logger } from './logger';

// Configuración para códigos de verificación
const CODE_EXPIRATION_MINUTES = 5; // 5 minutos
const CODE_LENGTH = 6;

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

    // Buscar si ya existe un código para este email
    const existingUser = await prisma.usuarios.findFirst({ email });
    
    if (existingUser) {
      // Actualizar el usuario existente con el nuevo código
      await prisma.usuarios.update({ id: existingUser.id }, {
        password_reset_token: code,
        password_reset_expires: expiresAt.toISOString()
      });
    } else {
      // Si no existe el usuario, no enviamos el código por seguridad
      logger.warn(`Intento de generar código para email no registrado: ${email}`, {
        action: 'verification_code_attempt',
        data: { email }
      });
      // No lanzamos error, solo retornamos false para indicar que no se procesó
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

    // Buscar el usuario
    const user = await prisma.usuarios.findFirst({ email });
    
    // Debug: Log detallado del usuario encontrado
    logger.info(`Usuario encontrado para ${email}`, {
      action: 'verify_code_user_found',
      data: { 
        email,
        userId: user?.id,
        hasPasswordResetToken: !!user?.password_reset_token,
        passwordResetToken: user?.password_reset_token,
        passwordResetExpires: user?.password_reset_expires,
        userKeys: user ? Object.keys(user) : []
      }
    });
    
    if (!user) {
      logger.warn(`Intento de verificar código para email no registrado: ${email}`, {
        action: 'verify_code_invalid_email',
        data: { email }
      });
      return {
        isValid: false,
        message: 'Email no registrado en el sistema'
      };
    }

    // Verificar si el código coincide
    if (user.password_reset_token !== code) {
      logger.warn(`Código incorrecto para ${email}`, {
        action: 'verify_code_incorrect',
        data: { 
          email, 
          storedCode: user.password_reset_token, 
          providedCode: code,
          codesMatch: user.password_reset_token === code
        }
      });
      return {
        isValid: false,
        message: 'Código de verificación incorrecto'
      };
    }

    // Verificar si el código ha expirado
    if (!user.password_reset_expires || isCodeExpired(new Date(user.password_reset_expires))) {
      logger.warn(`Código expirado para ${email}`, {
        action: 'verify_code_expired',
        data: { email, expiresAt: user.password_reset_expires }
      });
      return {
        isValid: false,
        message: 'Código de verificación expirado'
      };
    }

    // Generar token temporal para reset de contraseña
    const resetToken = generateResetToken();
    
    // Limpiar el código de verificación y guardar el token de reset
    await prisma.usuarios.update({ id: user.id }, {
      password_reset_token: resetToken,
      password_reset_expires: getCodeExpiration().toISOString()
    });

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
