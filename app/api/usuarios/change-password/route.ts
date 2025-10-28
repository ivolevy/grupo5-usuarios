import { NextRequest, NextResponse } from 'next/server'
/**
 * @openapi
 * /api/usuarios/change-password:
 *   post:
 *     tags: [usuarios]
 *     summary: Change user password by email
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, newPassword]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               newPassword:
 *                 type: string
 *                 minLength: 8
 *     responses:
 *       200:
 *         description: Password updated
 *       400:
 *         description: Validation error
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */
import { prisma } from '@/lib/db'
import { hashPassword } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const { email, newPassword } = await request.json()

    if (!email || !newPassword) {
      return NextResponse.json(
        { success: false, message: 'Email y nueva contraseña son requeridos' },
        { status: 400 }
      )
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        { success: false, message: 'La contraseña debe tener al menos 8 caracteres' },
        { status: 400 }
      )
    }

    // Primero verificar que el usuario existe
    const existingUser = await prisma.usuarios.findFirst({ email: email })
    
    if (!existingUser) {
      return NextResponse.json({
        success: false,
        message: 'Usuario no encontrado'
      }, { status: 404 })
    }

    // Hashear la nueva contraseña
    const hashedPassword = await hashPassword(newPassword)

    // Actualizar la contraseña en la base de datos
    await prisma.usuarios.update(
      { id: existingUser.id },
      {
        password: hashedPassword,
        updated_at: new Date().toISOString()
      }
    )

    return NextResponse.json({
      success: true,
      message: 'Contraseña actualizada correctamente'
    })

  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
