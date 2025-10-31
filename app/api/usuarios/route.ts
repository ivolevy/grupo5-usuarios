/**
 * @openapi
 * /api/usuarios:
 *   get:
 *     tags: [usuarios]
 *     summary: List users
 *     responses:
 *       200:
 *         description: Users list
 *   post:
 *     tags: [usuarios]
 *     summary: Create user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [nombre_completo, email, password, nacionalidad]
 *             properties:
 *               nombre_completo:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *               rol:
 *                 type: string
 *                 enum: [admin, interno, usuario]
 *               nacionalidad:
 *                 type: string
 *               telefono:
 *                 type: string
 *     responses:
 *       201:
 *         description: User created
 *       400:
 *         description: Validation error
 *       409:
 *         description: Email already in use
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { createUsuarioSchema, validateData } from '@/lib/validations';
import { hashPassword } from '@/lib/auth';
import { sendUserCreatedEvent } from '@/lib/kafka-api-sender';
import { logger } from '@/lib/logger';

// GET /api/usuarios - Obtener todos los usuarios
export async function GET() {
  try {
    const usuarios = await prisma.usuarios.findMany();

    return NextResponse.json({
      success: true,
      data: usuarios,
      count: usuarios.length,
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
    console.log('Datos recibidos para registro:', body);
    
    // Validar datos de entrada
    const validation = validateData(createUsuarioSchema, body);
    if (!validation.success) {
      console.log('Error de validación:', validation.error);
      return NextResponse.json({
        success: false,
        message: 'Datos de entrada inválidos',
        error: validation.error
      }, { status: 400 });
    }

    const { nombre_completo, email, password, rol, nacionalidad, telefono, created_by_admin } = validation.data;

    // Validación simple de contraseña (solo longitud mínima)
    if (password.length < 8) {
      return NextResponse.json({
        success: false,
        message: 'La contraseña debe tener al menos 8 caracteres'
      }, { status: 400 });
    }

    // Verificar si el usuario ya existe
    const existingUser = await prisma.usuarios.findFirst({ email: email });

    if (existingUser) {
      return NextResponse.json({
        success: false,
        message: 'Ya existe un usuario con este email'
      }, { status: 409 });
    }

    // Hashear la contraseña con mayor seguridad
    const hashedPassword = await hashPassword(password);

    // Crear el usuario
    const newUser = await prisma.usuarios.create({
      nombre_completo,
      email,
      password: hashedPassword,
      rol: rol || 'usuario',
      email_verified: true, // Sin verificación por email
      nacionalidad,
      telefono,
      created_by_admin: created_by_admin ?? false // Por defecto false si no se especifica
    });

    // Enviar evento a Kafka (no bloquear la respuesta si falla)
    try {
      const kafkaSuccess = await sendUserCreatedEvent({
        userId: newUser.id,
        nationalityOrOrigin: newUser.nacionalidad || 'No especificada',
        roles: [newUser.rol],
        createdAt: newUser.created_at,
      });

      if (kafkaSuccess) {
        logger.info('Evento de usuario creado enviado a Kafka', {
          action: 'user_created_kafka_success',
          userId: newUser.id
        });
      } else {
        logger.warn('Evento de usuario creado no pudo ser enviado a Kafka', {
          action: 'user_created_kafka_failed',
          userId: newUser.id
        });
      }
    } catch (kafkaError) {
      // Log el error pero no fallar la creación del usuario
      logger.error('Error enviando evento a Kafka (no crítico)', {
        action: 'user_created_kafka_error',
        userId: newUser.id,
        message: kafkaError instanceof Error ? kafkaError.message : 'Error desconocido'
      });
    }

    // Remover password de la respuesta
    const { password: _, ...userWithoutPassword } = newUser;

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