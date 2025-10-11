// Sistema de auditoría para rastrear cambios
// Nota: Sistema de auditoría simplificado para LDAP
// En producción, se podría implementar un sistema de auditoría más robusto

export interface AuditEntry {
  id: string;
  userId: string;
  action: string;
  resource: string;
  resourceId: string;
  oldValues?: any;
  newValues?: any;
  ip: string;
  userAgent: string;
  timestamp: Date;
}

export enum AuditAction {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  LOGIN = 'LOGIN',
  LOGOUT = 'LOGOUT',
  PASSWORD_CHANGE = 'PASSWORD_CHANGE',
  FAILED_LOGIN = 'FAILED_LOGIN',
}

export async function createAuditEntry(
  userId: string,
  action: AuditAction,
  resource: string,
  resourceId: string,
  ip: string,
  userAgent: string,
  oldValues?: any,
  newValues?: any
) {
  try {
    // Sistema de auditoría simplificado para LDAP
    // En producción, esto se podría almacenar en un sistema de logs externo
    const auditEntry = {
      id: crypto.randomUUID(),
      userId,
      action,
      resource,
      resourceId,
      oldValues: oldValues ? JSON.stringify(oldValues) : null,
      newValues: newValues ? JSON.stringify(newValues) : null,
      ip,
      userAgent,
      timestamp: new Date(),
    };

    // Por ahora solo loggeamos, pero podrías crear una tabla audit_log
    console.log('AUDIT:', auditEntry);
    
    return auditEntry;
  } catch (error) {
    console.error('Error creating audit entry:', error);
  }
}

// Middleware para auditoría automática
export function auditMiddleware(
  action: AuditAction,
  resource: string,
  getUserId: (req: any) => string,
  getResourceId: (req: any) => string
) {
  return async (req: any, res: any, next: any) => {
    const userId = getUserId(req);
    const resourceId = getResourceId(req);
    const ip = req.ip || 'unknown';
    const userAgent = req.headers['user-agent'] || 'unknown';

    await createAuditEntry(userId, action, resource, resourceId, ip, userAgent);
    
    if (next) next();
  };
}
