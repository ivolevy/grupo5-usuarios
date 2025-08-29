import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// GET /api/all-data - Obtener todos los datos de todas las tablas
export async function GET() {
  try {
    const [usuarios, roles, grupos, usuarioGrupos, usuarioRoles] = await Promise.all([
      prisma.usuarios.findMany({
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
      }),
      prisma.roles.findMany({
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
      }),
      prisma.grupos.findMany({
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
      }),
      prisma.usuarioGrupos.findMany({
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
      }),
      prisma.usuarioRoles.findMany({
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
    ])

    return NextResponse.json({
      success: true,
      data: {
        usuarios: {
          data: usuarios,
          count: usuarios.length
        },
        roles: {
          data: roles,
          count: roles.length
        },
        grupos: {
          data: grupos,
          count: grupos.length
        },
        usuarioGrupos: {
          data: usuarioGrupos,
          count: usuarioGrupos.length
        },
        usuarioRoles: {
          data: usuarioRoles,
          count: usuarioRoles.length
        }
      },
      totalCounts: {
        usuarios: usuarios.length,
        roles: roles.length,
        grupos: grupos.length,
        usuarioGrupos: usuarioGrupos.length,
        usuarioRoles: usuarioRoles.length
      }
    })
  } catch (error) {
    console.error('Error fetching all data:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Error interno del servidor'
      },
      { status: 500 }
    )
  }
}
