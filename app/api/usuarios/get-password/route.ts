import { NextRequest, NextResponse } from 'next/server'
/**
 * @openapi
 * /api/usuarios/get-password:
 *   post:
 *     tags: [usuarios]
 *     summary: Check if newPassword equals current password or exists
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
 *               newPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password comparison or presence
 *       400:
 *         description: Validation error
 *       500:
 *         description: Internal server error
 */
import { LDAPRepositoryImpl } from '../../../back/src/infrastructure/repositories/ldap.repository.impl';
import { LDAPServiceImpl } from '../../../back/src/application/services/ldap.service.impl';
import { LDAPConfig } from '../../../back/src/types/ldap.types';
import { verifyPassword } from '@/lib/auth';

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
    const { email, newPassword } = await request.json()

    if (!email) {
      return NextResponse.json(
        { success: false, message: 'Email es requerido' },
        { status: 400 }
      )
    }

    // Buscar usuario en LDAP por email
    const userResult = await ldapService.getUserByEmail(email);

    if (!userResult.success || !userResult.data) {
      return NextResponse.json({
        success: false,
        message: 'Usuario no encontrado en LDAP'
      }, { status: 404 });
    }

    const user = userResult.data;

    // Si se proporciona una nueva contraseña, compararla con la actual
    if (newPassword) {
      const isSamePassword = await verifyPassword(newPassword, user.userPassword);
      
      return NextResponse.json({
        success: true,
        isSamePassword
      });
    }

    // Si no se proporciona nueva contraseña, solo devolver que existe
    return NextResponse.json({
      success: true,
      hasPassword: !!user.userPassword
    });

  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
