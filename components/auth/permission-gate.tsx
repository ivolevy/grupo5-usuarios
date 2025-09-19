"use client"

import { ReactNode } from "react"
import { usePermissions, Permission } from "@/hooks/use-permissions"
import { AccessDenied } from "@/components/ui/access-denied"

interface PermissionGateProps {
  children: ReactNode
  permission?: Permission
  permissions?: Permission[]
  requireAll?: boolean // true = AND, false = OR
  role?: string
  roles?: string[]
  requireAnyRole?: boolean // true = OR, false = AND
  fallback?: ReactNode
  showAccessDenied?: boolean
}

/**
 * Componente que renderiza contenido basado en permisos del usuario
 */
export function PermissionGate({
  children,
  permission,
  permissions = [],
  requireAll = false,
  role,
  roles = [],
  requireAnyRole = false,
  fallback = null,
  showAccessDenied = true,
}: PermissionGateProps) {
  const {
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    hasRole,
    hasAnyRole,
    isAuthenticated,
  } = usePermissions()

  // Si no está autenticado, mostrar fallback o acceso denegado
  if (!isAuthenticated) {
    return showAccessDenied ? <AccessDenied /> : <>{fallback}</>
  }

  // Verificar permisos específicos
  if (permission) {
    if (!hasPermission(permission)) {
      return showAccessDenied ? <AccessDenied /> : <>{fallback}</>
    }
  }

  // Verificar múltiples permisos
  if (permissions.length > 0) {
    const hasRequiredPermissions = requireAll
      ? hasAllPermissions(permissions)
      : hasAnyPermission(permissions)

    if (!hasRequiredPermissions) {
      return showAccessDenied ? <AccessDenied /> : <>{fallback}</>
    }
  }

  // Verificar rol específico
  if (role) {
    if (!hasRole(role)) {
      return showAccessDenied ? <AccessDenied /> : <>{fallback}</>
    }
  }

  // Verificar múltiples roles
  if (roles.length > 0) {
    const hasRequiredRole = requireAnyRole
      ? hasAnyRole(roles)
      : roles.every(r => hasRole(r))

    if (!hasRequiredRole) {
      return showAccessDenied ? <AccessDenied /> : <>{fallback}</>
    }
  }

  // Si pasa todas las verificaciones, renderizar el contenido
  return <>{children}</>
}

/**
 * Componente simplificado para verificar un permiso específico
 */
export function RequirePermission({
  children,
  permission,
  fallback = null,
}: {
  children: ReactNode
  permission: Permission
  fallback?: ReactNode
}) {
  return (
    <PermissionGate permission={permission} fallback={fallback}>
      {children}
    </PermissionGate>
  )
}

/**
 * Componente simplificado para verificar un rol específico
 */
export function RequireRole({
  children,
  role,
  fallback = null,
}: {
  children: ReactNode
  role: string
  fallback?: ReactNode
}) {
  return (
    <PermissionGate role={role} fallback={fallback}>
      {children}
    </PermissionGate>
  )
}

/**
 * Componente para verificar si el usuario es admin
 */
export function RequireAdmin({
  children,
  fallback = null,
}: {
  children: ReactNode
  fallback?: ReactNode
}) {
  return (
    <PermissionGate role="admin" fallback={fallback}>
      {children}
    </PermissionGate>
  )
}

/**
 * Componente para verificar si el usuario puede gestionar usuarios
 */
export function RequireUserManagement({
  children,
  fallback = null,
}: {
  children: ReactNode
  fallback?: ReactNode
}) {
  return (
    <PermissionGate
      permissions={[Permission.USER_READ_ALL, Permission.ADMIN_DASHBOARD]}
      requireAll={false}
      fallback={fallback}
    >
      {children}
    </PermissionGate>
  )
}

/**
 * Componente para verificar si el usuario puede acceder al dashboard de admin
 */
export function RequireAdminDashboard({
  children,
  fallback = null,
}: {
  children: ReactNode
  fallback?: ReactNode
}) {
  return (
    <PermissionGate
      permission={Permission.ADMIN_DASHBOARD}
      fallback={fallback}
    >
      {children}
    </PermissionGate>
  )
}
