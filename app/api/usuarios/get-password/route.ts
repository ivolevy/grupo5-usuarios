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
import { supabaseRequest } from '@/lib/supabase'
import bcrypt from 'bcryptjs'

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
    const encodedEmail = encodeURIComponent(email)
    const url = `usuarios?email=eq.${encodedEmail}&select=password`
    
    const response = await supabaseRequest(url)
    const users = await response.json()

    if (users.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'Usuario no encontrado'
      })
    }

    const user = users[0]

    // Si se proporciona una nueva contraseña, compararla con la actual
    if (newPassword) {
      const isSamePassword = await bcrypt.compare(newPassword, user.password)
      
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
