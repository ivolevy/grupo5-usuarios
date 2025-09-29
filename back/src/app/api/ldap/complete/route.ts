import { NextRequest, NextResponse } from 'next/server';
import { LDAPRepositoryImpl } from '../../../../infrastructure/repositories/ldap.repository.impl';
import { LDAPServiceImpl } from '../../../../application/services/ldap.service.impl';
import { LDAPConfig, LDAPUser } from '@/types/ldap.types';

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

// GET /api/ldap/complete - Obtener TODOS los usuarios con TODA la información
export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Obteniendo TODOS los usuarios con información completa...');
    
    // Obtener todos los usuarios
    const result = await ldapService.getAllUsers();
    const users = result.data || [];
    
    // Estadísticas básicas
    const stats = {
      totalUsers: users.length,
      usersByRole: {
        admin: users.filter((u: LDAPUser) => u.rol === 'admin').length,
        moderador: users.filter((u: LDAPUser) => u.rol === 'moderador').length,
        usuario: users.filter((u: LDAPUser) => u.rol === 'usuario').length,
        unknown: users.filter((u: LDAPUser) => !u.rol).length
      },
      usersByVerification: {
        verified: users.filter((u: LDAPUser) => u.emailVerified === true).length,
        unverified: users.filter((u: LDAPUser) => u.emailVerified === false).length,
        unknown: users.filter((u: LDAPUser) => u.emailVerified === undefined).length
      }
    };

    return NextResponse.json({
      success: true,
      message: `Found ${users.length} users with complete details`,
      stats: stats,
      data: users,
      summary: {
        totalUsers: users.length,
        message: `✅ Migración exitosa: ${users.length} usuarios de Supabase migrados a LDAP`,
        description: "Todos los datos de Supabase están almacenados en el campo 'description' y extraídos automáticamente"
      }
    });

  } catch (error) {
    console.error('Error obteniendo usuarios completos:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Error obteniendo usuarios completos',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
}
