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
import { prisma } from '@/lib/db';
import { verifyJWTMiddleware } from '@/lib/middleware';
import { z } from 'zod';
import { validateData } from '@/lib/validations';
import { hashPassword, validatePasswordStrength } from '@/lib/auth';
import { logger } from '@/lib/logger';
import { getClientIp } from '@/lib/rate-limiter';
import { sendUserUpdatedEvent } from '@/lib/kafka-api-sender';

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

    // Obtener información del perfil
    const profile = await prisma.usuarios.findUnique({ id: user.userId });

    if (!profile) {
      return NextResponse.json({
        success: false,
        message: 'Usuario no encontrado'
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: profile,
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

    const { email, nombre_completo, nacionalidad, telefono, currentPassword, newPassword } = validation.data;

    // Debug: Log de los datos recibidos
    console.log('🔍 [PROFILE UPDATE] Datos recibidos:', {
      nombre_completo,
      telefono,
      nacionalidad,
      telefonoType: typeof telefono,
      telefonoLength: telefono?.length
    });

    // Obtener usuario actual
    const currentUser = await prisma.usuarios.findUnique({ id: user.userId });

    if (!currentUser) {
      return NextResponse.json({
        success: false,
        message: 'Usuario no encontrado'
      }, { status: 404 });
    }

    const updateData: any = {};

    // Actualizar campos básicos
    if (nombre_completo !== undefined) updateData.nombre_completo = nombre_completo;
    if (nacionalidad !== undefined) updateData.nacionalidad = nacionalidad;
    // Permitir actualizar teléfono incluso si está vacío (para poder eliminarlo)
    if (telefono !== undefined) {
      updateData.telefono = telefono.trim() === '' ? null : telefono;
    }
    
    // Debug: Log de los datos a actualizar
    console.log('🔄 [PROFILE UPDATE] Datos a actualizar:', {
      ...updateData,
      password: updateData.password ? '[HASHED]' : 'undefined'
    });

    // Cambio de email - NO PERMITIDO desde el perfil del usuario
    // El email no se puede modificar desde la configuración de perfil
    if (email && email !== currentUser.email) {
      // Ignorar el cambio de email - no permitir modificación desde perfil
      // El email solo puede ser cambiado por un administrador
      logger.security('Attempt to change email from profile page blocked', clientIp, {
        userId: user.userId,
        currentEmail: currentUser.email,
        attemptedEmail: email
      });
      // No agregar email a updateData - simplemente ignorarlo
    }

    // Cambio de contraseña
    if (newPassword && currentPassword) {
      // Verificar contraseña actual
      const { verifyPassword } = await import('@/lib/auth');
      const isCurrentPasswordValid = await verifyPassword(currentPassword, currentUser.password);

      if (!isCurrentPasswordValid) {
        logger.security('Invalid current password provided for profile update', clientIp, {
          userId: user.userId,
          email: currentUser.email
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
      
      // Marcar que el usuario cambió su contraseña inicial
      updateData.initial_password_changed = true;
    }

    // Si no hay cambios, devolver error
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({
        success: false,
        message: 'No se proporcionaron cambios válidos'
      }, { status: 400 });
    }

    // Guardar datos anteriores para el evento de Kafka
    const previousData = {
      nationalityOrOrigin: currentUser.nacionalidad || 'No especificada',
      roles: [currentUser.rol]
    };

    // Actualizar usuario
    const updatedUser = await prisma.usuarios.update(
      { id: user.userId },
      updateData
    );

    // Enviar evento a Kafka (no bloquear la respuesta si falla)
    try {
      const kafkaSuccess = await sendUserUpdatedEvent({
        userId: updatedUser.id,
        nationalityOrOrigin: updatedUser.nacionalidad || 'No especificada',
        roles: [updatedUser.rol],
        updatedAt: new Date().toISOString(),
        previousData: previousData
      });

      if (kafkaSuccess) {
        logger.info('Evento de usuario actualizado enviado a Kafka (perfil)', {
          action: 'user_updated_kafka_success_profile',
          userId: updatedUser.id
        });
      }
    } catch (kafkaError) {
      logger.error('Error enviando evento de actualización a Kafka (no crítico)', {
        action: 'user_updated_kafka_error_profile',
        userId: updatedUser.id
      });
    }

    logger.userAction('profile_updated', user.userId, clientIp, {
      changes: Object.keys(updateData),
      passwordChanged: !!newPassword
    });

    return NextResponse.json({
      success: true,
      data: updatedUser,
      message: 'Perfil actualizado exitosamente'
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
