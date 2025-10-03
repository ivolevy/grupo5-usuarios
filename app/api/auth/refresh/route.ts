/**
 * @openapi
 * /api/auth/refresh:
 *   post:
 *     tags: [auth]
 *     summary: Refresh JWT token
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Token refreshed
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
 *                   example: "Token refrescado exitosamente"
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
 *                     token:
 *                       type: string
 *                       description: New JWT token
 *                     tokenType:
 *                       type: string
 *                       example: "Bearer"
 *                     expiresIn:
 *                       type: string
 *                       example: "24h"
 *       401:
 *         description: Invalid token
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
 *                   example: "Token inválido para refrescar"
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
import { generateJWT } from '@/lib/auth';
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

    // Verificar que el usuario siga existiendo en la base de datos
    const currentUser = await prisma.usuarios.findUnique({ id: user.userId });

    if (!currentUser) {
      return NextResponse.json({
        success: false,
        message: 'Usuario no encontrado'
      }, { status: 404 });
    }

    // Generar nuevo JWT con información actualizada
    const newToken = generateJWT({
      userId: currentUser.id,
      email: currentUser.email,
      rol: currentUser.rol
    });

    return NextResponse.json({
      success: true,
      message: 'Token refrescado exitosamente',
      data: {
        user: currentUser,
        token: newToken,
        tokenType: 'Bearer',
        expiresIn: '24h'
      }
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
