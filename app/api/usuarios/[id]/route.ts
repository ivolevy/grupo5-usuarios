/**
 * @openapi
 * /api/usuarios/{id}:
 *   get:
 *     tags: [usuarios]
 *     summary: Get user by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User found
 *       400:
 *         description: Invalid ID
 *       404:
 *         description: User not found
 *   put:
 *     tags: [usuarios]
 *     summary: Update user by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nombre_completo:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               rol:
 *                 type: string
 *               nacionalidad:
 *                 type: string
 *     responses:
 *       200:
 *         description: User updated
 *       400:
 *         description: Validation error or invalid ID
 *       404:
 *         description: User not found
 *   delete:
 *     tags: [usuarios]
 *     summary: Delete user by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User deleted
 *       400:
 *         description: Invalid ID
 *       404:
 *         description: User not found
 */
import { NextRequest, NextResponse } from 'next/server';
import { LDAPRepositoryImpl } from '../../../../back/src/infrastructure/repositories/ldap.repository.impl';
import { LDAPServiceImpl } from '../../../../back/src/application/services/ldap.service.impl';
import { LDAPConfig } from '../../../../back/src/types/ldap.types';
import { updateUsuarioSchema, usuarioParamsSchema, validateData } from '@/lib/validations';
import { hashPassword, validatePasswordStrength } from '@/lib/auth';

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

// GET /api/usuarios/[id] - Obtener usuario por ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Validar parámetros
    const { id } = await params;
    const paramValidation = validateData(usuarioParamsSchema, { id });
    if (!paramValidation.success) {
      return NextResponse.json({
        success: false,
        message: 'ID de usuario inválido',
        error: paramValidation.error
      }, { status: 400 });
    }

    // Buscar usuario en LDAP por UID o por supabaseId
    let result;
    try {
      // Primero intentar buscar por UID directo
      result = await ldapService.getUserByUid(id);
    } catch (error) {
      // Si no se encuentra por UID, buscar por email (asumiendo que el ID puede ser un email)
      result = await ldapService.getUserByEmail(id);
    }

    if (!result.success || !result.data) {
      return NextResponse.json({
        success: false,
        message: 'Usuario no encontrado en LDAP'
      }, { status: 404 });
    }

    const user = result.data;

    // Transformar datos de LDAP al formato esperado
    const usuario = {
      id: user.supabaseId || user.uid,
      email: user.mail,
      nombre_completo: user.nombreCompleto || user.cn,
      rol: user.rol || 'usuario',
      email_verified: user.emailVerified || false,
      nacionalidad: user.nacionalidad || null,
      telefono: user.telefono || null,
      created_at: user.createdAt || new Date().toISOString(),
      updated_at: user.updatedAt || new Date().toISOString(),
      last_login_at: user.lastLoginAt || null,
      uid: user.uid,
      dn: user.dn
    };

    return NextResponse.json({
      success: true,
      data: usuario,
      message: 'Usuario obtenido exitosamente desde LDAP'
    });

  } catch (error) {
    console.error('Error al obtener usuario:', error);
    return NextResponse.json({
      success: false,
      message: 'Error al obtener usuario',
      error: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
}

// PUT /api/usuarios/[id] - Actualizar usuario
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    console.log('🔍 [UPDATE USER] Iniciando actualización de usuario');
    
    // Validar parámetros
    const { id } = await params;
    console.log('🔍 [UPDATE USER] ID recibido:', id);
    
    const paramValidation = validateData(usuarioParamsSchema, { id });
    if (!paramValidation.success) {
      console.log('❌ [UPDATE USER] Error de validación de parámetros:', paramValidation.error);
      return NextResponse.json({
        success: false,
        message: 'ID de usuario inválido',
        error: paramValidation.error
      }, { status: 400 });
    }
    
    const body = await request.json();
    console.log('🔍 [UPDATE USER] Body recibido:', body);

    // Validar datos de entrada
    const validation = validateData(updateUsuarioSchema, body);
    if (!validation.success) {
      return NextResponse.json({
        success: false,
        message: 'Datos de entrada inválidos',
        error: validation.error
      }, { status: 400 });
    }

    const { nombre_completo, email, password, rol, email_verified, nacionalidad } = validation.data;

    // Si se proporciona una nueva contraseña, validar su fortaleza
    if (password) {
      const passwordValidation = validatePasswordStrength(password);
      if (!passwordValidation.isValid) {
        return NextResponse.json({
          success: false,
          message: 'La nueva contraseña no cumple con los requisitos de seguridad',
          error: passwordValidation.feedback.join(', '),
          passwordStrength: {
            score: passwordValidation.score,
            maxScore: 5,
            feedback: passwordValidation.feedback
          }
        }, { status: 400 });
      }
    }

    // Buscar usuario existente en LDAP
    let existingUserResult;
    try {
      existingUserResult = await ldapService.getUserByUid(id);
    } catch (error) {
      existingUserResult = await ldapService.getUserByEmail(id);
    }

    if (!existingUserResult.success || !existingUserResult.data) {
      return NextResponse.json({
        success: false,
        message: 'Usuario no encontrado en LDAP'
      }, { status: 404 });
    }

    const existingUser = existingUserResult.data;

    // Si se proporciona un nuevo email, verificar que no esté en uso
    if (email && email !== existingUser.mail) {
      const emailCheckResult = await ldapService.getUserByEmail(email);
      
      if (emailCheckResult.success && emailCheckResult.data) {
        return NextResponse.json({
          success: false,
          message: 'Ya existe un usuario con este email en LDAP'
        }, { status: 409 });
      }
    }

    // Preparar datos para actualizar en LDAP
    const updateData: any = {};
    if (nombre_completo !== undefined) {
      updateData.cn = nombre_completo;
      updateData.displayName = nombre_completo;
      // Actualizar description con nuevo nombre
      const currentDescription = existingUser.description || '';
      const newDescription = currentDescription.replace(/Nom:[^|]*/, `Nom:${nombre_completo.substring(0, 10)}`);
      updateData.description = newDescription;
    }
    if (email) {
      updateData.mail = email;
    }
    if (password) {
      updateData.userPassword = await hashPassword(password);
    }
    if (rol !== undefined) {
      // Actualizar description con nuevo rol
      const currentDescription = existingUser.description || '';
      const newDescription = currentDescription.replace(/Rol:[^|]*/, `Rol:${rol}`);
      updateData.description = newDescription;
    }
    if (nacionalidad !== undefined) {
      updateData.title = nacionalidad;
      // Actualizar description con nueva nacionalidad
      const currentDescription = existingUser.description || '';
      const newDescription = currentDescription.replace(/Nac:[^|]*/, `Nac:${nacionalidad.substring(0, 5)}`);
      updateData.description = newDescription;
    }

    // Actualizar el usuario en LDAP
    const updateResult = await ldapService.updateUser(existingUser.uid, updateData);

    if (!updateResult.success) {
      return NextResponse.json({
        success: false,
        message: 'Error al actualizar usuario en LDAP',
        error: updateResult.error
      }, { status: 500 });
    }

    // Obtener usuario actualizado
    const updatedUserResult = await ldapService.getUserByUid(existingUser.uid);
    const updatedUser = updatedUserResult.data;

    // Transformar respuesta al formato esperado
    const userResponse = {
      id: updatedUser.supabaseId || updatedUser.uid,
      email: updatedUser.mail,
      nombre_completo: updatedUser.nombreCompleto || updatedUser.cn,
      rol: updatedUser.rol || rol || 'usuario',
      email_verified: updatedUser.emailVerified || false,
      nacionalidad: updatedUser.nacionalidad || nacionalidad,
      telefono: updatedUser.telefono || null,
      created_at: updatedUser.createdAt || new Date().toISOString(),
      updated_at: new Date().toISOString(),
      uid: updatedUser.uid,
      dn: updatedUser.dn
    };

    return NextResponse.json({
      success: true,
      data: userResponse,
      message: 'Usuario actualizado exitosamente en LDAP'
    });

  } catch (error) {
    console.error('Error al actualizar usuario:', error);
    return NextResponse.json({
      success: false,
      message: 'Error al actualizar usuario',
      error: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
}

// DELETE /api/usuarios/[id] - Eliminar usuario
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Validar parámetros
    const { id } = await params;
    const paramValidation = validateData(usuarioParamsSchema, { id });
    if (!paramValidation.success) {
      return NextResponse.json({
        success: false,
        message: 'ID de usuario inválido',
        error: paramValidation.error
      }, { status: 400 });
    }

    // Buscar usuario existente en LDAP
    let existingUserResult;
    try {
      existingUserResult = await ldapService.getUserByUid(id);
    } catch (error) {
      existingUserResult = await ldapService.getUserByEmail(id);
    }

    if (!existingUserResult.success || !existingUserResult.data) {
      return NextResponse.json({
        success: false,
        message: 'Usuario no encontrado en LDAP'
      }, { status: 404 });
    }

    const existingUser = existingUserResult.data;

    // Eliminar el usuario de LDAP
    const deleteResult = await ldapService.deleteUser(existingUser.uid);

    if (!deleteResult.success) {
      return NextResponse.json({
        success: false,
        message: 'Error al eliminar usuario de LDAP',
        error: deleteResult.error
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Usuario eliminado exitosamente de LDAP'
    });

  } catch (error) {
    console.error('Error al eliminar usuario:', error);
    return NextResponse.json({
      success: false,
      message: 'Error al eliminar usuario',
      error: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
}
