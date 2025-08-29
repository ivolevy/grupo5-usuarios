import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// GET /api/usuarios - Obtener todos los usuarios
export async function GET() {
  try {
    const usuarios = await prisma.usuarios.findMany({
      include: {
        grupos: {
          include: {
            grupo: true
          }
        },
        roles: {
          include: {
            rol: true
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      data: usuarios,
      count: usuarios.length
    })
  } catch (error) {
    console.error('Error fetching usuarios:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Error interno del servidor'
      },
      { status: 500 }
    )
  }
}
