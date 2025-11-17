/**
 * Endpoint para obtener las nacionalidades únicas de los usuarios en LDAP
 */

import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/auth'
import { prisma } from '@/lib/ldap-client'

export async function GET(request: NextRequest) {
  try {
    // Verificar autenticación
    const authResult = await verifyAuth(request)
    if (!authResult.authenticated || !authResult.user) {
      return NextResponse.json(
        { success: false, message: 'No autorizado' },
        { status: 401 }
      )
    }

    // Solo admin puede acceder a esta información
    if (authResult.user.rol !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Acceso denegado. Se requiere rol de administrador.' },
        { status: 403 }
      )
    }

    // Obtener todos los usuarios de LDAP
    const users = await prisma.usuarios.findMany({})

    // Extraer nacionalidades únicas, filtrando valores vacíos o nulos
    const nationalities = new Set<string>()
    
    users.forEach(user => {
      if (user.nacionalidad && user.nacionalidad.trim() !== '') {
        nationalities.add(user.nacionalidad)
      }
    })

    // Convertir a array y ordenar alfabéticamente
    const sortedNationalities = Array.from(nationalities).sort()

    return NextResponse.json({
      success: true,
      data: sortedNationalities
    })
  } catch (error) {
    console.error('Error fetching nationalities:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: 'Error al obtener nacionalidades',
        error: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}

