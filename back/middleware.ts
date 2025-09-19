import { NextRequest, NextResponse } from 'next/server';
import { verifyJWT, extractTokenFromHeader, JWTPayload } from '@/lib/auth';
import { logger } from '@/lib/logger';
import { getClientIp } from '@/lib/rate-limiter';

// Rutas que requieren autenticación
const PROTECTED_ROUTES = [
  '/api/auth/me',
  '/api/auth/refresh',
  '/api/usuarios/profile',
  '/api/admin',
];

// Rutas que requieren permisos de admin
const ADMIN_ROUTES = [
  '/api/admin/metrics',
  '/api/admin/logs',
  '/api/admin/system',
];

// Rutas públicas (no requieren autenticación)
const PUBLIC_ROUTES = [
  '/api/auth/login',
  '/api/auth/forgot',
  '/api/auth/reset',
  '/api/auth/verify-code',
  '/api/health',
  '/api/config',
  '/api/test',
  '/api/usuarios', // POST para registro
];

// Rutas que requieren autenticación pero no admin
const AUTHENTICATED_ROUTES = [
  '/api/usuarios/[id]', // GET, PUT, DELETE específicos
];

/**
 * Middleware principal de autenticación para Next.js
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const clientIp = getClientIp(request);
  const userAgent = request.headers.get('user-agent') || 'unknown';

  // Log de la request
  logger.info('Request received', {
    method: request.method,
    path: pathname,
    ip: clientIp,
    userAgent,
    timestamp: new Date().toISOString()
  });

  // Verificar si es una ruta de API
  if (!pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  // Verificar si es una ruta pública
  if (isPublicRoute(pathname)) {
    return NextResponse.next();
  }

  // Verificar autenticación para rutas protegidas
  if (isProtectedRoute(pathname)) {
    const authResult = verifyAuthentication(request);
    
    if (!authResult.success) {
      logger.warn('Unauthorized access attempt', {
        path: pathname,
        ip: clientIp,
        userAgent,
        error: authResult.error
      });

      return NextResponse.json(
        {
          success: false,
          message: authResult.error,
          code: 'UNAUTHORIZED'
        },
        { status: authResult.status || 401 }
      );
    }

    // Verificar permisos de admin si es necesario
    if (isAdminRoute(pathname)) {
      if (!isAdmin(authResult.user!)) {
        logger.warn('Admin access denied', {
          path: pathname,
          ip: clientIp,
          userId: authResult.user?.userId,
          userRole: authResult.user?.rol
        });

        return NextResponse.json(
          {
            success: false,
            message: 'Acceso denegado. Se requieren permisos de administrador.',
            code: 'FORBIDDEN'
          },
          { status: 403 }
        );
      }
    }

    // Agregar información del usuario a los headers para uso en las rutas
    const response = NextResponse.next();
    response.headers.set('x-user-id', authResult.user!.userId);
    response.headers.set('x-user-email', authResult.user!.email);
    response.headers.set('x-user-role', authResult.user!.rol);

    return response;
  }

  return NextResponse.next();
}

/**
 * Verifica la autenticación del usuario
 */
function verifyAuthentication(request: NextRequest): {
  success: boolean;
  user?: JWTPayload;
  error?: string;
  status?: number;
} {
  try {
    // Extraer token del header Authorization
    const authHeader = request.headers.get('authorization');
    const token = extractTokenFromHeader(authHeader);

    if (!token) {
      return {
        success: false,
        error: 'Token de autorización requerido. Incluye el header Authorization: Bearer <token>',
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

    // Verificar que el token no esté expirado
    if (decoded.exp && decoded.exp < Date.now() / 1000) {
      return {
        success: false,
        error: 'Token expirado',
        status: 401
      };
    }

    return {
      success: true,
      user: decoded
    };

  } catch (error) {
    logger.error('Authentication error', {
      error: error instanceof Error ? error.message : 'Unknown error',
      ip: getClientIp(request)
    });

    return {
      success: false,
      error: 'Error al verificar token de autorización',
      status: 500
    };
  }
}

/**
 * Verifica si una ruta es pública
 */
function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some(route => {
    if (route.includes('[') && route.includes(']')) {
      // Para rutas dinámicas como /api/usuarios/[id]
      const pattern = route.replace(/\[.*?\]/g, '[^/]+');
      const regex = new RegExp(`^${pattern}$`);
      return regex.test(pathname);
    }
    return pathname === route || pathname.startsWith(route);
  });
}

/**
 * Verifica si una ruta requiere autenticación
 */
function isProtectedRoute(pathname: string): boolean {
  // Verificar rutas específicas protegidas
  if (PROTECTED_ROUTES.some(route => pathname.startsWith(route))) {
    return true;
  }

  // Verificar rutas autenticadas (como operaciones CRUD en usuarios)
  if (AUTHENTICATED_ROUTES.some(route => {
    if (route.includes('[') && route.includes(']')) {
      const pattern = route.replace(/\[.*?\]/g, '[^/]+');
      const regex = new RegExp(`^${pattern}$`);
      return regex.test(pathname);
    }
    return pathname.startsWith(route);
  })) {
    return true;
  }

  // Verificar si es una operación en usuarios que requiere autenticación
  if (pathname.match(/^\/api\/usuarios\/[^\/]+$/) && 
      !pathname.endsWith('/profile') && 
      !pathname.endsWith('/register')) {
    return true;
  }

  return false;
}

/**
 * Verifica si una ruta requiere permisos de admin
 */
function isAdminRoute(pathname: string): boolean {
  return ADMIN_ROUTES.some(route => pathname.startsWith(route));
}

/**
 * Verifica si el usuario es admin
 */
function isAdmin(user: JWTPayload): boolean {
  return user.rol === 'admin';
}

// Configuración del middleware
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
};
