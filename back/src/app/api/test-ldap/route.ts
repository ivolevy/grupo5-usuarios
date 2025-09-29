import { NextRequest, NextResponse } from 'next/server';
import { LDAPRepositoryImpl } from '../../../infrastructure/repositories/ldap.repository.impl';
import { LDAPServiceImpl } from '../../../application/services/ldap.service.impl';
import { LDAPConfig } from '../../../types/ldap.types';

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

// GET /api/test-ldap - Probar conexión LDAP
export async function GET(request: NextRequest) {
  try {
    console.log('🧪 [TEST LDAP] Iniciando prueba de conexión LDAP');
    
    // Probar obtener todos los usuarios
    const result = await ldapService.getAllUsers();
    
    if (!result.success) {
      console.log('❌ [TEST LDAP] Error al obtener usuarios:', result.error);
      return NextResponse.json({
        success: false,
        message: 'Error al conectar con LDAP',
        error: result.error
      }, { status: 500 });
    }

    console.log('✅ [TEST LDAP] Conexión exitosa, usuarios encontrados:', result.data?.length || 0);

    return NextResponse.json({
      success: true,
      message: 'Conexión LDAP exitosa',
      userCount: result.data?.length || 0,
      users: result.data?.slice(0, 3) // Mostrar solo los primeros 3 usuarios
    });

  } catch (error) {
    console.error('❌ [TEST LDAP] Error:', error);
    return NextResponse.json({
      success: false,
      message: 'Error al probar LDAP',
      error: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
}

// PUT /api/test-ldap - Probar actualización de usuario
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { uid, rol } = body;

    if (!uid || !rol) {
      return NextResponse.json({
        success: false,
        message: 'UID y rol son requeridos'
      }, { status: 400 });
    }

    console.log('🧪 [TEST LDAP] Probando actualización de usuario:', { uid, rol });

    // Buscar usuario primero
    const userResult = await ldapService.getUserByUid(uid);
    if (!userResult.success) {
      return NextResponse.json({
        success: false,
        message: 'Usuario no encontrado',
        error: userResult.error
      }, { status: 404 });
    }

    console.log('✅ [TEST LDAP] Usuario encontrado:', userResult.data.uid);

    // Actualizar rol
    const updateResult = await ldapService.updateUser(uid, { rol });
    
    if (!updateResult.success) {
      console.log('❌ [TEST LDAP] Error al actualizar:', updateResult.error);
      return NextResponse.json({
        success: false,
        message: 'Error al actualizar usuario',
        error: updateResult.error
      }, { status: 500 });
    }

    console.log('✅ [TEST LDAP] Usuario actualizado exitosamente');

    return NextResponse.json({
      success: true,
      message: 'Usuario actualizado exitosamente',
      data: updateResult.data
    });

  } catch (error) {
    console.error('❌ [TEST LDAP] Error:', error);
    return NextResponse.json({
      success: false,
      message: 'Error al probar actualización',
      error: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
}
