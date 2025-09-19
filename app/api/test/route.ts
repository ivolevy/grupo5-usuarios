/**
 * @openapi
 * /api/test:
 *   get:
 *     tags: [test]
 *     summary: Test DB connectivity and Supabase API
 *     responses:
 *       200:
 *         description: All tests passed
 *       500:
 *         description: Some tests failed
 */
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { supabaseRequest, supabaseConfig } from '@/lib/supabase';

export async function GET() {
  try {
    console.log('🔄 Probando conexión a la base de datos...');
    
    // Test 1: Conexión básica con Prisma
    let prismaResult = null;
    let prismaError = null;
    
    try {
      // Simular query raw con count
      const count = await prisma.usuarios.count();
      prismaResult = { test: 1, method: 'Supabase REST API', count };
      console.log('✅ Conexión Supabase exitosa');
    } catch (error) {
      prismaError = error instanceof Error ? error.message : 'Error desconocido';
      console.log('❌ Error Supabase:', prismaError);
    }

    // Test 2: Verificar tabla usuarios
    let tableCheck = null;
    let tableError = null;
    
    try {
      const count = await prisma.usuarios.count();
      tableCheck = { 
        exists: true, 
        count, 
        message: `Tabla usuarios existe con ${count} registros` 
      };
      console.log('✅ Tabla usuarios verificada');
    } catch (error) {
      tableError = error instanceof Error ? error.message : 'Error desconocido';
      console.log('❌ Error tabla usuarios:', tableError);
    }

    // Test 3: Conexión con API de Supabase como fallback
    let supabaseResult = null;
    let supabaseError = null;
    
    try {
      const response = await supabaseRequest('usuarios?select=count');
      supabaseResult = {
        status: response.status,
        method: 'Supabase API',
        url: supabaseConfig.url
      };
      console.log('✅ Conexión Supabase API exitosa');
    } catch (error) {
      supabaseError = error instanceof Error ? error.message : 'Error desconocido';
      console.log('❌ Error Supabase API:', supabaseError);
    }

    // Determinar el estado general
    const isHealthy = prismaResult !== null && tableCheck !== null;
    
    return NextResponse.json({
      success: isHealthy,
      message: isHealthy ? 'Conexión a la base de datos exitosa' : 'Problemas de conexión detectados',
      tests: {
        prisma: {
          success: prismaResult !== null,
          data: prismaResult,
          error: prismaError
        },
        table: {
          success: tableCheck !== null,
          data: tableCheck,
          error: tableError
        },
        supabase: {
          success: supabaseResult !== null,
          data: supabaseResult,
          error: supabaseError
        }
      },
      config: {
        project: 'grupousuarios-tp',
        host: 'db.smvsrzphpcuukrnocied.supabase.co',
        table: 'usuarios'
      },
      endpoints: {
        getAll: '/api/usuarios',
        getOne: '/api/usuarios/[id]',
        create: 'POST /api/usuarios',
        update: 'PUT /api/usuarios/[id]',
        delete: 'DELETE /api/usuarios/[id]'
      },
      timestamp: new Date().toISOString()
    }, { status: isHealthy ? 200 : 500 });

  } catch (error) {
    console.error('Error general:', error);
    
    return NextResponse.json({
      success: false,
      message: 'Error general al probar la conexión',
      error: error instanceof Error ? error.message : 'Error desconocido',
      config: {
        project: 'grupousuarios-tp',
        host: 'db.smvsrzphpcuukrnocied.supabase.co',
        table: 'usuarios'
      },
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
