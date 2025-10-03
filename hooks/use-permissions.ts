"use client"

import { useAuth } from "@/contexts/auth-context"

// Permisos disponibles (deben coincidir con el backend)
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

// Mapeo de roles a permisos
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
}

/**
 * Hook para manejar permisos en el frontend
 */
export function usePermissions() {
  const { user } = useAuth()

  /**
   * Verifica si el usuario tiene un permiso específico
   */
  const hasPermission = (permission: Permission): boolean => {
    if (!user) return false
    
    const rolePermissions = ROLE_PERMISSIONS[user.rol] || []
    return rolePermissions.includes(permission)
  }

  /**
   * Verifica si el usuario tiene cualquiera de los permisos especificados (OR)
   */
  const hasAnyPermission = (permissions: Permission[]): boolean => {
    if (!user) return false
    
    return permissions.some(permission => hasPermission(permission))
  }

  /**
   * Verifica si el usuario tiene todos los permisos especificados (AND)
   */
  const hasAllPermissions = (permissions: Permission[]): boolean => {
    if (!user) return false
    
    return permissions.every(permission => hasPermission(permission))
  }

  /**
   * Verifica si el usuario es admin
   */
  const isAdmin = (): boolean => {
    return user?.rol === 'admin'
  }

  /**
   * Verifica si el usuario es interno o admin
   */
  const isInternoOrAdmin = (): boolean => {
    return user?.rol === 'admin' || user?.rol === 'interno'
  }

  /**
   * Verifica si el usuario puede acceder a un recurso específico
   * (admin puede acceder a todo, usuario solo a sus propios recursos)
   */
  const canAccessResource = (resourceUserId: string): boolean => {
    if (!user) return false
    
    return user.rol === 'admin' || user.id === resourceUserId
  }

  /**
   * Verifica si el usuario puede gestionar usuarios
   */
  const canManageUsers = (): boolean => {
    return hasAnyPermission([Permission.USER_READ_ALL, Permission.ADMIN_DASHBOARD])
  }

  /**
   * Verifica si el usuario puede crear usuarios
   */
  const canCreateUsers = (): boolean => {
    return hasPermission(Permission.USER_CREATE)
  }

  /**
   * Verifica si el usuario puede actualizar usuarios
   */
  const canUpdateUsers = (): boolean => {
    return hasPermission(Permission.USER_UPDATE)
  }

  /**
   * Verifica si el usuario puede eliminar usuarios
   */
  const canDeleteUsers = (): boolean => {
    return hasPermission(Permission.USER_DELETE)
  }

  /**
   * Verifica si el usuario puede acceder al dashboard de admin
   */
  const canAccessAdminDashboard = (): boolean => {
    return hasPermission(Permission.ADMIN_DASHBOARD)
  }

  /**
   * Obtiene todos los permisos del usuario actual
   */
  const getUserPermissions = (): Permission[] => {
    if (!user) return []
    
    return ROLE_PERMISSIONS[user.rol] || []
  }

  /**
   * Verifica si el usuario tiene un rol específico
   */
  const hasRole = (role: string): boolean => {
    return user?.rol === role
  }

  /**
   * Verifica si el usuario tiene cualquiera de los roles especificados
   */
  const hasAnyRole = (roles: string[]): boolean => {
    if (!user) return false
    
    return roles.includes(user.rol)
  }

  return {
    // Funciones de permisos
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    
    // Funciones de roles
    isAdmin,
    isInternoOrAdmin,
    hasRole,
    hasAnyRole,
    
    // Funciones específicas de recursos
    canAccessResource,
    canManageUsers,
    canCreateUsers,
    canUpdateUsers,
    canDeleteUsers,
    canAccessAdminDashboard,
    
    // Utilidades
    getUserPermissions,
    
    // Estado del usuario
    user,
    isAuthenticated: !!user,
  }
}

/**
 * Hook simplificado para verificar permisos específicos
 */
export function usePermission(permission: Permission): boolean {
  const { hasPermission } = usePermissions()
  return hasPermission(permission)
}

/**
 * Hook para verificar roles específicos
 */
export function useRole(role: string): boolean {
  const { hasRole } = usePermissions()
  return hasRole(role)
}
