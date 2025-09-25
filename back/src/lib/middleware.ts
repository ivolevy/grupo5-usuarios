import { NextRequest, NextResponse } from 'next/server';
import { verifyJWT, extractTokenFromHeader, JWTPayload } from '@/lib/auth';
import { logger } from '@/lib/logger';
import { getClientIp } from '@/lib/rate-limiter';
import { hasPermission, Permission } from '@/lib/permissions';

// Re-exportar enum para uso externo
export { Permission } from '@/lib/permissions';

// Extender el tipo Request para incluir user
declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload;
    }
  }
}

/**
 * Middleware para verificar JWT en las requests
 * @param request - Request de Next.js
 * @returns NextResponse | null - Response de error si el token es inválido, null si es válido
 */
export function verifyJWTMiddleware(request: NextRequest): { 
  success: boolean; 
  user?: JWTPayload; 
  error?: string; 
  status?: number 
} {
  const clientIp = getClientIp(request);
  const userAgent = request.headers.get('user-agent') || 'unknown';

  try {
    // Extraer token del header Authorization
    const authHeader = request.headers.get('authorization');
    const token = extractTokenFromHeader(authHeader);

    if (!token) {
      logger.warn('Missing authorization token', {
        action: 'missing_token',
        ip: clientIp,
        userAgent,
        data: {
          path: request.nextUrl.pathname
        }
      });

      return {
        success: false,
        error: 'Token de autorización requerido',
        status: 401
      };
    }

    // Verificar el token
    const decoded = verifyJWT(token);

    if (!decoded) {
      logger.warn('Invalid or expired token', {
        action: 'invalid_token',
        ip: clientIp,
        userAgent,
        data: {
          path: request.nextUrl.pathname
        }
      });

      return {
        success: false,
        error: 'Token de autorización inválido o expirado',
        status: 401
      };
    }

    // Verificar que el token no esté expirado
    if (decoded.exp && decoded.exp < Date.now() / 1000) {
      logger.warn('Expired token used', {
        action: 'expired_token',
        ip: clientIp,
        userId: decoded.userId,
        userAgent,
        data: {
          path: request.nextUrl.pathname
        }
      });

      return {
        success: false,
        error: 'Token expirado',
        status: 401
      };
    }

    logger.info('Successful authentication', {
      action: 'auth_success',
      ip: clientIp,
      userId: decoded.userId,
      data: {
        userRole: decoded.rol,
        path: request.nextUrl.pathname
      }
    });

    return {
      success: true,
      user: decoded
    };

  } catch (error) {
    logger.error('Authentication middleware error', {
      action: 'auth_error',
      ip: clientIp,
      userAgent,
      data: {
        error: error instanceof Error ? error.message : 'Unknown error',
        path: request.nextUrl.pathname
      }
    });

    return {
      success: false,
      error: 'Error al verificar token de autorización',
      status: 500
    };
  }
}

/**
 * Middleware para verificar si el usuario tiene un rol específico
 * @param user - Usuario decodificado del JWT
 * @param requiredRoles - Roles requeridos
 * @returns boolean - true si tiene permisos, false si no
 */
export function checkUserRole(user: JWTPayload, requiredRoles: string[]): boolean {
  return requiredRoles.includes(user.rol);
}

/**
 * Middleware para verificar si el usuario es admin
 * @param user - Usuario decodificado del JWT
 * @returns boolean - true si es admin, false si no
 */
export function requireAdmin(user: JWTPayload): boolean {
  return user.rol === 'admin';
}

/**
 * Middleware para verificar si el usuario puede acceder a un recurso
 * (admin puede acceder a todo, usuario solo a sus propios recursos)
 * @param user - Usuario decodificado del JWT
 * @param resourceUserId - ID del usuario dueño del recurso
 * @returns boolean - true si puede acceder, false si no
 */
export function canAccessResource(user: JWTPayload, resourceUserId: string): boolean {
  return user.rol === 'admin' || user.userId === resourceUserId;
}

/**
 * Middleware para verificar permisos específicos
 * @param user - Usuario decodificado del JWT
 * @param permission - Permiso requerido
 * @returns boolean - true si tiene el permiso, false si no
 */
export function requirePermission(user: JWTPayload, permission: Permission): boolean {
  return hasPermission(user.rol, permission);
}

/**
 * Middleware para verificar múltiples permisos (OR)
 * @param user - Usuario decodificado del JWT
 * @param permissions - Array de permisos requeridos
 * @returns boolean - true si tiene al menos uno de los permisos
 */
export function requireAnyPermission(user: JWTPayload, permissions: Permission[]): boolean {
  return permissions.some(permission => hasPermission(user.rol, permission));
}

/**
 * Middleware para verificar múltiples permisos (AND)
 * @param user - Usuario decodificado del JWT
 * @param permissions - Array de permisos requeridos
 * @returns boolean - true si tiene todos los permisos
 */
export function requireAllPermissions(user: JWTPayload, permissions: Permission[]): boolean {
  return permissions.every(permission => hasPermission(user.rol, permission));
}

/**
 * Wrapper para rutas API que requieren autenticación
 * @param handler - Función handler de la ruta
 * @param options - Opciones de autenticación
 * @returns Función wrapper
 */
export function withAuth(
  handler: (request: NextRequest, context?: any) => Promise<NextResponse>,
  options: {
    requireAuth?: boolean;
    requiredPermissions?: Permission[];
    requireAnyPermissionList?: Permission[];
    requireAllPermissionsList?: Permission[];
    allowSelfAccess?: boolean;
  } = {}
) {
  return async (request: NextRequest, context?: any): Promise<NextResponse> => {
    const {
      requireAuth = true,
      requiredPermissions = [],
      requireAnyPermissionList = [],
      requireAllPermissionsList = [],
      allowSelfAccess = false
    } = options;

    // Si no requiere autenticación, ejecutar directamente
    if (!requireAuth) {
      return handler(request, context);
    }

    // Verificar autenticación
    const authResult = verifyJWTMiddleware(request);
    
    if (!authResult.success || !authResult.user) {
      return NextResponse.json(
        {
          success: false,
          message: authResult.error || 'Authentication required',
          code: 'UNAUTHORIZED'
        },
        { status: authResult.status || 401 }
      );
    }

    const user = authResult.user;

    // Verificar permisos específicos
    if (requiredPermissions.length > 0) {
      if (!requireAllPermissions(user, requiredPermissions)) {
        logger.warn('Insufficient permissions', {
          action: 'insufficient_permissions',
          userId: user.userId,
          data: {
            userRole: user.rol,
            requiredPermissions,
            path: request.nextUrl.pathname
          }
        });

        return NextResponse.json(
          {
            success: false,
            message: 'Permisos insuficientes',
            code: 'FORBIDDEN'
          },
          { status: 403 }
        );
      }
    }

    // Verificar permisos OR
    if (requireAnyPermissionList.length > 0) {
      if (!requireAnyPermission(user, requireAnyPermissionList)) {
        logger.warn('Missing required permissions (OR)', {
          action: 'missing_permissions_or',
          userId: user.userId,
          data: {
            userRole: user.rol,
            requiredPermissions: requireAnyPermissionList,
            path: request.nextUrl.pathname
          }
        });

        return NextResponse.json(
          {
            success: false,
            message: 'Permisos insuficientes',
            code: 'FORBIDDEN'
          },
          { status: 403 }
        );
      }
    }

    // Verificar permisos AND
    if (requireAllPermissionsList.length > 0) {
      if (!requireAllPermissions(user, requireAllPermissionsList)) {
        logger.warn('Missing required permissions (AND)', {
          action: 'missing_permissions_and',
          userId: user.userId,
          data: {
            userRole: user.rol,
            requiredPermissions: requireAllPermissionsList,
            path: request.nextUrl.pathname
          }
        });

        return NextResponse.json(
          {
            success: false,
            message: 'Permisos insuficientes',
            code: 'FORBIDDEN'
          },
          { status: 403 }
        );
      }
    }

    // Verificar acceso a recursos propios si es necesario
    if (allowSelfAccess && context?.params?.id) {
      if (!canAccessResource(user, context.params.id)) {
        logger.warn('Resource access denied', {
          action: 'resource_access_denied',
          userId: user.userId,
          data: {
            userRole: user.rol,
            resourceId: context.params.id,
            path: request.nextUrl.pathname
          }
        });

        return NextResponse.json(
          {
            success: false,
            message: 'No tienes permisos para acceder a este recurso',
            code: 'FORBIDDEN'
          },
          { status: 403 }
        );
      }
    }

    // Agregar información del usuario al request para uso en el handler
    (request as any).user = user;

    // Ejecutar el handler original
    return handler(request, context);
  };
}

/**
 * Middleware para logging de requests
 * @param request - Request de Next.js
 * @param response - Response de Next.js
 */
export function logRequest(request: NextRequest, response: NextResponse) {
  const clientIp = getClientIp(request);
  const userAgent = request.headers.get('user-agent') || 'unknown';
  const userId = (request as any).user?.userId || 'anonymous';

  logger.info('API request completed', {
    action: 'request_completed',
    ip: clientIp,
    userId,
    userAgent,
    data: {
      method: request.method,
      path: request.nextUrl.pathname,
      status: response.status,
      timestamp: new Date().toISOString()
    }
  });
}
