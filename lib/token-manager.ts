// Token Manager con blacklist y gestión avanzada de tokens
import jwt from 'jsonwebtoken';
import { JWTPayload } from './auth';
import { SecurityAudit } from './audit';

interface TokenBlacklistEntry {
  token: string;
  userId: string;
  reason: string;
  blacklistedAt: Date;
  expiresAt: Date;
}

interface RefreshTokenEntry {
  token: string;
  userId: string;
  deviceInfo?: any;
  createdAt: Date;
  expiresAt: Date;
  lastUsed?: Date;
}

class TokenManager {
  private static blacklistedTokens = new Map<string, TokenBlacklistEntry>();
  private static refreshTokens = new Map<string, RefreshTokenEntry>();
  
  // Configuración JWT
  private static readonly JWT_SECRET = process.env.JWT_SECRET || 'tu_clave_secreta_muy_segura_cambiala_en_produccion';
  private static readonly JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'tu_clave_refresh_secreta_muy_segura_cambiala_en_produccion';
  private static readonly JWT_EXPIRES_IN = '24h';
  private static readonly REFRESH_TOKEN_EXPIRES_IN = '7d';
  
  /**
   * Genera un token JWT de acceso
   */
  static generateAccessToken(payload: Omit<JWTPayload, 'iat' | 'exp'>): string {
    try {
      const token = jwt.sign(payload, this.JWT_SECRET, {
        expiresIn: this.JWT_EXPIRES_IN,
        issuer: 'grupousuarios-tp',
        audience: 'grupousuarios-tp-users'
      });
      return token;
    } catch (error) {
      console.error('Error al generar access token:', error);
      throw new Error('Error al generar token de acceso');
    }
  }
  
  /**
   * Genera un refresh token
   */
  static generateRefreshToken(userId: string, deviceInfo?: any): string {
    try {
      const token = jwt.sign(
        { 
          userId, 
          type: 'refresh',
          deviceInfo: deviceInfo ? JSON.stringify(deviceInfo) : undefined
        },
        this.JWT_REFRESH_SECRET,
        { expiresIn: this.REFRESH_TOKEN_EXPIRES_IN }
      );
      
      // Almacenar refresh token
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 días
      this.refreshTokens.set(token, {
        token,
        userId,
        deviceInfo,
        createdAt: new Date(),
        expiresAt,
        lastUsed: new Date()
      });
      
      return token;
    } catch (error) {
      console.error('Error al generar refresh token:', error);
      throw new Error('Error al generar refresh token');
    }
  }
  
  /**
   * Verifica un access token
   */
  static verifyAccessToken(token: string): JWTPayload | null {
    try {
      // Verificar si está en blacklist
      if (this.isTokenBlacklisted(token)) {
        return null;
      }
      
      const decoded = jwt.verify(token, this.JWT_SECRET, {
        issuer: 'grupousuarios-tp',
        audience: 'grupousuarios-tp-users'
      }) as JWTPayload;
      
      return decoded;
    } catch (error) {
      console.error('Error al verificar access token:', error);
      return null;
    }
  }
  
  /**
   * Verifica un refresh token
   */
  static verifyRefreshToken(token: string): { userId: string; deviceInfo?: any } | null {
    try {
      const decoded = jwt.verify(token, this.JWT_REFRESH_SECRET) as any;
      
      // Verificar si existe en nuestro almacén
      const storedToken = this.refreshTokens.get(token);
      if (!storedToken || storedToken.expiresAt < new Date()) {
        this.refreshTokens.delete(token);
        return null;
      }
      
      // Actualizar último uso
      storedToken.lastUsed = new Date();
      
      return {
        userId: decoded.userId,
        deviceInfo: decoded.deviceInfo ? JSON.parse(decoded.deviceInfo) : undefined
      };
    } catch (error) {
      console.error('Error al verificar refresh token:', error);
      return null;
    }
  }
  
  /**
   * Agrega un token a la blacklist
   */
  static blacklistToken(token: string, userId: string, reason: string, ip?: string): void {
    try {
      // Decodificar token para obtener expiración
      const decoded = jwt.decode(token) as any;
      const expiresAt = new Date(decoded.exp * 1000);
      
      const entry: TokenBlacklistEntry = {
        token,
        userId,
        reason,
        blacklistedAt: new Date(),
        expiresAt
      };
      
      this.blacklistedTokens.set(token, entry);
      
      // Log de seguridad
      if (ip) {
        SecurityAudit.logTokenBlacklisted(userId, ip, reason);
      }
      
      console.log(`Token blacklisted: ${reason}`, { userId, token: token.substring(0, 20) + '...' });
    } catch (error) {
      console.error('Error al blacklistear token:', error);
    }
  }
  
  /**
   * Verifica si un token está en la blacklist
   */
  static isTokenBlacklisted(token: string): boolean {
    const entry = this.blacklistedTokens.get(token);
    if (!entry) return false;
    
    // Si el token expiró, remover de blacklist
    if (entry.expiresAt < new Date()) {
      this.blacklistedTokens.delete(token);
      return false;
    }
    
    return true;
  }
  
  /**
   * Revoca un refresh token
   */
  static revokeRefreshToken(token: string, userId: string, reason: string, ip?: string): void {
    this.refreshTokens.delete(token);
    
    if (ip) {
      SecurityAudit.logTokenBlacklisted(userId, ip, `Refresh token revoked: ${reason}`);
    }
    
    console.log(`Refresh token revoked: ${reason}`, { userId, token: token.substring(0, 20) + '...' });
  }
  
  /**
   * Revoca todos los refresh tokens de un usuario
   */
  static revokeAllUserTokens(userId: string, reason: string, ip?: string): void {
    let revokedCount = 0;
    
    for (const [token, entry] of this.refreshTokens.entries()) {
      if (entry.userId === userId) {
        this.refreshTokens.delete(token);
        revokedCount++;
      }
    }
    
    if (ip) {
      SecurityAudit.logTokenBlacklisted(userId, ip, `All tokens revoked: ${reason}`);
    }
    
    console.log(`All tokens revoked for user: ${reason}`, { userId, revokedCount });
  }
  
  /**
   * Obtiene información de un refresh token
   */
  static getRefreshTokenInfo(token: string): RefreshTokenEntry | null {
    return this.refreshTokens.get(token) || null;
  }
  
  /**
   * Obtiene todos los refresh tokens de un usuario
   */
  static getUserRefreshTokens(userId: string): RefreshTokenEntry[] {
    const userTokens: RefreshTokenEntry[] = [];
    
    for (const [token, entry] of this.refreshTokens.entries()) {
      if (entry.userId === userId) {
        userTokens.push(entry);
      }
    }
    
    return userTokens;
  }
  
  /**
   * Limpia tokens expirados
   */
  static cleanupExpiredTokens(): void {
    const now = new Date();
    
    // Limpiar refresh tokens expirados
    for (const [token, entry] of this.refreshTokens.entries()) {
      if (entry.expiresAt < now) {
        this.refreshTokens.delete(token);
      }
    }
    
    // Limpiar blacklist expirada
    for (const [token, entry] of this.blacklistedTokens.entries()) {
      if (entry.expiresAt < now) {
        this.blacklistedTokens.delete(token);
      }
    }
  }
  
  /**
   * Obtiene estadísticas de tokens
   */
  static getTokenStats(): {
    activeRefreshTokens: number;
    blacklistedTokens: number;
    totalUsers: number;
  } {
    const activeRefreshTokens = this.refreshTokens.size;
    const blacklistedTokens = this.blacklistedTokens.size;
    
    const userIds = new Set<string>();
    for (const entry of this.refreshTokens.values()) {
      userIds.add(entry.userId);
    }
    
    return {
      activeRefreshTokens,
      blacklistedTokens,
      totalUsers: userIds.size
    };
  }
}

// Limpiar tokens expirados cada hora
setInterval(() => {
  TokenManager.cleanupExpiredTokens();
}, 60 * 60 * 1000);

export { TokenManager };
