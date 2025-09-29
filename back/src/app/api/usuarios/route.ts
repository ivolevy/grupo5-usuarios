import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { createUsuarioSchema, validateData } from '@/lib/validations';
import { hashPassword, validatePasswordStrength } from '@/lib/auth';
import { HybridUserServiceImpl } from '../../../infrastructure/services/hybrid-user.service.impl';

// GET /api/usuarios - Obtener todos los usuarios (LDAP + Supabase fallback)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const rol = searchParams.get('rol') as any;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    const hybridService = new HybridUserServiceImpl();
    
    const result = await hybridService.getAllUsers({
      page,
      limit,
      search: search || undefined,
      rol: rol || undefined
    });

    if (!result.success) {
      return NextResponse.json({
        success: false,
        message: 'Error al obtener usuarios',
        error: result.error
      }, { status: 500 });
    }

    // Sanitizar usuarios (remover password)
    const usuariosSanitizados = result.data?.map(user => ({
      id: user.id,
      nombre_completo: user.nombre_completo,
      email: user.email,
      rol: user.rol,
      email_verified: user.email_verified,
      created_at: user.created_at,
      updated_at: user.updated_at,
      last_login_at: user.last_login_at,
      telefono: user.telefono
    })) || [];

    return NextResponse.json({
      success: true,
      data: usuariosSanitizados,
      count: result.pagination?.total || usuariosSanitizados.length,
      pagination: result.pagination,
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

// POST /api/usuarios - Crear nuevo usuario (LDAP + Supabase fallback)
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

    const { email, password, rol, nombre_completo } = validation.data;

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

    const hybridService = new HybridUserServiceImpl();

    // Crear el usuario usando el servicio híbrido
    const result = await hybridService.createUser({
      email,
      password, // El servicio se encarga del hash
      rol: rol || 'usuario',
      nombre_completo: nombre_completo || email.split('@')[0]
    });

    if (!result.success) {
      return NextResponse.json({
        success: false,
        message: result.error?.includes('already exists') ? 'Ya existe un usuario con este email' : 'Error al crear usuario',
        error: result.error
      }, { status: result.error?.includes('already exists') ? 409 : 500 });
    }

    // Sanitizar usuario (remover password)
    const userWithoutPassword = {
      id: result.data!.id,
      nombre_completo: result.data!.nombre_completo,
      email: result.data!.email,
      rol: result.data!.rol,
      email_verified: result.data!.email_verified,
      created_at: result.data!.created_at,
      updated_at: result.data!.updated_at,
      telefono: result.data!.telefono
    };

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