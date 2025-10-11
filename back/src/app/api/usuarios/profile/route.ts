import { NextRequest, NextResponse } from 'next/server';
import { getServices } from '@/lib/database-config';
import { verifyJWTMiddleware } from '@/lib/middleware';
import { z } from 'zod';
import { validateData } from '@/lib/validations';
import { hashPassword, validatePasswordStrength } from '@/lib/auth';
import { logger } from '@/lib/logger';
import { getClientIp } from '@/lib/rate-limiter';

// Schema para actualización de perfil
const updateProfileSchema = z.object({
  email: z
    .string()
    .email('Debe ser un email válido')
    .max(255, 'El email es demasiado largo')
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
  nombre_completo: z
    .string()
    .min(1, 'El nombre completo es requerido')
    .max(255, 'El nombre completo es demasiado largo')
    .optional(),
  telefono: z
    .string()
    .max(20, 'El teléfono es demasiado largo')
    .optional(),
  nacionalidad: z
    .string()
    .max(100, 'La nacionalidad es demasiado larga')
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

    // Obtener servicios (LDAP o Supabase según configuración)
    const { userRepository } = await getServices();

    // Obtener información del perfil
    const profile = await userRepository.findById(user.userId);

    if (!profile) {
      return NextResponse.json({
        success: false,
        message: 'Usuario no encontrado'
      }, { status: 404 });
    }

    const profileData = profile.toPlainObject();
    const { password: _pwd, ...profileSinPassword } = profileData as any;

    return NextResponse.json({
      success: true,
      data: profileSinPassword,
      message: 'Perfil obtenido exitosamente'
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

    const { email, currentPassword, newPassword, nombre_completo, telefono, nacionalidad } = validation.data;
    
    // Debug: Log de los datos recibidos
    console.log('🔍 [PROFILE UPDATE] Datos recibidos:', {
      nombre_completo,
      telefono,
      nacionalidad,
      telefonoType: typeof telefono,
      telefonoLength: telefono?.length
    });

    // Obtener servicios (LDAP o Supabase según configuración)
    const { userRepository } = await getServices();

    // Obtener usuario actual
    const currentUser = await userRepository.findById(user.userId);

    if (!currentUser) {
      return NextResponse.json({
        success: false,
        message: 'Usuario no encontrado'
      }, { status: 404 });
    }

    const updateData: any = {};
    let emailChanged = false;

    // Cambio de email
    const currentUserData = currentUser.toPlainObject();
    if (email && email !== currentUserData.email) {
      // Verificar que el nuevo email no esté en uso
      const emailInUse = await userRepository.findByEmail(email);

      if (emailInUse) {
        return NextResponse.json({
          success: false,
          message: 'Ya existe un usuario con este email'
        }, { status: 409 });
      }

      updateData.email = email;
      updateData.email_verified = false; // Requerir nueva verificación
      emailChanged = true;
    }

    // Cambio de contraseña
    if (newPassword && currentPassword) {
      // Verificar contraseña actual
      const { verifyPassword } = await import('@/lib/auth');
      const isCurrentPasswordValid = await verifyPassword(currentPassword, (currentUserData as any).password);

      if (!isCurrentPasswordValid) {
        logger.security('Invalid current password provided for profile update', clientIp, {
          userId: user.userId,
          email: currentUserData.email
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
      updateData.password = await hashPassword(newPassword);
    }

    // Actualizar campos de perfil
    if (nombre_completo) updateData.nombre_completo = nombre_completo;
    if (telefono && telefono.trim() !== '') updateData.telefono = telefono;
    if (nacionalidad) updateData.nacionalidad = nacionalidad;
    
    // Debug: Log de los datos a actualizar
    console.log('🔄 [PROFILE UPDATE] Datos a actualizar:', updateData);

    // Si no hay cambios, devolver error
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({
        success: false,
        message: 'No se proporcionaron cambios válidos'
      }, { status: 400 });
    }

    // Actualizar usuario
    const updatedUser = await userRepository.update(user.userId, updateData);

    if (!updatedUser) {
      return NextResponse.json({
        success: false,
        message: 'Error al actualizar el perfil'
      }, { status: 500 });
    }

    logger.userAction('profile_updated', user.userId, clientIp, {
      changes: Object.keys(updateData),
      emailChanged,
      passwordChanged: !!newPassword
    });

    const updatedUserData = updatedUser.toPlainObject();
    const { password: _pwd2, ...usuarioActualizadoSinPassword } = updatedUserData as any;

    return NextResponse.json({
      success: true,
      data: usuarioActualizadoSinPassword,
      message: 'Perfil actualizado exitosamente',
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
