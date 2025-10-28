import { NextRequest, NextResponse } from 'next/server'
/**
 * @openapi
 * /api/usuarios/get-password:
 *   post:
 *     tags: [usuarios]
 *     summary: Check if newPassword equals current password or exists
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               newPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password comparison or presence
 *       400:
 *         description: Validation error
 *       500:
 *         description: Internal server error
 */
import { prisma } from '@/lib/db'
import { verifyPassword } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const { email, newPassword } = await request.json()

    if (!email) {
      return NextResponse.json(
        { success: false, message: 'Email es requerido' },
        { status: 400 }
      )
    }

    // Obtener la contraseña actual del usuario
    const user = await prisma.usuarios.findFirst({ email: email })

    if (!user) {
      return NextResponse.json({
        success: false,
        message: 'Usuario no encontrado'
      })
    }

    // Si se proporciona una nueva contraseña, compararla con la actual
    if (newPassword) {
      const isSamePassword = await verifyPassword(newPassword, user.password)
      
      return NextResponse.json({
        success: true,
        isSamePassword
      })
    }

    // Si no se proporciona nueva contraseña, solo devolver que existe
    return NextResponse.json({
      success: true,
      hasPassword: !!user.password
    })

  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
