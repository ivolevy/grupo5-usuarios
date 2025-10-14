/**
 * @openapi
 * /api/auth/login:
 *   post:
 *     tags: [auth]
 *     summary: User login with email and password
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 *       400:
 *         description: Validation error
 *       401:
 *         description: Invalid credentials
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyPassword, generateJWT } from '@/lib/auth';
import { z } from 'zod';
import { validateData } from '@/lib/validations';

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

    // Buscar el usuario por email (incluyendo password para verificación)
    const user = await prisma.usuarios.findFirst({ email });

    if (!user) {
      return NextResponse.json({
        success: false,
        message: 'Credenciales inválidas'
      }, { status: 401 });
    }

    // Verificar la contraseña
    const isPasswordValid = await verifyPassword(password, user.password);

    if (!isPasswordValid) {
      return NextResponse.json({
        success: false,
        message: 'Credenciales inválidas'
      }, { status: 401 });
    }

    // Actualizar último login
    await prisma.usuarios.update(
      { id: user.id },
      {
        last_login_at: new Date().toISOString()
      }
    );

    // Generar JWT
    const token = generateJWT({
      userId: user.id,
      email: user.email,
      rol: user.rol
    });

    // Retornar datos del usuario y token (sin password)
    const { password: _, ...userWithoutPassword } = user;

    return NextResponse.json({
      success: true,
      message: 'Login exitoso',
      data: {
        user: userWithoutPassword,
        token,
        tokenType: 'Bearer',
        expiresIn: '24h'
      }
    });

  } catch (error) {
    console.error('Error en login:', error);
    return NextResponse.json({
      success: false,
      message: 'Error interno del servidor',
      error: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
}
