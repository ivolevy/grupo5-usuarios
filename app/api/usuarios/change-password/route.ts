import { NextRequest, NextResponse } from 'next/server'
/**
 * @openapi
 * /api/usuarios/change-password:
 *   post:
 *     tags: [usuarios]
 *     summary: Change user password by email
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, newPassword]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               newPassword:
 *                 type: string
 *                 minLength: 8
 *     responses:
 *       200:
 *         description: Password updated
 *       400:
 *         description: Validation error
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */
import { LDAPRepositoryImpl } from '../../../back/src/infrastructure/repositories/ldap.repository.impl';
import { LDAPServiceImpl } from '../../../back/src/application/services/ldap.service.impl';
import { LDAPConfig } from '../../../back/src/types/ldap.types';
import { hashPassword } from '@/lib/auth';

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

    if (!email || !newPassword) {
      return NextResponse.json(
        { success: false, message: 'Email y nueva contraseña son requeridos' },
        { status: 400 }
      )
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        { success: false, message: 'La contraseña debe tener al menos 8 caracteres' },
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

    // Hashear la nueva contraseña
    const hashedPassword = await hashPassword(newPassword);

    // Actualizar la contraseña en LDAP
    const updateResult = await ldapService.updateUser(user.uid, {
      userPassword: hashedPassword
    });

    if (!updateResult.success) {
      return NextResponse.json({
        success: false,
        message: 'Error al actualizar contraseña en LDAP',
        error: updateResult.error
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Contraseña actualizada correctamente en LDAP'
    });

  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
