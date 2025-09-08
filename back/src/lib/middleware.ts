import { NextRequest, NextResponse } from 'next/server';
import { verifyJWT, extractTokenFromHeader, JWTPayload } from '@/lib/auth';

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
  try {
    // Extraer token del header Authorization
    const authHeader = request.headers.get('authorization');
    const token = extractTokenFromHeader(authHeader);

    if (!token) {
      return {
        success: false,
        error: 'Token de autorización requerido',
        status: 401
      };
    }

    // Verificar el token
    const decoded = verifyJWT(token);

    if (!decoded) {
      return {
        success: false,
        error: 'Token de autorización inválido o expirado',
        status: 401
      };
    }

    return {
      success: true,
      user: decoded
    };

  } catch (error) {
    console.error('Error en middleware JWT:', error);
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
