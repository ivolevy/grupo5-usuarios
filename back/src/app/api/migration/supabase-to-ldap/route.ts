import { NextRequest, NextResponse } from 'next/server';
import { migrateCompleteSupabaseToLDAP } from '../../../../scripts/migrate-complete-supabase-to-ldap';

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 Iniciando migración Supabase → LDAP...');
    
    // Ejecutar migración COMPLETA con TODOS los usuarios
    await migrateCompleteSupabaseToLDAP();
    
    return NextResponse.json({
      success: true,
      message: 'Migración completada exitosamente',
      data: {
        timestamp: new Date().toISOString(),
        source: 'Supabase',
        target: 'LDAP',
        status: 'completed'
      }
    });
    
  } catch (error) {
    console.error('❌ Error en migración:', error);
    
    return NextResponse.json({
      success: false,
      message: 'Error durante la migración',
      error: error instanceof Error ? error.message : 'Error desconocido',
      data: {
        timestamp: new Date().toISOString(),
        source: 'Supabase',
        target: 'LDAP',
        status: 'failed'
      }
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'Endpoint de migración Supabase → LDAP',
    description: 'POST a este endpoint para ejecutar la migración completa',
    usage: {
      method: 'POST',
      endpoint: '/api/migration/supabase-to-ldap',
      description: 'Limpia LDAP y migra todos los usuarios de Supabase'
    },
    warning: 'Esta operación eliminará todos los usuarios existentes en LDAP'
  });
}
