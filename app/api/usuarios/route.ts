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
import { sendUserCreatedEvent, sendUserDatabaseInsertedEvent } from '@/lib/kafka-api-sender';
import { logger } from '@/lib/logger';
import { randomUUID } from 'crypto';
import { verifyJWTMiddleware } from '@/lib/middleware';

/**
 * Función helper para actualizar usuario con reintentos y manejo robusto de errores
 */
async function updateUserWithRetry(
  userId: string,
  updateData: { email_verified: boolean },
  maxRetries: number = 5,
  initialDelay: number = 1000
): Promise<any> {
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // Verificar que el usuario existe antes de actualizar
      const existingUser = await prisma.usuarios.findUnique({ id: userId });
      
      if (!existingUser) {
        throw new Error(`Usuario con ID ${userId} no encontrado`);
      }

      // Intentar actualizar
      const updatedUser = await prisma.usuarios.update(
        { id: userId },
        updateData
      );

      logger.info('Usuario actualizado exitosamente con reintentos', {
        action: 'user_update_with_retry_success',
        data: {
          userId: userId,
          attempt: attempt,
          email: updatedUser.email,
          emailVerified: updatedUser.email_verified
        }
      });

      return updatedUser;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      const errorMessage = lastError.message;
      
      // Log del intento fallido
      logger.warn('Intento de actualización fallido, reintentando...', {
        action: 'user_update_retry_attempt',
        data: {
          userId: userId,
          attempt: attempt,
          maxRetries: maxRetries,
          error: errorMessage,
          willRetry: attempt < maxRetries
        }
      });

      // Si no es el último intento, esperar antes de reintentar (backoff exponencial)
      if (attempt < maxRetries) {
        const delay = initialDelay * Math.pow(2, attempt - 1); // Backoff exponencial: 1s, 2s, 4s, 8s, 16s
        logger.info(`Esperando ${delay}ms antes del siguiente intento...`, {
          action: 'user_update_retry_delay',
          data: { userId, attempt, delay }
        });
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  // Si llegamos aquí, todos los intentos fallaron
  throw new Error(
    `No se pudo actualizar el usuario después de ${maxRetries} intentos. Último error: ${lastError?.message}`
  );
}

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
    const normalizedRole = rol || 'usuario';
    const shouldAutoVerifyEmail = normalizedRole !== 'usuario';

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
      // IMPORTANTE: LDAP necesita la contraseña en texto plano para userPassword
      // El cliente LDAP generará automáticamente el hash bcrypt y lo guardará en metadatos
      // Esto permite que LDAP autentique con texto plano y la app verifique con bcrypt
      // NOTA: El cliente LDAP no usa la sintaxis { data: {...} } de Prisma, pasa los datos directamente
      const newUser = await prisma.usuarios.create({
        id: userId,
        nombre_completo: nombre_completo || 'Usuario sin nombre',
        email: email,
        password: password, // Texto plano para LDAP - el cliente generará hash bcrypt en metadatos
        rol: normalizedRole,
        nacionalidad: nacionalidad || 'No especificada',
        telefono: telefono || undefined,
        email_verified: shouldAutoVerifyEmail,
        created_at: createdAt,
        updated_at: createdAt,
        created_by_admin: created_by_admin ?? false,
        initial_password_changed: false
      });

      logger.info('Usuario creado exitosamente en LDAP (no verificado)', {
        action: 'user_created_ldap_success',
        data: {
          userId: userId,
          email: email,
          emailVerified: newUser.email_verified
        }
      });

      // Para usuarios normales (no admin/interno), ejecutar verificación automática después de 15 segundos en background
      if (!shouldAutoVerifyEmail) {
        // Ejecutar en background sin bloquear la respuesta
        // Usar setImmediate para asegurar que se ejecute después de que la respuesta se envíe
        setImmediate(async () => {
          try {
            logger.info('Iniciando proceso de verificación automática después de 15 segundos', {
              action: 'user_auto_verification_start',
              data: {
                userId: userId,
                email: email,
                timestamp: new Date().toISOString()
              }
            });

            // Esperar 15 segundos
            await new Promise(resolve => setTimeout(resolve, 15000));

            logger.info('Completada espera de 15 segundos, iniciando actualización con reintentos', {
              action: 'user_auto_verification_delay_complete',
              data: {
                userId: userId,
                email: email,
                timestamp: new Date().toISOString()
              }
            });

            // Actualizar el usuario a verificado con reintentos
            let updatedUser;
            try {
              updatedUser = await updateUserWithRetry(
                userId,
                { email_verified: true },
                5, // 5 intentos máximo
                2000 // Delay inicial de 2 segundos
              );

              logger.info('Usuario actualizado a verificado después de 15 segundos (con reintentos)', {
                action: 'user_auto_verified_after_delay',
                data: {
                  userId: updatedUser.id,
                  email: updatedUser.email,
                  emailVerified: true,
                  timestamp: new Date().toISOString()
                }
              });
            } catch (updateError) {
              logger.error('Error crítico: No se pudo actualizar el usuario después de múltiples intentos', {
                action: 'user_auto_verification_update_failed',
                data: {
                  userId: userId,
                  email: email,
                  error: updateError instanceof Error ? updateError.message : 'Error desconocido',
                  timestamp: new Date().toISOString()
                }
              });
              // Intentar una vez más después de un delay más largo
              await new Promise(resolve => setTimeout(resolve, 5000));
              try {
                updatedUser = await prisma.usuarios.update(
                  { id: userId },
                  { email_verified: true }
                );
                logger.info('Usuario actualizado exitosamente en intento final', {
                  action: 'user_auto_verification_final_attempt_success',
                  data: { userId, email: updatedUser.email }
                });
              } catch (finalError) {
                logger.error('Error en intento final de actualización', {
                  action: 'user_auto_verification_final_attempt_failed',
                  data: {
                    userId,
                    email,
                    error: finalError instanceof Error ? finalError.message : 'Error desconocido'
                  }
                });
                return; // Salir si falla el intento final
              }
            }

            // Enviar evento de inserción en base de datos a Kafka con reintentos
            let kafkaSuccess = false;
            const kafkaMaxRetries = 3;
            
            for (let kafkaAttempt = 1; kafkaAttempt <= kafkaMaxRetries; kafkaAttempt++) {
              try {
                const dbInsertedSuccess = await sendUserDatabaseInsertedEvent({
                  email: updatedUser.email,
                  createdAt: updatedUser.created_at
                });

                if (dbInsertedSuccess) {
                  kafkaSuccess = true;
                  logger.info('Evento de usuario insertado en base de datos enviado a Kafka', {
                    action: 'user_database_inserted_kafka_success',
                    data: {
                      userId: updatedUser.id,
                      email: updatedUser.email,
                      emailVerified: true,
                      kafkaAttempt: kafkaAttempt
                    }
                  });
                  break; // Salir del loop si fue exitoso
                } else {
                  logger.warn(`Intento ${kafkaAttempt} de enviar evento a Kafka falló, reintentando...`, {
                    action: 'user_database_inserted_kafka_retry',
                    data: {
                      userId: updatedUser.id,
                      email: updatedUser.email,
                      kafkaAttempt: kafkaAttempt,
                      maxRetries: kafkaMaxRetries
                    }
                  });
                  
                  if (kafkaAttempt < kafkaMaxRetries) {
                    await new Promise(resolve => setTimeout(resolve, 2000 * kafkaAttempt));
                  }
                }
              } catch (dbInsertedError) {
                logger.warn(`Excepción en intento ${kafkaAttempt} de enviar evento a Kafka`, {
                  action: 'user_database_inserted_kafka_error_retry',
                  data: {
                    userId: updatedUser.id,
                    email: updatedUser.email,
                    kafkaAttempt: kafkaAttempt,
                    error: dbInsertedError instanceof Error ? dbInsertedError.message : 'Error desconocido'
                  }
                });
                
                if (kafkaAttempt < kafkaMaxRetries) {
                  await new Promise(resolve => setTimeout(resolve, 2000 * kafkaAttempt));
                }
              }
            }

            if (!kafkaSuccess) {
              logger.warn('No se pudo enviar evento a Kafka después de múltiples intentos, pero usuario ya creado y verificado', {
                action: 'user_database_inserted_kafka_failed_after_retries',
                data: {
                  userId: updatedUser.id,
                  email: updatedUser.email,
                  maxRetries: kafkaMaxRetries
                }
              });
            }
          } catch (error) {
            logger.error('Error crítico en proceso de verificación automática', {
              action: 'user_auto_verification_critical_error',
              data: {
                userId: userId,
                email: email,
                error: error instanceof Error ? error.message : 'Error desconocido',
                stack: error instanceof Error ? error.stack : undefined,
                timestamp: new Date().toISOString()
              }
            });
          }
        });
      } else {
        // Para usuarios admin/interno, enviar evento inmediatamente (ya están verificados)
      try {
        const dbInsertedSuccess = await sendUserDatabaseInsertedEvent({
          email: email,
          createdAt: createdAt
        });

        if (dbInsertedSuccess) {
          logger.info('Evento de usuario insertado en base de datos enviado a Kafka', {
            action: 'user_database_inserted_kafka_success',
            data: {
              userId: userId,
              email: email
            }
          });
        } else {
          logger.warn('Error enviando evento de inserción en BD a Kafka, pero usuario ya creado en LDAP', {
            action: 'user_database_inserted_kafka_failed_non_critical',
            data: {
              userId: userId,
              email: email
            }
          });
        }
      } catch (dbInsertedError) {
        logger.warn('Excepción enviando evento de inserción en BD a Kafka, pero usuario ya creado en LDAP', {
          action: 'user_database_inserted_kafka_error_non_critical',
          data: {
            userId: userId,
            email: email,
            message: dbInsertedError instanceof Error ? dbInsertedError.message : 'Error desconocido'
          }
        });
        }
      }

      // PASO 3: Enviar evento a Kafka - El consumer intentará crear el usuario pero ya existirá
      try {
        // Preparar datos del evento
        const eventData: Parameters<typeof sendUserCreatedEvent>[0] = {
          userId: userId,
          nombre_completo: nombre_completo || 'Usuario sin nombre',
          email: email,
          password: password, // Contraseña original
          nationalityOrOrigin: nacionalidad || 'No especificada',
          roles: [normalizedRole],
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