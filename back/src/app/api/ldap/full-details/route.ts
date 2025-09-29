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

// GET /api/ldap/full-details - Obtener TODOS los usuarios con TODA la información
export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Obteniendo TODOS los usuarios con información completa...');
    
    // Obtener todos los usuarios con información completa
    const result = await ldapService.getAllUsers();
    const users = result.data || [];
    
    if (!users || users.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No users found',
        stats: { totalUsers: 0 },
        data: []
      });
    }
    
    // Procesar cada usuario para mostrar información detallada
    const detailedUsers = users.map((user: LDAPUser) => {
      return {
        // Información básica LDAP
        dn: user.dn,
        uid: user.uid,
        cn: user.cn,
        sn: user.sn,
        givenName: user.givenName,
        mail: user.mail,
        objectClass: user.objectClass,
        uidNumber: user.uidNumber,
        gidNumber: user.gidNumber,
        homeDirectory: user.homeDirectory,
        loginShell: user.loginShell,
        
        // Información extraída de Supabase
        supabaseId: user.supabaseId,
        rol: user.rol,
        emailVerified: user.emailVerified,
        emailVerificationToken: user.emailVerificationToken,
        passwordResetToken: user.passwordResetToken,
        passwordResetExpires: user.passwordResetExpires,
        lastLoginAt: user.lastLoginAt,
        nombreCompleto: user.nombreCompleto,
        nacionalidad: user.nacionalidad,
        telefono: user.telefono,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        
        // Campo description completo (RAW)
        description: user.description,
        
        // Análisis del description
        descriptionAnalysis: user.description ? {
          parts: user.description.split('|'),
          totalParts: user.description.split('|').length,
          hasId: user.description.includes('ID:'),
          hasRol: user.description.includes('Rol:'),
          hasEmailVerified: user.description.includes('Ver:'),
          hasDates: user.description.includes('C:') || user.description.includes('U:') || user.description.includes('L:'),
          hasPersonalInfo: user.description.includes('Nom:') || user.description.includes('Nac:') || user.description.includes('Tel:'),
          hasTokens: user.description.includes('TV:') || user.description.includes('TR:') || user.description.includes('RE:')
        } : null
      };
    });

    // Estadísticas
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
      },
      usersWithPersonalInfo: users.filter((u: LDAPUser) => u.nombreCompleto || u.nacionalidad || u.telefono).length,
      usersWithTokens: users.filter((u: LDAPUser) => u.emailVerificationToken || u.passwordResetToken).length
    };

    return NextResponse.json({
      success: true,
      message: `Found ${users.length} users with complete details`,
      stats: stats,
      data: detailedUsers,
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

// POST /api/ldap/full-details - Análisis detallado de un usuario específico
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { uid, email } = body;

    if (!uid && !email) {
      return NextResponse.json(
        {
          success: false,
          error: 'Se requiere uid o email'
        },
        { status: 400 }
      );
    }

    let userResult;
    if (uid) {
      userResult = await ldapService.getUserByUid(uid);
    } else {
      userResult = await ldapService.getUserByEmail(email);
    }

    if (!userResult.success || !userResult.data) {
      return NextResponse.json(
        {
          success: false,
          error: 'Usuario no encontrado'
        },
        { status: 404 }
      );
    }

    const user = userResult.data;

    // Análisis detallado del usuario
    const detailedAnalysis = {
      // Información básica
      basicInfo: {
        dn: user.dn,
        uid: user.uid,
        cn: user.cn,
        sn: user.sn,
        givenName: user.givenName,
        mail: user.mail,
        objectClass: user.objectClass
      },
      
      // Información de Supabase extraída
      supabaseInfo: {
        supabaseId: user.supabaseId,
        rol: user.rol,
        emailVerified: user.emailVerified,
        emailVerificationToken: user.emailVerificationToken,
        passwordResetToken: user.passwordResetToken,
        passwordResetExpires: user.passwordResetExpires,
        lastLoginAt: user.lastLoginAt,
        nombreCompleto: user.nombreCompleto,
        nacionalidad: user.nacionalidad,
        telefono: user.telefono,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      },
      
      // Análisis del campo description
      descriptionAnalysis: user.description ? {
        raw: user.description,
        parts: user.description.split('|'),
        parsed: user.description.split('|').map((part: string) => {
          const [key, value] = part.split(':');
          return { key, value };
        }),
        length: user.description.length,
        hasAllFields: {
          id: user.description.includes('ID:'),
          rol: user.description.includes('Rol:'),
          emailVerified: user.description.includes('Ver:'),
          createdAt: user.description.includes('C:'),
          updatedAt: user.description.includes('U:'),
          lastLoginAt: user.description.includes('L:'),
          nombreCompleto: user.description.includes('Nom:'),
          nacionalidad: user.description.includes('Nac:'),
          telefono: user.description.includes('Tel:'),
          emailVerificationToken: user.description.includes('TV:'),
          passwordResetToken: user.description.includes('TR:'),
          passwordResetExpires: user.description.includes('RE:')
        }
      } : null
    };

    return NextResponse.json({
      success: true,
      message: 'Análisis detallado del usuario',
      data: detailedAnalysis
    });

  } catch (error) {
    console.error('Error analizando usuario:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Error analizando usuario',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
}
