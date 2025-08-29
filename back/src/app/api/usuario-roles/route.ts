import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// GET /api/usuario-roles - Obtener todas las relaciones usuario-rol
export async function GET() {
  try {
    const usuarioRoles = await prisma.usuarioRoles.findMany({
      include: {
        usuario: {
          select: {
            id: true,
            nombre: true,
            email: true
          }
        },
        rol: {
          select: {
            id: true,
            nombre: true,
            descripcion: true
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      data: usuarioRoles,
      count: usuarioRoles.length
    })
  } catch (error) {
    console.error('Error fetching usuario-roles:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Error interno del servidor'
      },
      { status: 500 }
    )
  }
}
