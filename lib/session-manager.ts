// Session Manager para gestión avanzada de sesiones
import { prisma } from './db';
import { AuditLogger, AuditAction } from './audit';
import { TokenManager } from './token-manager';

interface DeviceInfo {
  userAgent?: string;
  ip?: string;
  platform?: string;
  browser?: string;
  os?: string;
  isMobile?: boolean;
}

interface SessionInfo {
  id: string;
  userId: string;
  deviceInfo: DeviceInfo;
  createdAt: Date;
  lastActivity: Date;
  expiresAt: Date;
  isActive: boolean;
  accessToken?: string;
  refreshToken?: string;
}

class SessionManager {
  private static sessions = new Map<string, SessionInfo>();
  
  /**
   * Crea una nueva sesión
   */
  static async createSession(
    userId: string, 
    deviceInfo: DeviceInfo, 
    ip: string,
    userAgent?: string
  ): Promise<{ sessionId: string; accessToken: string; refreshToken: string }> {
    try {
      const sessionId = crypto.randomUUID();
      const now = new Date();
      const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 horas
      
      // Generar tokens
      const accessToken = TokenManager.generateAccessToken({
        userId,
        email: '', // Se llenará desde la BD
        rol: '' // Se llenará desde la BD
      });
      
      const refreshToken = TokenManager.generateRefreshToken(userId, deviceInfo);
      
      // Crear sesión
      const session: SessionInfo = {
        id: sessionId,
        userId,
        deviceInfo: {
          ...deviceInfo,
          userAgent: userAgent || deviceInfo.userAgent,
          ip: ip || deviceInfo.ip
        },
        createdAt: now,
        lastActivity: now,
        expiresAt,
        isActive: true,
        accessToken,
        refreshToken
      };
      
      this.sessions.set(sessionId, session);
      
      // Log de auditoría
      AuditLogger.logUserAction(
        AuditAction.LOGIN_SUCCESS,
        userId,
        ip,
        { sessionId, deviceInfo },
        userAgent,
        '/api/auth/login',
        'POST'
      );
      
      return { sessionId, accessToken, refreshToken };
    } catch (error) {
      console.error('Error creating session:', error);
      throw new Error('Error al crear sesión');
    }
  }
  
  /**
   * Valida una sesión
   */
  static validateSession(sessionId: string): SessionInfo | null {
    const session = this.sessions.get(sessionId);
    
    if (!session) {
      return null;
    }
    
    // Verificar si la sesión expiró
    if (session.expiresAt < new Date()) {
      this.sessions.delete(sessionId);
      return null;
    }
    
    // Verificar si está activa
    if (!session.isActive) {
      return null;
    }
    
    // Actualizar última actividad
    session.lastActivity = new Date();
    
    return session;
  }
  
  /**
   * Actualiza la actividad de una sesión
   */
  static updateSessionActivity(sessionId: string): boolean {
    const session = this.sessions.get(sessionId);
    
    if (!session || !session.isActive) {
      return false;
    }
    
    session.lastActivity = new Date();
    return true;
  }
  
  /**
   * Invalida una sesión (logout)
   */
  static async invalidateSession(
    sessionId: string, 
    userId: string, 
    reason: string = 'logout',
    ip?: string
  ): Promise<boolean> {
    try {
      const session = this.sessions.get(sessionId);
      
      if (session) {
        // Revocar tokens
        if (session.accessToken) {
          TokenManager.blacklistToken(session.accessToken, userId, reason, ip);
        }
        if (session.refreshToken) {
          TokenManager.revokeRefreshToken(session.refreshToken, userId, reason, ip);
        }
        
        // Marcar sesión como inactiva
        session.isActive = false;
        
        // Log de auditoría
        AuditLogger.logUserAction(
          AuditAction.LOGOUT,
          userId,
          ip || 'unknown',
          { sessionId, reason },
          session.deviceInfo.userAgent,
          '/api/auth/logout',
          'POST'
        );
      }
      
      // Remover de la memoria
      this.sessions.delete(sessionId);
      
      return true;
    } catch (error) {
      console.error('Error invalidating session:', error);
      return false;
    }
  }
  
  /**
   * Invalida todas las sesiones de un usuario
   */
  static async invalidateAllUserSessions(
    userId: string, 
    reason: string = 'security_logout',
    ip?: string
  ): Promise<number> {
    try {
      let invalidatedCount = 0;
      
      for (const [sessionId, session] of this.sessions.entries()) {
        if (session.userId === userId && session.isActive) {
          await this.invalidateSession(sessionId, userId, reason, ip);
          invalidatedCount++;
        }
      }
      
      // También revocar todos los refresh tokens
      TokenManager.revokeAllUserTokens(userId, reason, ip);
      
      return invalidatedCount;
    } catch (error) {
      console.error('Error invalidating all user sessions:', error);
      return 0;
    }
  }
  
  /**
   * Obtiene todas las sesiones activas de un usuario
   */
  static getUserSessions(userId: string): SessionInfo[] {
    const userSessions: SessionInfo[] = [];
    
    for (const session of this.sessions.values()) {
      if (session.userId === userId && session.isActive) {
        userSessions.push(session);
      }
    }
    
    return userSessions;
  }
  
  /**
   * Obtiene información de una sesión
   */
  static getSessionInfo(sessionId: string): SessionInfo | null {
    return this.sessions.get(sessionId) || null;
  }
  
  /**
   * Limpia sesiones expiradas
   */
  static cleanupExpiredSessions(): number {
    const now = new Date();
    let cleanedCount = 0;
    
    for (const [sessionId, session] of this.sessions.entries()) {
      if (session.expiresAt < now || !session.isActive) {
        this.sessions.delete(sessionId);
        cleanedCount++;
      }
    }
    
    return cleanedCount;
  }
  
  /**
   * Obtiene estadísticas de sesiones
   */
  static getSessionStats(): {
    totalSessions: number;
    activeSessions: number;
    uniqueUsers: number;
    averageSessionDuration: number;
  } {
    const totalSessions = this.sessions.size;
    let activeSessions = 0;
    const userIds = new Set<string>();
    let totalDuration = 0;
    
    for (const session of this.sessions.values()) {
      if (session.isActive) {
        activeSessions++;
        userIds.add(session.userId);
        
        const duration = session.lastActivity.getTime() - session.createdAt.getTime();
        totalDuration += duration;
      }
    }
    
    const averageSessionDuration = activeSessions > 0 ? totalDuration / activeSessions : 0;
    
    return {
      totalSessions,
      activeSessions,
      uniqueUsers: userIds.size,
      averageSessionDuration
    };
  }
  
  /**
   * Detecta actividad sospechosa
   */
  static detectSuspiciousActivity(userId: string, newDeviceInfo: DeviceInfo, ip: string): {
    isSuspicious: boolean;
    reasons: string[];
  } {
    const reasons: string[] = [];
    const userSessions = this.getUserSessions(userId);
    
    // Verificar múltiples sesiones desde diferentes IPs
    const uniqueIPs = new Set(userSessions.map(s => s.deviceInfo.ip).filter(Boolean));
    if (uniqueIPs.size > 3) {
      reasons.push('Multiple sessions from different IPs');
    }
    
    // Verificar cambios bruscos en User-Agent
    const userAgents = userSessions.map(s => s.deviceInfo.userAgent).filter(Boolean);
    const isNewUserAgent = !userAgents.some(ua => ua === newDeviceInfo.userAgent);
    if (isNewUserAgent && userAgents.length > 0) {
      reasons.push('New User-Agent detected');
    }
    
    // Verificar múltiples sesiones simultáneas
    if (userSessions.length > 5) {
      reasons.push('Too many simultaneous sessions');
    }
    
    return {
      isSuspicious: reasons.length > 0,
      reasons
    };
  }
  
  /**
   * Obtiene sesiones por IP
   */
  static getSessionsByIP(ip: string): SessionInfo[] {
    const sessions: SessionInfo[] = [];
    
    for (const session of this.sessions.values()) {
      if (session.deviceInfo.ip === ip && session.isActive) {
        sessions.push(session);
      }
    }
    
    return sessions;
  }
}

// Limpiar sesiones expiradas cada 30 minutos
setInterval(() => {
  const cleaned = SessionManager.cleanupExpiredSessions();
  if (cleaned > 0) {
    console.log(`Cleaned up ${cleaned} expired sessions`);
  }
}, 30 * 60 * 1000);

export { SessionManager };
export type { DeviceInfo, SessionInfo };
