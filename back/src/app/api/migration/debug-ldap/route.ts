import { NextRequest, NextResponse } from 'next/server';
import { debugLDAPMigration } from '../../../../scripts/debug-ldap-migration';

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 Iniciando diagnóstico LDAP...');
    
    // Ejecutar diagnóstico
    await debugLDAPMigration();
    
    return NextResponse.json({
      success: true,
      message: 'Diagnóstico completado exitosamente',
      data: {
        timestamp: new Date().toISOString(),
        action: 'debug_ldap_migration',
        status: 'completed'
      }
    });
    
  } catch (error) {
    console.error('❌ Error en diagnóstico:', error);
    
    return NextResponse.json({
      success: false,
      message: 'Error durante el diagnóstico',
      error: error instanceof Error ? error.message : 'Error desconocido',
      data: {
        timestamp: new Date().toISOString(),
        action: 'debug_ldap_migration',
        status: 'failed'
      }
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'Endpoint de diagnóstico LDAP',
    description: 'POST a este endpoint para ejecutar diagnóstico de migración LDAP',
    usage: {
      method: 'POST',
      endpoint: '/api/migration/debug-ldap',
      description: 'Identifica problemas en la migración LDAP'
    }
  });
}
