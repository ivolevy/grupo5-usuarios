import { NextResponse } from 'next/server';
import { getServices } from '@/lib/database-config';

export async function GET() {
  try {
    console.log('🔄 Probando conexión a la base de datos...');
    
    // Test 1: Conexión básica con LDAP/Supabase según configuración
    let dbResult = null;
    let dbError = null;
    
    try {
      const { userRepository } = await getServices();
      const count = await userRepository.count();
      const dbType = 'ldap'; // Solo LDAP disponible
      dbResult = { test: 1, method: dbType.toUpperCase(), count };
      console.log(`✅ Conexión ${dbType.toUpperCase()} exitosa`);
    } catch (error) {
      dbError = error instanceof Error ? error.message : 'Error desconocido';
      console.log('❌ Error conexión:', dbError);
    }

    // Test 2: Verificar usuarios
    let tableCheck = null;
    let tableError = null;
    
    try {
      const { userRepository } = await getServices();
      const count = await userRepository.count();
      tableCheck = { 
        exists: true, 
        count, 
        message: `Usuarios encontrados: ${count}` 
      };
      console.log('✅ Verificación de usuarios exitosa');
    } catch (error) {
      tableError = error instanceof Error ? error.message : 'Error desconocido';
      console.log('❌ Error verificación usuarios:', tableError);
    }

    // Test 3: Verificar configuración
    let configResult = null;
    let configError = null;
    
    try {
      const dbType = 'ldap'; // Solo LDAP disponible
      configResult = {
        databaseType: dbType,
        method: 'LDAP Server',
        url: process.env.LDAP_URL || 'LDAP Server'
      };
      console.log('✅ Configuración verificada');
    } catch (error) {
      configError = error instanceof Error ? error.message : 'Error desconocido';
      console.log('❌ Error configuración:', configError);
    }

    // Determinar el estado general
    const isHealthy = dbResult !== null && tableCheck !== null;
    
    return NextResponse.json({
      success: isHealthy,
      message: isHealthy ? 'Conexión a la base de datos exitosa' : 'Problemas de conexión detectados',
      tests: {
        database: {
          success: dbResult !== null,
          data: dbResult,
          error: dbError
        },
        users: {
          success: tableCheck !== null,
          data: tableCheck,
          error: tableError
        },
        config: {
          success: configResult !== null,
          data: configResult,
          error: configError
        }
      },
      config: {
        databaseType: 'ldap',
        ldapUrl: process.env.LDAP_URL || 'Not configured',
        ldapBaseDN: process.env.LDAP_BASE_DN || 'Not configured'
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
        databaseType: 'ldap',
        ldapUrl: process.env.LDAP_URL || 'Not configured',
        ldapBaseDN: process.env.LDAP_BASE_DN || 'Not configured'
      },
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
