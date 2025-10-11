import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { validateData } from '@/lib/validations';
import { getServices } from '@/lib/database-config';

// Schema para login
const loginSchema = z.object({
  email: z
    .string()
    .email('Debe ser un email válido')
    .min(1, 'El email es requerido'),
  password: z
    .string()
    .min(1, 'La contraseña es requerida'),
});

// POST /api/auth/login - Login de usuario con JWT
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validar datos de entrada
    const validation = validateData(loginSchema, body);
    if (!validation.success) {
      return NextResponse.json({
        success: false,
        message: 'Datos de entrada inválidos',
        error: validation.error
      }, { status: 400 });
    }

    const { email, password } = validation.data;

    // Obtener servicios (LDAP o Supabase según configuración)
    const { authService } = await getServices();

    // Autenticar usuario
    const authResponse = await authService.authenticate({ email, password });

    return NextResponse.json({
      success: true,
      message: 'Login exitoso',
      data: authResponse
    });

  } catch (error) {
    console.error('Error en login:', error);
    return NextResponse.json({
      success: false,
      message: error instanceof Error ? error.message : 'Error interno del servidor'
    }, { status: 500 });
  }
}
