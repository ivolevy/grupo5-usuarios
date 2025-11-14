import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// GET /api/usuarios/check-email?email=example@email.com
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json({
        success: false,
        message: 'Email es requerido'
      }, { status: 400 });
    }

    // Buscar si existe un usuario con ese email
    const existingUser = await prisma.usuarios.findFirst({
      where: { email: email }
    });

    return NextResponse.json({
      success: true,
      exists: !!existingUser
    });
  } catch (error) {
    console.error('Error al verificar email:', error);
    return NextResponse.json({
      success: false,
      message: 'Error al verificar email',
      error: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
}
