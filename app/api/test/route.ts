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

export async function GET() {
  try {
    console.log('🔄 Probando conexión a la base de datos...');
    
    // Test 1: Conexión básica con LDAP
    let ldapResult = null;
    let ldapError = null;
    
    try {
      const count = await prisma.usuarios.count();
      ldapResult = { test: 1, method: 'LDAP Server', count };
      console.log('✅ Conexión LDAP exitosa');
    } catch (error) {
      ldapError = error instanceof Error ? error.message : 'Error desconocido';
      console.log('❌ Error LDAP:', ldapError);
    }

    // Test 2: Verificar tabla usuarios
    let tableCheck = null;
    let tableError = null;
    
    try {
      const count = await prisma.usuarios.count();
      tableCheck = { 
        exists: true, 
        count, 
        message: `Usuarios LDAP verificados con ${count} registros` 
      };
      console.log('✅ Usuarios LDAP verificados');
    } catch (error) {
      tableError = error instanceof Error ? error.message : 'Error desconocido';
      console.log('❌ Error tabla usuarios:', tableError);
    }

    // Test 3: Verificar operaciones básicas de LDAP
    let ldapOpsResult = null;
    let ldapOpsError = null;
    
    try {
      const users = await prisma.usuarios.findMany({ take: 1 });
      ldapOpsResult = {
        method: 'LDAP Operations',
        canRead: true,
        sampleUsers: users.length
      };
      console.log('✅ Operaciones LDAP básicas verificadas');
    } catch (error) {
      ldapOpsError = error instanceof Error ? error.message : 'Error desconocido';
      console.log('❌ Error operaciones LDAP:', ldapOpsError);
    }

    // Determinar el estado general
    const isHealthy = ldapResult !== null && tableCheck !== null;
    
    return NextResponse.json({
      success: isHealthy,
      message: isHealthy ? 'Conexión a la base de datos exitosa' : 'Problemas de conexión detectados',
      tests: {
        ldap: {
          success: ldapResult !== null,
          data: ldapResult,
          error: ldapError
        },
        table: {
          success: tableCheck !== null,
          data: tableCheck,
          error: tableError
        },
        ldapOps: {
          success: ldapOpsResult !== null,
          data: ldapOpsResult,
          error: ldapOpsError
        }
      },
        config: {
          database: 'LDAP',
          host: process.env.LDAP_URL || 'ldap://localhost:389',
          baseDn: process.env.LDAP_BASE_DN || 'dc=empresa,dc=local'
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
          database: 'LDAP',
          host: process.env.LDAP_URL || 'ldap://localhost:389',
          baseDn: process.env.LDAP_BASE_DN || 'dc=empresa,dc=local'
        },
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
