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

// Instanciar servicios
const ldapRepository = new LDAPRepositoryImpl(ldapConfig);
const ldapService = new LDAPServiceImpl(ldapRepository);

// GET /api/ldap - Obtener todos los usuarios o buscar usuarios
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const uid = searchParams.get('uid');
    const email = searchParams.get('email');

    // Buscar por UID específico
    if (uid) {
      const result = await ldapService.getUserByUid(uid);
      return NextResponse.json(result);
    }

    // Buscar por email específico
    if (email) {
      const result = await ldapService.getUserByEmail(email);
      return NextResponse.json(result);
    }

    // Búsqueda general
    if (search) {
      const result = await ldapService.searchUsers(search);
      return NextResponse.json(result);
    }

    // Obtener todos los usuarios
    const result = await ldapService.getAllUsers();
    return NextResponse.json(result);

  } catch (error) {
    console.error('LDAP GET Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error'
      },
      { status: 500 }
    );
  }
}

// POST /api/ldap - Crear nuevo usuario
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

    const result = await ldapService.createUser(body);
    
    if (!result.success) {
      return NextResponse.json(result, { status: 400 });
    }

    return NextResponse.json(result, { status: 201 });

  } catch (error) {
    console.error('LDAP POST Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error'
      },
      { status: 500 }
    );
  }
}
