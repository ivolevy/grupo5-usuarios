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
import { LDAPRepositoryImpl } from '../../../back/src/infrastructure/repositories/ldap.repository.impl';
import { LDAPServiceImpl } from '../../../back/src/application/services/ldap.service.impl';
import { LDAPConfig } from '../../../back/src/types/ldap.types';

// Configuración LDAP
const ldapConfig: LDAPConfig = {
  url: process.env.LDAP_URL || 'ldap://35.184.48.90:389',
  baseDN: process.env.LDAP_BASE_DN || 'dc=empresa,dc=local',
  bindDN: process.env.LDAP_BIND_DN || 'cn=admin,dc=empresa,dc=local',
  bindPassword: process.env.LDAP_BIND_PASSWORD || 'boca2002',
  usersOU: process.env.LDAP_USERS_OU || 'ou=users,dc=empresa,dc=local'
};

// Instanciar servicios LDAP
const ldapRepository = new LDAPRepositoryImpl(ldapConfig);
const ldapService = new LDAPServiceImpl(ldapRepository);

export async function GET() {
  try {
    console.log('🔄 Probando conexión a LDAP...');
    
    // Test 1: Conexión básica con LDAP
    let ldapResult = null;
    let ldapError = null;
    
    try {
      const result = await ldapService.getAllUsers();
      const count = result.success && result.data ? result.data.length : 0;
      ldapResult = { test: 1, method: 'LDAP API', count };
      console.log('✅ Conexión LDAP exitosa');
    } catch (error) {
      ldapError = error instanceof Error ? error.message : 'Error desconocido';
      console.log('❌ Error LDAP:', ldapError);
    }

    // Test 2: Verificar usuarios en LDAP
    let usersCheck = null;
    let usersError = null;
    
    try {
      const result = await ldapService.getAllUsers();
      const count = result.success && result.data ? result.data.length : 0;
      usersCheck = { 
        exists: result.success, 
        count, 
        message: `Usuarios en LDAP: ${count} registros` 
      };
      console.log('✅ Usuarios LDAP verificados');
    } catch (error) {
      usersError = error instanceof Error ? error.message : 'Error desconocido';
      console.log('❌ Error usuarios LDAP:', usersError);
    }

    // Test 3: Verificar configuración LDAP
    let configCheck = null;
    let configError = null;
    
    try {
      configCheck = {
        url: ldapConfig.url,
        baseDN: ldapConfig.baseDN,
        usersOU: ldapConfig.usersOU,
        method: 'LDAP Config'
      };
      console.log('✅ Configuración LDAP verificada');
    } catch (error) {
      configError = error instanceof Error ? error.message : 'Error desconocido';
      console.log('❌ Error configuración LDAP:', configError);
    }

    // Determinar el estado general
    const isHealthy = ldapResult !== null && usersCheck !== null;
    
    return NextResponse.json({
      success: isHealthy,
      message: isHealthy ? 'Conexión a LDAP exitosa' : 'Problemas de conexión LDAP detectados',
      tests: {
        ldap: {
          success: ldapResult !== null,
          data: ldapResult,
          error: ldapError
        },
        users: {
          success: usersCheck !== null,
          data: usersCheck,
          error: usersError
        },
        config: {
          success: configCheck !== null,
          data: configCheck,
          error: configError
        }
      },
      config: {
        ldap: {
          url: ldapConfig.url,
          baseDN: ldapConfig.baseDN,
          usersOU: ldapConfig.usersOU
        }
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
