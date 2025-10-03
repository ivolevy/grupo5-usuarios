// Sistema de permisos granular
export enum Permission {
  // Usuarios
  USER_READ = 'user:read',
  USER_CREATE = 'user:create',
  USER_UPDATE = 'user:update',
  USER_DELETE = 'user:delete',
  USER_READ_ALL = 'user:read_all',
  
  // Administración
  ADMIN_DASHBOARD = 'admin:dashboard',
  ADMIN_LOGS = 'admin:logs',
  ADMIN_SYSTEM = 'admin:system',
  
  // Perfil propio
  PROFILE_READ = 'profile:read',
  PROFILE_UPDATE = 'profile:update',
}

export const ROLE_PERMISSIONS: Record<string, Permission[]> = {
  admin: [
    Permission.USER_READ,
    Permission.USER_CREATE,
    Permission.USER_UPDATE,
    Permission.USER_DELETE,
    Permission.USER_READ_ALL,
    Permission.ADMIN_DASHBOARD,
    Permission.ADMIN_LOGS,
    Permission.ADMIN_SYSTEM,
    Permission.PROFILE_READ,
    Permission.PROFILE_UPDATE,
  ],
  interno: [
    Permission.USER_READ,
    Permission.USER_READ_ALL,
    Permission.PROFILE_READ,
    Permission.PROFILE_UPDATE,
  ],
  usuario: [
    Permission.PROFILE_READ,
    Permission.PROFILE_UPDATE,
  ],
};

export function hasPermission(userRole: string, permission: Permission): boolean {
  const rolePermissions = ROLE_PERMISSIONS[userRole] || [];
  return rolePermissions.includes(permission);
}

export function hasAnyPermission(userRole: string, permissions: Permission[]): boolean {
  return permissions.some(permission => hasPermission(userRole, permission));
}

export function hasAllPermissions(userRole: string, permissions: Permission[]): boolean {
  return permissions.every(permission => hasPermission(userRole, permission));
}

export function canAccessUser(requestingUserRole: string, requestingUserId: string, targetUserId: string): boolean {
  // Admin puede acceder a cualquier usuario
  if (hasPermission(requestingUserRole, Permission.USER_READ_ALL)) {
    return true;
  }
  
  // Usuario solo puede acceder a su propio perfil
  return requestingUserId === targetUserId;
}
