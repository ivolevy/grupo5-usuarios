/**
 * @openapi
 * /api/auth/me:
 *   get:
 *     tags: [auth]
 *     summary: Get authenticated user info
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User info
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Información del usuario obtenida exitosamente"
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                         email:
 *                           type: string
 *                           format: email
 *                         rol:
 *                           type: string
 *                           enum: [admin, interno, usuario]
 *                         email_verified:
 *                           type: boolean
 *                         created_at:
 *                           type: string
 *                           format: date-time
 *                         last_login_at:
 *                           type: string
 *                           format: date-time
 *                     tokenInfo:
 *                       type: object
 *                       properties:
 *                         userId:
 *                           type: string
 *                         email:
 *                           type: string
 *                         rol:
 *                           type: string
 *                         iat:
 *                           type: number
 *                         exp:
 *                           type: number
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Token inválido o expirado"
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Usuario no encontrado"
 *       500:
 *         description: Internal server error
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyJWTMiddleware } from '@/lib/middleware';

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

    // Obtener información actualizada del usuario
    const currentUser = await prisma.usuarios.findUnique({ id: user.userId });

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
        user: currentUser,
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
