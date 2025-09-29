/**
 * @openapi
 * /api/auth/refresh:
 *   post:
 *     tags: [auth]
 *     summary: Refresh JWT token
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Token refreshed
 *       401:
 *         description: Invalid token
 *       404:
 *         description: User not found
 */
import { NextRequest, NextResponse } from 'next/server';
import { LDAPRepositoryImpl } from '../../../../back/src/infrastructure/repositories/ldap.repository.impl';
import { LDAPServiceImpl } from '../../../../back/src/application/services/ldap.service.impl';
import { LDAPConfig } from '../../../../back/src/types/ldap.types';
import { generateJWT } from '@/lib/auth';
import { verifyJWTMiddleware } from '@/lib/middleware';

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

// POST /api/auth/refresh - Refrescar token JWT
export async function POST(request: NextRequest) {
  try {
    // Verificar JWT actual
    const authResult = verifyJWTMiddleware(request);
    
    if (!authResult.success) {
      return NextResponse.json({
        success: false,
        message: 'Token inválido para refrescar'
      }, { status: 401 });
    }

    const { user } = authResult;
    
    if (!user) {
      return NextResponse.json({
        success: false,
        message: 'Usuario no encontrado en el token'
      }, { status: 401 });
    }

    // Verificar que el usuario siga existiendo en LDAP
    let userResult;
    try {
      userResult = await ldapService.getUserByEmail(user.email);
    } catch (error) {
      userResult = await ldapService.getUserByUid(user.userId);
    }

    if (!userResult.success || !userResult.data) {
      return NextResponse.json({
        success: false,
        message: 'Usuario no encontrado en LDAP'
      }, { status: 404 });
    }

    const currentUser = userResult.data;

    // Generar nuevo JWT con información actualizada
    const newToken = generateJWT({
      userId: currentUser.supabaseId || currentUser.uid,
      email: currentUser.mail,
      rol: currentUser.rol || user.rol || 'usuario'
    });

    // Transformar datos de LDAP al formato esperado
    const userData = {
      id: currentUser.supabaseId || currentUser.uid,
      email: currentUser.mail,
      nombre_completo: currentUser.nombreCompleto || currentUser.cn,
      rol: currentUser.rol || user.rol || 'usuario',
      email_verified: currentUser.emailVerified || false,
      nacionalidad: currentUser.nacionalidad || null,
      telefono: currentUser.telefono || null,
      created_at: currentUser.createdAt || new Date().toISOString(),
      updated_at: currentUser.updatedAt || new Date().toISOString(),
      last_login_at: currentUser.lastLoginAt || null,
      uid: currentUser.uid,
      dn: currentUser.dn
    };

    return NextResponse.json({
      success: true,
      message: 'Token refrescado exitosamente desde LDAP',
      data: {
        user: userData,
        token: newToken,
        tokenType: 'Bearer',
        expiresIn: '24h'
      }
    });

  } catch (error) {
    console.error('Error al refrescar token:', error);
    return NextResponse.json({
      success: false,
      message: 'Error interno del servidor',
      error: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
}
