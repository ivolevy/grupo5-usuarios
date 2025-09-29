import { NextRequest, NextResponse } from 'next/server';
import { debugProblematicUsers } from '../../../../scripts/debug-problematic-users';

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 Iniciando diagnóstico de usuarios problemáticos...');
    
    // Ejecutar diagnóstico
    await debugProblematicUsers();
    
    return NextResponse.json({
      success: true,
      message: 'Diagnóstico de usuarios problemáticos completado',
      data: {
        timestamp: new Date().toISOString(),
        action: 'debug_problematic_users',
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
        action: 'debug_problematic_users',
        status: 'failed'
      }
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'Endpoint de diagnóstico de usuarios problemáticos',
    description: 'POST a este endpoint para diagnosticar usuarios que fallan en migración',
    usage: {
      method: 'POST',
      endpoint: '/api/migration/debug-problematic',
      description: 'Diagnostica admin@test.com y pepito@gmail.com'
    }
  });
}
