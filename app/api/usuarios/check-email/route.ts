import { NextRequest, NextResponse } from 'next/server'
/**
 * @openapi
 * /api/usuarios/check-email:
 *   post:
 *     tags: [usuarios]
 *     summary: Check if user email exists in LDAP
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: Email existence status
 *       400:
 *         description: Validation error
 *       500:
 *         description: Internal server error
 */
import { LDAPRepositoryImpl } from '../../../../back/src/infrastructure/repositories/ldap.repository.impl';
import { LDAPServiceImpl } from '../../../../back/src/application/services/ldap.service.impl';
import { LDAPConfig } from '../../../../back/src/types/ldap.types';

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

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json(
        { success: false, message: 'Email es requerido' },
        { status: 400 }
      )
    }

    // Verificar si el email existe en LDAP
    const result = await ldapService.getUserByEmail(email)
    
    if (!result.success) {
      return NextResponse.json(
        { success: false, message: 'Error al verificar email en LDAP' },
        { status: 500 }
      )
    }

    const user = result.data

    return NextResponse.json({
      success: true,
      exists: !!user,
      message: user ? 'Email encontrado en LDAP' : 'Email no encontrado en LDAP'
    })

  } catch (error) {
    console.error('Error verificando email en LDAP:', error)
    return NextResponse.json(
      { success: false, message: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
