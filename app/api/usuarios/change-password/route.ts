import { NextRequest, NextResponse } from 'next/server'
import { supabaseRequest } from '@/lib/supabase'
import bcrypt from 'bcryptjs'

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
    const encodedEmail = encodeURIComponent(email)
    const checkUrl = `usuarios?email=eq.${encodedEmail}&select=id,email`
    
    const checkResponse = await supabaseRequest(checkUrl)
    const users = await checkResponse.json()
    
    if (users.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'Usuario no encontrado'
      }, { status: 404 })
    }

    // Hashear la nueva contraseña
    const saltRounds = 10
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds)

    // Actualizar la contraseña en la base de datos
    const updateUrl = `usuarios?email=eq.${encodedEmail}`
    
    const updateResponse = await supabaseRequest(updateUrl, {
      method: 'PATCH',
      body: JSON.stringify({
        password: hashedPassword,
        updated_at: new Date().toISOString()
      }),
      headers: {
        'Prefer': 'return=representation'
      }
    })

    await updateResponse.json()

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
