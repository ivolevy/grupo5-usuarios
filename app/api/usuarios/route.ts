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
import { sendUserCreatedEvent } from '@/lib/kafka-api-sender';
import { logger } from '@/lib/logger';
import { randomUUID } from 'crypto';

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

    // Generar un userId único para el nuevo usuario
    const userId = randomUUID();
    const createdAt = new Date().toISOString();

    // Enviar evento a Kafka - El consumer creará el usuario
    // ⚠️ ADVERTENCIA: Se envía la contraseña en texto plano según el schema requerido
    try {
      // Preparar datos del evento
      const eventData: Parameters<typeof sendUserCreatedEvent>[0] = {
        userId: userId,
        nombre_completo: nombre_completo || 'Usuario sin nombre', // Asegurar que no sea undefined
        email: email,
        password: password, // Contraseña original (será hasheada por el consumer)
        nationalityOrOrigin: nacionalidad || 'No especificada',
        roles: [rol || 'usuario'],
        createdAt: createdAt,
      };

      // Agregar telefono solo si existe
      if (telefono) {
        eventData.telefono = telefono;
      }

      const kafkaSuccess = await sendUserCreatedEvent(eventData);

      if (kafkaSuccess) {
        logger.info('Evento de usuario creado enviado a Kafka', {
          action: 'user_created_kafka_success',
          data: {
            userId: userId,
            email: email
          }
        });

        // Retornar respuesta exitosa - El consumer procesará el evento y creará el usuario
        return NextResponse.json({
          success: true,
          data: {
            id: userId,
            nombre_completo,
            email,
            rol: rol || 'usuario',
            nacionalidad: nacionalidad || 'No especificada',
            telefono: telefono || null,
            email_verified: true,
            created_at: createdAt,
            updated_at: createdAt,
            created_by_admin: created_by_admin ?? false
          },
          message: 'Solicitud de registro enviada. El usuario se creará en breve.'
        }, { status: 202 }); // 202 Accepted - Procesamiento asíncrono
      } else {
        // Si falla Kafka, retornar error
        logger.error('Error enviando evento a Kafka', {
          action: 'user_created_kafka_failed',
          data: {
            userId: userId,
            email: email
          }
        });

        return NextResponse.json({
          success: false,
          message: 'Error al procesar la solicitud de registro. Intenta nuevamente.'
        }, { status: 500 });
      }
    } catch (kafkaError) {
      // Log el error y retornar error
      logger.error('Error enviando evento a Kafka', {
        action: 'user_created_kafka_error',
        data: {
          userId: userId,
          email: email,
          message: kafkaError instanceof Error ? kafkaError.message : 'Error desconocido'
        }
      });

      return NextResponse.json({
        success: false,
        message: 'Error al procesar la solicitud de registro. Intenta nuevamente.',
        error: kafkaError instanceof Error ? kafkaError.message : 'Error desconocido'
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Error al crear usuario:', error);
    return NextResponse.json({
      success: false,
      message: 'Error al crear usuario',
      error: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
}