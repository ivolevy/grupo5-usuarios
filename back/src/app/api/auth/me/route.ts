import { NextRequest, NextResponse } from 'next/server';
import { verifyJWTMiddleware } from '@/lib/middleware';
import { getServices } from '@/lib/database-config';

// GET /api/auth/me - Obtener información del usuario autenticado
export async function GET(request: NextRequest) {
  try {
    // Verificar JWT
    const authResult = verifyJWTMiddleware(request);
    
    if (!authResult.success) {
      return NextResponse.json({
        success: false,
        message: authResult.error
      }, { status: authResult.status || 401 });
    }

    const { user } = authResult;
    
    if (!user) {
      return NextResponse.json({
        success: false,
        message: 'Usuario no encontrado en el token'
      }, { status: 401 });
    }

    // Obtener servicios (LDAP o Supabase según configuración)
    const { userRepository } = await getServices();

    // Obtener información actualizada del usuario
    const currentUser = await userRepository.findById(user.userId);

    if (!currentUser) {
      return NextResponse.json({
        success: false,
        message: 'Usuario no encontrado'
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Información del usuario obtenida exitosamente',
      data: {
        user: currentUser.toPlainObject(),
        tokenInfo: {
          userId: user.userId,
          email: user.email,
          rol: user.rol,
          iat: user.iat,
          exp: user.exp
        }
      }
    });

  } catch (error) {
    console.error('Error al obtener información del usuario:', error);
    return NextResponse.json({
      success: false,
      message: 'Error interno del servidor',
      error: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
}
