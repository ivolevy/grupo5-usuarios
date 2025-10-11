import { NextRequest, NextResponse } from 'next/server';
import { createUsuarioSchema, validateData } from '@/lib/validations';
import { hashPassword, validatePasswordStrength } from '@/lib/auth';
import { getServices } from '@/lib/database-config';

// GET /api/usuarios - Obtener todos los usuarios
export async function GET() {
  try {
    // Obtener servicios (LDAP o Supabase según configuración)
    const { userRepository } = await getServices();

    // Obtener todos los usuarios
    const result = await userRepository.findAll({
      page: 1,
      limit: 1000 // Obtener todos los usuarios
    });

    const usuariosSanitizados = result.users.map(user => {
      const userData = user.toPlainObject();
      // Remover password si existe
      const { password, ...rest } = userData as any;
      return rest;
    });

    return NextResponse.json({
      success: true,
      data: usuariosSanitizados,
      count: usuariosSanitizados.length,
      message: 'Usuarios obtenidos exitosamente'
    });
  } catch (error) {
    console.error('Error al obtener usuarios:', error);
    return NextResponse.json({
      success: false,
      message: 'Error al obtener usuarios',
      error: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
}

// POST /api/usuarios - Crear nuevo usuario
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validar datos de entrada
    const validation = validateData(createUsuarioSchema, body);
    if (!validation.success) {
      return NextResponse.json({
        success: false,
        message: 'Datos de entrada inválidos',
        error: validation.error
      }, { status: 400 });
    }

    const { email, password, rol } = validation.data;

    // Validar fortaleza de la contraseña
    const passwordValidation = validatePasswordStrength(password);
    if (!passwordValidation.isValid) {
      return NextResponse.json({
        success: false,
        message: 'La contraseña no cumple con los requisitos de seguridad',
        error: passwordValidation.feedback.join(', '),
        passwordStrength: {
          score: passwordValidation.score,
          maxScore: 5,
          feedback: passwordValidation.feedback
        }
      }, { status: 400 });
    }

    // Obtener servicios (LDAP o Supabase según configuración)
    const { userRepository } = await getServices();

    // Verificar si el usuario ya existe
    const existingUser = await userRepository.findByEmail(email);

    if (existingUser) {
      return NextResponse.json({
        success: false,
        message: 'Ya existe un usuario con este email'
      }, { status: 409 });
    }

    // Hashear la contraseña con mayor seguridad
    const hashedPassword = await hashPassword(password);

    // Crear el usuario
    const newUser = await userRepository.create({
      email,
      password: hashedPassword,
      rol: rol || 'usuario',
      email_verified: true // Sin verificación por email
    });

    // Remover password de la respuesta
    const userData = newUser.toPlainObject();
    const { password: _, ...userWithoutPassword } = userData as any;

    return NextResponse.json({
      success: true,
      data: userWithoutPassword,
      message: 'Usuario creado exitosamente.'
    }, { status: 201 });

  } catch (error) {
    console.error('Error al crear usuario:', error);
    return NextResponse.json({
      success: false,
      message: 'Error al crear usuario',
      error: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
}