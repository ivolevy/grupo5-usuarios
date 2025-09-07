import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { updateUsuarioSchema, usuarioParamsSchema, validateData } from '@/lib/validations';
import { hashPassword, validatePasswordStrength } from '@/lib/auth';

// GET /api/usuarios/[id] - Obtener usuario por ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
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

    const usuario = await prisma.usuarios.findUnique({ id });

    if (!usuario) {
      return NextResponse.json({
        success: false,
        message: 'Usuario no encontrado'
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: usuario,
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
  { params }: { params: { id: string } }
) {
  try {
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

    const { email, password, rol } = validation.data;

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
    const existingUser = await prisma.usuarios.findUnique({ id });

    if (!existingUser) {
      return NextResponse.json({
        success: false,
        message: 'Usuario no encontrado'
      }, { status: 404 });
    }

    // Si se proporciona un nuevo email, verificar que no esté en uso
    if (email && email !== existingUser.email) {
      const emailInUse = await prisma.usuarios.findFirst({ email });

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

    // Actualizar el usuario
    const updatedUser = await prisma.usuarios.update(
      { id },
      updateData
    );

    return NextResponse.json({
      success: true,
      data: updatedUser,
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
  { params }: { params: { id: string } }
) {
  try {
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

    // Verificar si el usuario existe
    const existingUser = await prisma.usuarios.findUnique({ id });

    if (!existingUser) {
      return NextResponse.json({
        success: false,
        message: 'Usuario no encontrado'
      }, { status: 404 });
    }

    // Eliminar el usuario
    await prisma.usuarios.delete({ id });

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
