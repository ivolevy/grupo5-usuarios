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
import { hashPassword } from '@/lib/auth';
import { verifyJWTMiddleware } from '@/lib/middleware';

// GET /api/usuarios - Obtener todos los usuarios (requiere autenticación)
export async function GET(request: NextRequest) {
  try {
    // Verificar autenticación
    const authResult = verifyJWTMiddleware(request);
    if (!authResult.success || !authResult.user) {
      return NextResponse.json({
        success: false,
        message: 'Autenticación requerida'
      }, { status: 401 });
    }

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

    // Verificar si el usuario ya existe por email
    const existingUser = await prisma.usuarios.findFirst({ email: email });

    if (existingUser) {
      logger.warn('Intento de crear usuario con email duplicado', {
        action: 'user_creation_duplicate_email',
        data: { 
          email: email,
          existingUserId: existingUser.id,
          attemptedBy: 'admin'
        }
      });
      
      return NextResponse.json({
        success: false,
        message: 'Ya existe un usuario con este email'
      }, { status: 409 });
    }

    // Generar un userId único para el nuevo usuario
    const userId = randomUUID();
    const createdAt = new Date().toISOString();

    // PASO 1: Crear el usuario directamente en LDAP
    try {
      const hashedPassword = await hashPassword(password);
      const newUser = await prisma.usuarios.create({
        data: {
          id: userId,
          nombre_completo: nombre_completo || 'Usuario sin nombre',
          email: email,
          password: hashedPassword, // Guardar contraseña hasheada en LDAP
          rol: rol || 'usuario',
          nacionalidad: nacionalidad || 'No especificada',
          telefono: telefono || undefined,
          email_verified: true,
          created_at: createdAt,
          updated_at: createdAt,
          created_by_admin: created_by_admin ?? false,
          initial_password_changed: false
        }
      });

      logger.info('Usuario creado exitosamente en LDAP', {
        action: 'user_created_ldap_success',
        data: {
          userId: userId,
          email: email
        }
      });

      // PASO 2: Enviar evento a Kafka - El consumer intentará crear el usuario pero ya existirá
      try {
        // Preparar datos del evento
        const eventData: Parameters<typeof sendUserCreatedEvent>[0] = {
          userId: userId,
          nombre_completo: nombre_completo || 'Usuario sin nombre',
          email: email,
          password: password, // Contraseña original
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
        } else {
          // Log warning pero no fallar - el usuario ya fue creado en LDAP
          logger.warn('Error enviando evento a Kafka, pero usuario ya creado en LDAP', {
            action: 'user_created_kafka_failed_non_critical',
            data: {
              userId: userId,
              email: email
            }
          });
        }
      } catch (kafkaError) {
        // Log warning pero no fallar - el usuario ya fue creado en LDAP
        logger.warn('Excepción enviando evento a Kafka, pero usuario ya creado en LDAP', {
          action: 'user_created_kafka_error_non_critical',
          data: {
            userId: userId,
            email: email,
            message: kafkaError instanceof Error ? kafkaError.message : 'Error desconocido'
          }
        });
      }

      // Retornar respuesta exitosa con el usuario creado
      return NextResponse.json({
        success: true,
        data: {
          id: newUser.id,
          nombre_completo: newUser.nombre_completo,
          email: newUser.email,
          rol: newUser.rol,
          nacionalidad: newUser.nacionalidad,
          telefono: newUser.telefono || null,
          email_verified: newUser.email_verified,
          created_at: newUser.created_at,
          updated_at: newUser.updated_at,
          created_by_admin: newUser.created_by_admin
        },
        message: 'Usuario creado exitosamente'
      }, { status: 201 }); // 201 Created

    } catch (ldapError: any) {
      // Si falla la creación en LDAP, verificar si es por email duplicado
      const errorMessage = ldapError instanceof Error ? ldapError.message : 'Error desconocido';
      
      // Prisma lanza error con código P2002 cuando hay violación de constraint único
      const isDuplicateError = ldapError?.code === 'P2002' || 
                               errorMessage.includes('unique constraint') ||
                               errorMessage.includes('Unique constraint');
      
      logger.error('Error creando usuario en LDAP', {
        action: 'user_created_ldap_failed',
        data: {
          userId: userId,
          email: email,
          message: errorMessage,
          code: ldapError?.code,
          isDuplicate: isDuplicateError
        }
      });

      if (isDuplicateError) {
        return NextResponse.json({
          success: false,
          message: 'Ya existe un usuario con este email'
        }, { status: 409 });
      }

      return NextResponse.json({
        success: false,
        message: 'Error al crear usuario en LDAP',
        error: errorMessage
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