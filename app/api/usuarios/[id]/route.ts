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
import { prisma } from '@/lib/db';
import { updateUsuarioSchema, usuarioParamsSchema, validateData } from '@/lib/validations';
import { hashPassword, validatePasswordStrength } from '@/lib/auth';

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

    const usuario = await prisma.usuarios.findUnique({ id });

    if (!usuario) {
      return NextResponse.json({
        success: false,
        message: 'Usuario no encontrado'
      }, { status: 404 });
    }

    // Remover la contraseña de la respuesta
    const { password: _, ...usuarioWithoutPassword } = usuario;

    return NextResponse.json({
      success: true,
      data: usuarioWithoutPassword,
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
      const emailInUse = await prisma.usuarios.findFirst({ email: email });

      if (emailInUse) {
        return NextResponse.json({
          success: false,
          message: 'Ya existe un usuario con este email'
        }, { status: 409 });
      }
    }

    // Preparar datos para actualizar
    const updateData: any = {};
    if (nombre_completo !== undefined) updateData.nombre_completo = nombre_completo;
    if (email) updateData.email = email;
    if (password) updateData.password = await hashPassword(password);
    if (rol) updateData.rol = rol;
    if (email_verified !== undefined) updateData.email_verified = email_verified;
    if (nacionalidad !== undefined) updateData.nacionalidad = nacionalidad;

    // Actualizar el usuario
    const updatedUser = await prisma.usuarios.update(
      { id },
      updateData
    );

    // Remover la contraseña de la respuesta
    const { password: _, ...userWithoutPassword } = updatedUser;

    return NextResponse.json({
      success: true,
      data: userWithoutPassword,
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
