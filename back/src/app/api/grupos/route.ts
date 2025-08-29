import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// GET /api/grupos - Obtener todos los grupos
export async function GET() {
  try {
    const grupos = await prisma.grupos.findMany({
      include: {
        usuarios: {
          include: {
            usuario: {
              select: {
                id: true,
                nombre: true,
                email: true
              }
            }
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      data: grupos,
      count: grupos.length
    })
  } catch (error) {
    console.error('Error fetching grupos:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Error interno del servidor'
      },
      { status: 500 }
    )
  }
}
