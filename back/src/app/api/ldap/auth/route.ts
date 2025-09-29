import { NextRequest, NextResponse } from 'next/server';
import { LDAPRepositoryImpl } from '../../../../infrastructure/repositories/ldap.repository.impl';
import { LDAPServiceImpl } from '../../../../application/services/ldap.service.impl';
import { LDAPConfig } from '../../../../types/ldap.types';

// Configuración LDAP
const ldapConfig: LDAPConfig = {
  url: process.env.LDAP_URL || 'ldap://35.184.48.90:389',
  baseDN: process.env.LDAP_BASE_DN || 'dc=empresa,dc=local',
  bindDN: process.env.LDAP_BIND_DN || 'cn=admin,dc=empresa,dc=local',
  bindPassword: process.env.LDAP_BIND_PASSWORD || 'boca2002',
  usersOU: process.env.LDAP_USERS_OU || 'ou=users,dc=empresa,dc=local'
};

// Instanciar servicios
const ldapRepository = new LDAPRepositoryImpl(ldapConfig);
const ldapService = new LDAPServiceImpl(ldapRepository);

// POST /api/ldap/auth - Autenticar usuario
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validar que el cuerpo de la petición no esté vacío
    if (!body || Object.keys(body).length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Request body is required'
        },
        { status: 400 }
      );
    }

    const { uid, password } = body;

    if (!uid || !password) {
      return NextResponse.json(
        {
          success: false,
          error: 'UID and password are required'
        },
        { status: 400 }
      );
    }

    const result = await ldapService.authenticateUser(uid, password);
    
    if (!result.success) {
      return NextResponse.json(result, { status: 401 });
    }

    return NextResponse.json(result);

  } catch (error) {
    console.error('LDAP Auth Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error'
      },
      { status: 500 }
    );
  }
}
