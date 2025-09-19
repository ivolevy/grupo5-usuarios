/**
 * Ejemplos de uso del middleware de autenticación
 * Este archivo muestra cómo implementar el middleware en diferentes tipos de rutas API
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAuth, verifyJWTMiddleware, requirePermission, Permission } from '@/lib/middleware';
import { prisma } from '@/lib/db';

// ========================================
// EJEMPLO 1: Ruta que requiere autenticación básica
// ========================================

export async function GET_PROTECTED_ROUTE(request: NextRequest) {
  // Verificar autenticación manualmente
  const authResult = verifyJWTMiddleware(request);
  
  if (!authResult.success || !authResult.user) {
    return NextResponse.json(
      { success: false, message: authResult.error },
      { status: authResult.status || 401 }
    );
  }

  const user = authResult.user;
  
  // Lógica de la ruta aquí
  return NextResponse.json({
    success: true,
    data: { message: `Hola ${user.email}` }
  });
}

// ========================================
// EJEMPLO 2: Ruta con wrapper withAuth (recomendado)
// ========================================

async function getUserProfileHandler(request: NextRequest) {
  const user = (request as any).user; // Usuario ya verificado por withAuth
  
  const profile = await prisma.usuarios.findUnique({
    where: { id: user.userId }
  });

  return NextResponse.json({
    success: true,
    data: profile
  });
}

// Aplicar middleware con withAuth
export const GET_PROFILE = withAuth(getUserProfileHandler, {
  requireAuth: true
});

// ========================================
// EJEMPLO 3: Ruta que requiere permisos específicos
// ========================================

async function getAdminMetricsHandler(request: NextRequest) {
  const user = (request as any).user;
  
  // Lógica para obtener métricas de admin
  const metrics = {
    totalUsers: await prisma.usuarios.count(),
    adminUsers: await prisma.usuarios.count({ where: { rol: 'admin' } })
  };

  return NextResponse.json({
    success: true,
    data: metrics
  });
}

// Aplicar middleware con permisos de admin
export const GET_ADMIN_METRICS = withAuth(getAdminMetricsHandler, {
  requireAuth: true,
  requiredPermissions: [Permission.ADMIN_DASHBOARD]
});

// ========================================
// EJEMPLO 4: Ruta que permite acceso propio o admin
// ========================================

async function updateUserHandler(request: NextRequest, context: { params: { id: string } }) {
  const user = (request as any).user;
  const userId = context.params.id;
  
  // Verificar que el usuario puede acceder a este recurso
  if (user.rol !== 'admin' && user.userId !== userId) {
    return NextResponse.json(
      { success: false, message: 'No tienes permisos para acceder a este recurso' },
      { status: 403 }
    );
  }

  const body = await request.json();
  
  // Actualizar usuario
  const updatedUser = await prisma.usuarios.update({
    where: { id: userId },
    data: body
  });

  return NextResponse.json({
    success: true,
    data: updatedUser
  });
}

// Aplicar middleware con acceso a recursos propios
export const PUT_USER = withAuth(updateUserHandler, {
  requireAuth: true,
  allowSelfAccess: true
});

// ========================================
// EJEMPLO 5: Ruta con múltiples permisos (OR)
// ========================================

async function manageUsersHandler(request: NextRequest) {
  const user = (request as any).user;
  
  // Solo admin o moderador pueden gestionar usuarios
  const users = await prisma.usuarios.findMany({
    select: {
      id: true,
      nombre_completo: true,
      email: true,
      rol: true,
      created_at: true
    }
  });

  return NextResponse.json({
    success: true,
    data: users
  });
}

// Aplicar middleware con permisos OR
export const GET_USERS = withAuth(manageUsersHandler, {
  requireAuth: true,
  requireAnyPermission: [Permission.USER_READ_ALL, Permission.ADMIN_DASHBOARD]
});

// ========================================
// EJEMPLO 6: Ruta pública (sin autenticación)
// ========================================

async function publicInfoHandler(request: NextRequest) {
  return NextResponse.json({
    success: true,
    data: {
      message: 'Esta es información pública',
      timestamp: new Date().toISOString()
    }
  });
}

// Aplicar middleware sin autenticación
export const GET_PUBLIC_INFO = withAuth(publicInfoHandler, {
  requireAuth: false
});

// ========================================
// EJEMPLO 7: Ruta con verificación manual de permisos
// ========================================

async function advancedUserManagementHandler(request: NextRequest) {
  const user = (request as any).user;
  
  // Verificar permisos específicos manualmente
  if (!requirePermission(user, Permission.USER_DELETE)) {
    return NextResponse.json(
      { success: false, message: 'No tienes permisos para eliminar usuarios' },
      { status: 403 }
    );
  }

  // Solo admin puede eliminar otros admins
  if (user.rol !== 'admin') {
    return NextResponse.json(
      { success: false, message: 'Solo los administradores pueden eliminar usuarios' },
      { status: 403 }
    );
  }

  // Lógica para eliminar usuario
  const { userId } = await request.json();
  
  await prisma.usuarios.delete({
    where: { id: userId }
  });

  return NextResponse.json({
    success: true,
    message: 'Usuario eliminado exitosamente'
  });
}

// Aplicar middleware básico
export const DELETE_USER = withAuth(advancedUserManagementHandler, {
  requireAuth: true
});

// ========================================
// EJEMPLO 8: Ruta con logging personalizado
// ========================================

async function loggedActionHandler(request: NextRequest) {
  const user = (request as any).user;
  
  // Log de la acción
  console.log(`Usuario ${user.email} ejecutó acción en ${new Date().toISOString()}`);
  
  return NextResponse.json({
    success: true,
    data: { action: 'completed', userId: user.userId }
  });
}

// Aplicar middleware con logging
export const POST_LOGGED_ACTION = withAuth(loggedActionHandler, {
  requireAuth: true
});

// ========================================
// GUÍA DE USO:
// ========================================

/*
1. Para rutas que requieren autenticación básica:
   export const GET = withAuth(handler, { requireAuth: true });

2. Para rutas que requieren permisos específicos:
   export const GET = withAuth(handler, { 
     requireAuth: true,
     requiredPermissions: [Permission.ADMIN_DASHBOARD]
   });

3. Para rutas que requieren cualquiera de varios permisos:
   export const GET = withAuth(handler, {
     requireAuth: true,
     requireAnyPermission: [Permission.USER_READ, Permission.ADMIN_DASHBOARD]
   });

4. Para rutas que requieren todos los permisos:
   export const GET = withAuth(handler, {
     requireAuth: true,
     requireAllPermissions: [Permission.USER_READ, Permission.USER_UPDATE]
   });

5. Para rutas que permiten acceso a recursos propios:
   export const PUT = withAuth(handler, {
     requireAuth: true,
     allowSelfAccess: true
   });

6. Para rutas públicas:
   export const GET = withAuth(handler, { requireAuth: false });

7. Para verificación manual de permisos dentro del handler:
   const user = (request as any).user;
   if (!requirePermission(user, Permission.SPECIFIC_PERMISSION)) {
     return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
   }
*/
