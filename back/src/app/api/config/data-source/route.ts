import { NextRequest, NextResponse } from 'next/server';
import { UserRepositoryFactory, RepositoryType } from '../../../../infrastructure/repositories/user-repository-factory';

// GET /api/config/data-source - Obtener configuración actual de fuente de datos
export async function GET() {
  try {
    const currentType = UserRepositoryFactory.getCurrentType();
    
    return NextResponse.json({
      success: true,
      data: {
        current_source: currentType,
        available_sources: ['supabase', 'hybrid'],
        description: {
          supabase: 'Solo Supabase (base de datos tradicional)',
          hybrid: 'LDAP como fuente principal, Supabase como fallback'
        },
        ldap_config: {
          url: process.env.LDAP_URL || 'ldap://35.184.48.90:389',
          base_dn: process.env.LDAP_BASE_DN || 'dc=empresa,dc=local',
          users_ou: process.env.LDAP_USERS_OU || 'ou=users,dc=empresa,dc=local',
          status: 'configured'
        }
      }
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// POST /api/config/data-source - Cambiar fuente de datos
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { source } = body;

    if (!source || !['supabase', 'hybrid'].includes(source)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid source. Must be "supabase" or "hybrid"'
      }, { status: 400 });
    }

    // Reset factory para forzar recreación con nuevo tipo
    UserRepositoryFactory.reset();
    
    // Crear nuevo repositorio con el tipo especificado
    const repository = UserRepositoryFactory.createRepository(source as RepositoryType);
    
    return NextResponse.json({
      success: true,
      message: `Data source changed to: ${source}`,
      data: {
        new_source: source,
        previous_source: UserRepositoryFactory.getCurrentType(),
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

