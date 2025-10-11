import { NextRequest, NextResponse } from 'next/server';
import { getServices } from '@/lib/database-config';
import { verifyJWTMiddleware } from '@/lib/middleware';

// POST /api/auth/refresh - Refrescar token JWT
export async function POST(request: NextRequest) {
  try {
    // Verificar JWT actual
    const authResult = verifyJWTMiddleware(request);
    
    if (!authResult.success) {
      return NextResponse.json({
        success: false,
        message: 'Token inválido para refrescar'
      }, { status: 401 });
    }

    const { user } = authResult;
    
    if (!user) {
      return NextResponse.json({
        success: false,
        message: 'Usuario no encontrado en el token'
      }, { status: 401 });
    }

    // Obtener servicios (LDAP o Supabase según configuración)
    const { authService } = await getServices();

    // Extraer token del header Authorization
    const authHeader = request.headers.get('authorization');
    const token = authService.extractTokenFromHeader(authHeader);

    if (!token) {
      return NextResponse.json({
        success: false,
        message: 'Token no encontrado en el header'
      }, { status: 401 });
    }

    // Refrescar token usando el servicio de autenticación
    const authResponse = await authService.refreshToken(token);

    return NextResponse.json({
      success: true,
      message: 'Token refrescado exitosamente',
      data: authResponse
    });

  } catch (error) {
    console.error('Error al refrescar token:', error);
    return NextResponse.json({
      success: false,
      message: 'Error interno del servidor',
      error: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
}
