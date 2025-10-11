import { NextRequest, NextResponse } from 'next/server';
import { getServices } from '@/lib/database-config';
import { updateUsuarioSchema, usuarioParamsSchema, validateData } from '@/lib/validations';
import { hashPassword, validatePasswordStrength } from '@/lib/auth';

// GET /api/usuarios/[id] - Obtener usuario por ID
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    // Validar parámetros
    const paramValidation = validateData(usuarioParamsSchema, { id: params.id });
    if (!paramValidation.success) {
      return NextResponse.json({
        success: false,
        message: 'ID de usuario inválido',
        error: paramValidation.error
      }, { status: 400 });
    }

    const { id } = paramValidation.data;

    // Obtener servicios (LDAP o Supabase según configuración)
    const { userRepository } = await getServices();

    const usuario = await userRepository.findById(id);

    if (!usuario) {
      return NextResponse.json({
        success: false,
        message: 'Usuario no encontrado'
      }, { status: 404 });
    }

    const usuarioData = usuario.toPlainObject();
    const { password: _pwd, ...usuarioSinPassword } = usuarioData as any;

    return NextResponse.json({
      success: true,
      data: usuarioSinPassword,
      message: 'Usuario obtenido exitosamente'
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
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    // Validar parámetros
    const paramValidation = validateData(usuarioParamsSchema, { id: params.id });
    if (!paramValidation.success) {
      return NextResponse.json({
        success: false,
        message: 'ID de usuario inválido',
        error: paramValidation.error
      }, { status: 400 });
    }

    const { id } = paramValidation.data;
    const body = await request.json();

    // Validar datos de entrada
    const validation = validateData(updateUsuarioSchema, body);
    if (!validation.success) {
      return NextResponse.json({
        success: false,
        message: 'Datos de entrada inválidos',
        error: validation.error
      }, { status: 400 });
    }

    const { email, password, rol, nombre_completo, telefono, nacionalidad } = validation.data;

    // Obtener servicios (LDAP o Supabase según configuración)
    const { userRepository } = await getServices();

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

    // Verificar si el usuario existe
    const existingUser = await userRepository.findById(id);

    if (!existingUser) {
      return NextResponse.json({
        success: false,
        message: 'Usuario no encontrado'
      }, { status: 404 });
    }

    // Si se proporciona un nuevo email, verificar que no esté en uso
    const existingUserData = existingUser.toPlainObject();
    if (email && email !== existingUserData.email) {
      const emailInUse = await userRepository.findByEmail(email);

      if (emailInUse) {
        return NextResponse.json({
          success: false,
          message: 'Ya existe un usuario con este email'
        }, { status: 409 });
      }
    }

    // Preparar datos para actualizar
    const updateData: any = {};
    if (email) updateData.email = email;
    if (password) updateData.password = await hashPassword(password);
    if (rol) updateData.rol = rol;
    if (nombre_completo) updateData.nombre_completo = nombre_completo;
    if (telefono && telefono.trim() !== '') updateData.telefono = telefono;
    if (nacionalidad) updateData.nacionalidad = nacionalidad;

    // Actualizar el usuario
    const updatedUser = await userRepository.update(id, updateData);

    if (!updatedUser) {
      return NextResponse.json({
        success: false,
        message: 'Error al actualizar usuario'
      }, { status: 500 });
    }

    const updatedUserData = updatedUser.toPlainObject();
    const { password: _pwd2, ...usuarioActualizadoSinPassword } = updatedUserData as any;

    return NextResponse.json({
      success: true,
      data: usuarioActualizadoSinPassword,
      message: 'Usuario actualizado exitosamente'
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
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    // Validar parámetros
    const paramValidation = validateData(usuarioParamsSchema, { id: params.id });
    if (!paramValidation.success) {
      return NextResponse.json({
        success: false,
        message: 'ID de usuario inválido',
        error: paramValidation.error
      }, { status: 400 });
    }

    const { id } = paramValidation.data;

    // Obtener servicios (LDAP o Supabase según configuración)
    const { userRepository } = await getServices();

    // Verificar si el usuario existe
    const existingUser = await userRepository.findById(id);

    if (!existingUser) {
      return NextResponse.json({
        success: false,
        message: 'Usuario no encontrado'
      }, { status: 404 });
    }

    // Eliminar el usuario
    const deleted = await userRepository.delete(id);

    if (!deleted) {
      return NextResponse.json({
        success: false,
        message: 'Error al eliminar usuario'
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Usuario eliminado exitosamente'
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
