/**
 * @openapi
 * /api/usuarios/profile:
 *   get:
 *     tags: [usuarios]
 *     summary: Get current user profile
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profile data
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 *   put:
 *     tags: [usuarios]
 *     summary: Update current user profile
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               nombre_completo:
 *                 type: string
 *               nacionalidad:
 *                 type: string
 *               currentPassword:
 *                 type: string
 *               newPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: Profile updated
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 */
import { NextRequest, NextResponse } from 'next/server';
import { LDAPRepositoryImpl } from '../../../../back/src/infrastructure/repositories/ldap.repository.impl';
import { LDAPServiceImpl } from '../../../../back/src/application/services/ldap.service.impl';
import { LDAPConfig } from '../../../../back/src/types/ldap.types';
import { verifyJWTMiddleware } from '@/lib/middleware';
import { z } from 'zod';
import { validateData } from '@/lib/validations';
import { hashPassword, validatePasswordStrength, verifyPassword } from '@/lib/auth';
import { logger } from '@/lib/logger';
import { getClientIp } from '@/lib/rate-limiter';

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

// Schema para actualización de perfil
const updateProfileSchema = z.object({
  email: z
    .string()
    .email('Debe ser un email válido')
    .max(255, 'El email es demasiado largo')
    .optional(),
  nombre_completo: z
    .string()
    .min(1, 'El nombre completo es requerido')
    .max(200, 'El nombre completo es demasiado largo')
    .optional(),
  nacionalidad: z
    .string()
    .max(100, 'La nacionalidad es demasiado larga')
    .optional(),
  telefono: z
    .string()
    .max(20, 'El teléfono es demasiado largo')
    .optional(),
  currentPassword: z
    .string()
    .min(1, 'La contraseña actual es requerida para cambios de seguridad')
    .optional(),
  newPassword: z
    .string()
    .min(8, 'La nueva contraseña debe tener al menos 8 caracteres')
    .max(128, 'La nueva contraseña es demasiado larga')
    .optional(),
}).refine((data) => {
  // Si se proporciona nueva contraseña, la actual es requerida
  if (data.newPassword && !data.currentPassword) {
    return false;
  }
  return true;
}, {
  message: "La contraseña actual es requerida para cambiar la contraseña",
  path: ["currentPassword"]
});

// GET /api/usuarios/profile - Obtener perfil del usuario autenticado
export async function GET(request: NextRequest) {
  try {
    // Verificar autenticación
    const authResult = verifyJWTMiddleware(request);
    if (!authResult.success || !authResult.user) {
      return NextResponse.json({
        success: false,
        message: 'Authentication required'
      }, { status: 401 });
    }

    const { user } = authResult;

    // Buscar usuario en LDAP por email o UID
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

    const profile = userResult.data;

    // Transformar datos de LDAP al formato esperado
    const profileData = {
      id: profile.supabaseId || profile.uid,
      email: profile.mail,
      nombre_completo: profile.nombreCompleto || profile.cn,
      rol: profile.rol || user.rol || 'usuario',
      email_verified: profile.emailVerified || false,
      nacionalidad: profile.nacionalidad || null,
      telefono: profile.telefono || null,
      created_at: profile.createdAt || new Date().toISOString(),
      updated_at: profile.updatedAt || new Date().toISOString(),
      last_login_at: profile.lastLoginAt || null,
      uid: profile.uid,
      dn: profile.dn
    };

    return NextResponse.json({
      success: true,
      data: profileData,
      message: 'Perfil obtenido exitosamente desde LDAP'
    });

  } catch (error) {
    const clientIp = getClientIp(request);
    logger.error('Error getting user profile', {
      action: 'get_profile_error',
      ip: clientIp,
      message: error instanceof Error ? error.message : 'Unknown error'
    });

    return NextResponse.json({
      success: false,
      message: 'Error interno del servidor'
    }, { status: 500 });
  }
}

// PUT /api/usuarios/profile - Actualizar perfil del usuario autenticado
export async function PUT(request: NextRequest) {
  try {
    const clientIp = getClientIp(request);
    
    // Verificar autenticación
    const authResult = verifyJWTMiddleware(request);
    if (!authResult.success || !authResult.user) {
      return NextResponse.json({
        success: false,
        message: 'Authentication required'
      }, { status: 401 });
    }

    const { user } = authResult;
    const body = await request.json();

    // Validar datos de entrada
    const validation = validateData(updateProfileSchema, body);
    if (!validation.success) {
      return NextResponse.json({
        success: false,
        message: 'Datos de entrada inválidos',
        error: validation.error
      }, { status: 400 });
    }

    const { email, nombre_completo, nacionalidad, telefono, currentPassword, newPassword } = validation.data;

    // Log de datos recibidos
    console.log('🔍 [PROFILE UPDATE] Datos recibidos:', {
      email,
      nombre_completo,
      nacionalidad,
      telefono,
      hasCurrentPassword: !!currentPassword,
      hasNewPassword: !!newPassword
    });

    // Buscar usuario actual en LDAP
    let currentUserResult;
    try {
      currentUserResult = await ldapService.getUserByEmail(user.email);
    } catch (error) {
      currentUserResult = await ldapService.getUserByUid(user.userId);
    }

    if (!currentUserResult.success || !currentUserResult.data) {
      return NextResponse.json({
        success: false,
        message: 'Usuario no encontrado en LDAP'
      }, { status: 404 });
    }

    const currentUser = currentUserResult.data;

    // Log del usuario actual
    console.log('👤 [PROFILE UPDATE] Usuario actual en LDAP:', {
      uid: currentUser.uid,
      email: currentUser.mail,
      cn: currentUser.cn,
      title: currentUser.title,
      telephoneNumber: currentUser.telephoneNumber,
      description: currentUser.description
    });

    const updateData: any = {};
    let emailChanged = false;
    let currentDescription = currentUser.description || '';

    console.log('📝 [PROFILE UPDATE] Description inicial:', currentDescription);

    // Actualizar campos básicos
    if (nombre_completo !== undefined) {
      console.log('✏️ [PROFILE UPDATE] Actualizando nombre_completo:', nombre_completo);
      updateData.cn = nombre_completo;
      updateData.displayName = nombre_completo;
    }
    if (nacionalidad !== undefined) {
      console.log('🌍 [PROFILE UPDATE] Actualizando nacionalidad:', nacionalidad);
      updateData.title = nacionalidad;
    }
    if (telefono !== undefined) {
      console.log('📞 [PROFILE UPDATE] Actualizando telefono:', telefono);
      updateData.telephoneNumber = telefono;
    }

    // Crear o actualizar description con todos los datos
    if (nombre_completo !== undefined || nacionalidad !== undefined || telefono !== undefined) {
      console.log('🔄 [PROFILE UPDATE] Procesando description...');
      
      // Si no hay description previa, crear una nueva
      if (!currentDescription) {
        currentDescription = `ID:${currentUser.uid}|Rol:usuario|Ver:S|C:${new Date().toISOString().substring(0, 10)}|U:${new Date().toISOString().substring(0, 10)}`;
        console.log('🆕 [PROFILE UPDATE] Creando nueva description:', currentDescription);
      }
      
      // Actualizar campos en description
      if (nombre_completo !== undefined) {
        const oldDesc = currentDescription;
        currentDescription = currentDescription.replace(/Nom:[^|]*/, `Nom:${nombre_completo.substring(0, 30)}`);
        if (!currentDescription.includes('Nom:')) {
          currentDescription += `|Nom:${nombre_completo.substring(0, 30)}`;
        }
        console.log('📝 [PROFILE UPDATE] Description después de nombre:', {
          antes: oldDesc,
          después: currentDescription
        });
      }
      if (nacionalidad !== undefined) {
        const oldDesc = currentDescription;
        currentDescription = currentDescription.replace(/Nac:[^|]*/, `Nac:${nacionalidad.substring(0, 20)}`);
        if (!currentDescription.includes('Nac:')) {
          currentDescription += `|Nac:${nacionalidad.substring(0, 20)}`;
        }
        console.log('🌍 [PROFILE UPDATE] Description después de nacionalidad:', {
          antes: oldDesc,
          después: currentDescription
        });
      }
      if (telefono !== undefined) {
        const oldDesc = currentDescription;
        currentDescription = currentDescription.replace(/Tel:[^|]*/, `Tel:${telefono.substring(0, 15)}`);
        if (!currentDescription.includes('Tel:')) {
          currentDescription += `|Tel:${telefono.substring(0, 15)}`;
        }
        console.log('📞 [PROFILE UPDATE] Description después de telefono:', {
          antes: oldDesc,
          después: currentDescription
        });
      }
      
      updateData.description = currentDescription;
      console.log('✅ [PROFILE UPDATE] Description final para actualizar:', currentDescription);
    }

    // Cambio de email
    if (email && email !== currentUser.mail) {
      // Verificar que el nuevo email no esté en uso
      const emailCheckResult = await ldapService.getUserByEmail(email);

      if (emailCheckResult.success && emailCheckResult.data) {
        return NextResponse.json({
          success: false,
          message: 'Ya existe un usuario con este email en LDAP'
        }, { status: 409 });
      }

      updateData.mail = email;
      // Actualizar description para marcar email como no verificado
      currentDescription = currentDescription.replace(/Ver:[^|]*/, 'Ver:N');
      updateData.description = currentDescription;
      emailChanged = true;
    }

    // Cambio de contraseña
    if (newPassword && currentPassword) {
      // Verificar contraseña actual
      const isCurrentPasswordValid = await verifyPassword(currentPassword, currentUser.userPassword);

      if (!isCurrentPasswordValid) {
        logger.security('Invalid current password provided for profile update', clientIp, {
          userId: user.userId,
          email: currentUser.mail
        });

        return NextResponse.json({
          success: false,
          message: 'La contraseña actual es incorrecta'
        }, { status: 400 });
      }

      // Validar fortaleza de la nueva contraseña
      const passwordValidation = validatePasswordStrength(newPassword);
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

      // Hashear nueva contraseña
      updateData.userPassword = await hashPassword(newPassword);
    }

    // Log de datos a actualizar
    console.log('📤 [PROFILE UPDATE] Datos a actualizar en LDAP:', updateData);

    // Si no hay cambios, devolver error
    if (Object.keys(updateData).length === 0) {
      console.log('❌ [PROFILE UPDATE] No hay cambios válidos para actualizar');
      return NextResponse.json({
        success: false,
        message: 'No se proporcionaron cambios válidos'
      }, { status: 400 });
    }

    // Actualizar usuario en LDAP
    console.log('🔄 [PROFILE UPDATE] Actualizando usuario en LDAP...');
    const updateResult = await ldapService.updateUser(currentUser.uid, updateData);

    if (!updateResult.success) {
      console.log('❌ [PROFILE UPDATE] Error al actualizar en LDAP:', updateResult.error);
      return NextResponse.json({
        success: false,
        message: 'Error al actualizar perfil en LDAP',
        error: updateResult.error
      }, { status: 500 });
    }

    console.log('✅ [PROFILE UPDATE] Usuario actualizado exitosamente en LDAP');

    // Obtener usuario actualizado
    console.log('🔍 [PROFILE UPDATE] Obteniendo usuario actualizado...');
    const updatedUserResult = await ldapService.getUserByUid(currentUser.uid);
    const updatedUser = updatedUserResult.data;

    console.log('👤 [PROFILE UPDATE] Usuario actualizado:', {
      uid: updatedUser.uid,
      email: updatedUser.mail,
      cn: updatedUser.cn,
      title: updatedUser.title,
      telephoneNumber: updatedUser.telephoneNumber,
      description: updatedUser.description
    });

    // Transformar respuesta al formato esperado
    const userResponse = {
      id: updatedUser.supabaseId || updatedUser.uid,
      email: updatedUser.mail,
      nombre_completo: updatedUser.nombreCompleto || updatedUser.cn,
      rol: updatedUser.rol || user.rol || 'usuario',
      email_verified: updatedUser.emailVerified || false,
      nacionalidad: updatedUser.nacionalidad || nacionalidad,
      telefono: updatedUser.telefono || telefono,
      created_at: updatedUser.createdAt || new Date().toISOString(),
      updated_at: new Date().toISOString(),
      last_login_at: updatedUser.lastLoginAt || null,
      uid: updatedUser.uid,
      dn: updatedUser.dn
    };

    logger.userAction('profile_updated', user.userId, clientIp, {
      changes: Object.keys(updateData),
      emailChanged,
      passwordChanged: !!newPassword
    });

    return NextResponse.json({
      success: true,
      data: userResponse,
      message: 'Perfil actualizado exitosamente en LDAP',
      warnings: emailChanged ? ['Tu email ha cambiado. Necesitarás verificar el nuevo email.'] : undefined
    });

  } catch (error) {
    const clientIp = getClientIp(request);
    logger.error('Error updating user profile', {
      action: 'update_profile_error',
      ip: clientIp,
      message: error instanceof Error ? error.message : 'Unknown error'
    });

    return NextResponse.json({
      success: false,
      message: 'Error interno del servidor'
    }, { status: 500 });
  }
}
