// Servicio para almacenar y validar códigos de verificación
// Usa LDAP para almacenar códigos temporalmente

export interface VerificationCode {
  id: string;
  email: string;
  code: string;
  expires_at: string;
  used: boolean;
  created_at: string;
}

export class CodeStorageService {
  private userRepository: any;

  constructor(userRepository: any) {
    this.userRepository = userRepository;
  }

  // Generar código de 6 dígitos
  private generateCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  // Crear un nuevo código de verificación
  async createCode(email: string): Promise<{ code: string; expiresAt: string }> {
    const code = this.generateCode();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString(); // 15 minutos

    try {
      // Primero, invalidar cualquier código existente para este email
      await this.invalidateExistingCodes(email);

      // Crear nuevo código en LDAP
      // Como no tenemos una tabla específica para códigos, usaremos el usuario
      // y almacenaremos el código en un campo temporal
      const user = await this.userRepository.findByEmail(email);
      
      if (user) {
        const userData = user.toPlainObject();
        // Actualizar usuario con código temporal
        await this.userRepository.update(userData.id, {
          password_reset_token: code, // Usamos este campo para el código
          password_reset_expires: expiresAt
        });
      }

      return { code, expiresAt };
    } catch (error) {
      throw new Error(`Error creando código de verificación: ${error instanceof Error ? error.message : error}`);
    }
  }

  // Validar código de verificación
  async validateCode(email: string, code: string): Promise<{ valid: boolean; message: string }> {
    try {
      const user = await this.userRepository.findByEmail(email);
      
      if (!user) {
        return { valid: false, message: 'Usuario no encontrado' };
      }

      const userData = user.toPlainObject();
      if (!userData.password_reset_token || !userData.password_reset_expires) {
        return { valid: false, message: 'Código no encontrado o expirado' };
      }

      // Verificar que el código coincida
      if (userData.password_reset_token !== code) {
        return { valid: false, message: 'Código incorrecto' };
      }

      // Verificar que no haya expirado
      const now = new Date();
      const expiresAt = new Date(userData.password_reset_expires);
      
      if (now > expiresAt) {
        // Limpiar código expirado
        await this.userRepository.update(userData.id, {
          password_reset_token: null,
          password_reset_expires: null
        });
        return { valid: false, message: 'Código expirado' };
      }

      return { valid: true, message: 'Código válido' };
    } catch (error) {
      throw new Error(`Error validando código: ${error instanceof Error ? error.message : error}`);
    }
  }

  // Invalidar códigos existentes para un email
  async invalidateExistingCodes(email: string): Promise<void> {
    try {
      const user = await this.userRepository.findByEmail(email);
      
      if (user) {
        const userData = user.toPlainObject();
        await this.userRepository.update(userData.id, {
          password_reset_token: null,
          password_reset_expires: null
        });
      }
    } catch (error) {
      // No lanzar error aquí, es solo limpieza
      console.warn('Error invalidando códigos existentes:', error);
    }
  }

  // Limpiar códigos expirados (para ejecutar periódicamente)
  async cleanupExpiredCodes(): Promise<number> {
    try {
      const now = new Date().toISOString();
      
      // Buscar usuarios con códigos expirados usando LDAP
      // Nota: Esta funcionalidad sería compleja de implementar en LDAP
      // Por ahora, retornamos 0 y manejamos la limpieza en el momento de validación
      console.log('Cleanup de códigos expirados no implementado para LDAP');
      return 0;
    } catch (error) {
      console.error('Error limpiando códigos expirados:', error);
      return 0;
    }
  }

  // Generar token de reset después de validar código
  async generateResetToken(email: string): Promise<{ token: string; expiresAt: string }> {
    const token = this.generateResetTokenString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString(); // 15 minutos

    try {
      const user = await this.userRepository.findByEmail(email);
      
      if (user) {
        const userData = user.toPlainObject();
        // Actualizar con token de reset (reemplazando el código)
        await this.userRepository.update(userData.id, {
          password_reset_token: token,
          password_reset_expires: expiresAt
        });
      }

      return { token, expiresAt };
    } catch (error) {
      throw new Error(`Error generando token de reset: ${error instanceof Error ? error.message : error}`);
    }
  }

  // Generar string de token de reset
  private generateResetTokenString(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 32; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }
}

// Instancia singleton - será inicializada con el userRepository de LDAP
// Esto se manejará dinámicamente en los endpoints que lo necesiten
export let codeStorageService: CodeStorageService;

// Función para inicializar el servicio con el repositorio correcto
export const initializeCodeStorageService = async () => {
  const { getServices } = await import('./database-config');
  const { userRepository } = await getServices();
  codeStorageService = new CodeStorageService(userRepository);
  return codeStorageService;
};
