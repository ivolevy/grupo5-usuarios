import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// GET /api/usuario-grupos - Obtener todas las relaciones usuario-grupo
export async function GET() {
  try {
    const usuarioGrupos = await prisma.usuarioGrupos.findMany({
      include: {
        usuario: {
          select: {
            id: true,
            nombre: true,
            email: true
          }
        },
        grupo: {
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
      data: usuarioGrupos,
      count: usuarioGrupos.length
    })
  } catch (error) {
    console.error('Error fetching usuario-grupos:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Error interno del servidor'
      },
      { status: 500 }
    )
  }
}
