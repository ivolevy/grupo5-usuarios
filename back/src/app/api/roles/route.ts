import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// GET /api/roles - Obtener todos los roles
export async function GET() {
  try {
    const roles = await prisma.roles.findMany({
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
      data: roles,
      count: roles.length
    })
  } catch (error) {
    console.error('Error fetching roles:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Error interno del servidor'
      },
      { status: 500 }
    )
  }
}
