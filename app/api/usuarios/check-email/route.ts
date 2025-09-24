import { NextRequest, NextResponse } from 'next/server'
import { supabaseRequest } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json(
        { success: false, message: 'Email es requerido' },
        { status: 400 }
      )
    }

    // Verificar si el email existe en la base de datos usando Supabase directamente
    const encodedEmail = encodeURIComponent(email)
    const url = `usuarios?email=eq.${encodedEmail}&select=*`
    
    const response = await supabaseRequest(url)
    const users = await response.json()

    const user = users.length > 0 ? users[0] : null

    return NextResponse.json({
      success: true,
      exists: !!user,
      message: user ? 'Email encontrado' : 'Email no encontrado'
    })

  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
