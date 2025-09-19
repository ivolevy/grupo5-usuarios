/**
 * Controlador de Usuarios - Capa de Presentación
 * Maneja las peticiones HTTP relacionadas con usuarios
 */

import { NextRequest, NextResponse } from 'next/server';
import { UserService } from '../../domain/services/user.service.interface';
import { CreateUserDto, UpdateUserDto, UserRole } from '../../types/common.types';
import { validateData } from '../../infrastructure/validation/validation.service';
import { z } from 'zod';

// Schemas de validación
const createUserSchema = z.object({
  nombre_completo: z.string().min(1, 'El nombre completo es requerido'),
  email: z.string().email('Debe ser un email válido'),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
  rol: z.enum(['admin', 'moderador', 'usuario']).optional(),
  telefono: z.string().optional(),
});

const updateUserSchema = z.object({
  nombre_completo: z.string().min(1, 'El nombre completo es requerido').optional(),
  email: z.string().email('Debe ser un email válido').optional(),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres').optional(),
  rol: z.enum(['admin', 'moderador', 'usuario']).optional(),
  email_verified: z.boolean().optional(),
  telefono: z.string().optional(),
});

const userParamsSchema = z.object({
  id: z.string().min(1, 'ID de usuario requerido'),
});

export class UserController {
  constructor(private userService: UserService) {}

  /**
   * Obtiene todos los usuarios con paginación y filtros
   */
  async getUsers(request: NextRequest): Promise<NextResponse> {
    try {
      const { searchParams } = new URL(request.url);
      
      const options = {
        page: searchParams.get('page') ? parseInt(searchParams.get('page')!) : 1,
        limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 10,
        search: searchParams.get('search') || undefined,
        rol: searchParams.get('rol') as UserRole || undefined,
        email_verified: searchParams.get('email_verified') ? 
          searchParams.get('email_verified') === 'true' : undefined,
      };

      const result = await this.userService.getUsers(options);

      return NextResponse.json({
        success: true,
        data: result.users.map(user => user.toPlainObject()),
        pagination: {
          page: result.page,
          limit: result.limit,
          total: result.total,
          totalPages: Math.ceil(result.total / result.limit)
        },
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

  /**
   * Crea un nuevo usuario
   */
  async createUser(request: NextRequest): Promise<NextResponse> {
    try {
      const body = await request.json();
      
      // Validar datos de entrada
      const validation = validateData(createUserSchema, body);
      if (!validation.success) {
        return NextResponse.json({
          success: false,
          message: 'Datos de entrada inválidos',
          error: validation.error
        }, { status: 400 });
      }

      const userData: CreateUserDto = validation.data;

      // Crear usuario
      const newUser = await this.userService.createUser(userData);

      return NextResponse.json({
        success: true,
        data: newUser.toPlainObject(),
        message: 'Usuario creado exitosamente'
      }, { status: 201 });

    } catch (error) {
      console.error('Error al crear usuario:', error);
      return NextResponse.json({
        success: false,
        message: error instanceof Error ? error.message : 'Error al crear usuario',
        error: error instanceof Error ? error.message : 'Error desconocido'
      }, { status: 500 });
    }
  }

  /**
   * Obtiene un usuario por ID
   */
  async getUserById(request: NextRequest, params: { id: string }): Promise<NextResponse> {
    try {
      // Validar parámetros
      const paramValidation = validateData(userParamsSchema, params);
      if (!paramValidation.success) {
        return NextResponse.json({
          success: false,
          message: 'ID de usuario inválido',
          error: paramValidation.error
        }, { status: 400 });
      }

      const { id } = paramValidation.data;

      // Obtener usuario
      const user = await this.userService.getUserById(id);

      if (!user) {
        return NextResponse.json({
          success: false,
          message: 'Usuario no encontrado'
        }, { status: 404 });
      }

      return NextResponse.json({
        success: true,
        data: user.toPlainObject(),
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

  /**
   * Actualiza un usuario por ID
   */
  async updateUser(request: NextRequest, params: { id: string }): Promise<NextResponse> {
    try {
      // Validar parámetros
      const paramValidation = validateData(userParamsSchema, params);
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
      const validation = validateData(updateUserSchema, body);
      if (!validation.success) {
        return NextResponse.json({
          success: false,
          message: 'Datos de entrada inválidos',
          error: validation.error
        }, { status: 400 });
      }

      const userData: UpdateUserDto = validation.data;

      // Actualizar usuario
      const updatedUser = await this.userService.updateUser(id, userData);

      if (!updatedUser) {
        return NextResponse.json({
          success: false,
          message: 'Usuario no encontrado'
        }, { status: 404 });
      }

      return NextResponse.json({
        success: true,
        data: updatedUser.toPlainObject(),
        message: 'Usuario actualizado exitosamente'
      });

    } catch (error) {
      console.error('Error al actualizar usuario:', error);
      return NextResponse.json({
        success: false,
        message: error instanceof Error ? error.message : 'Error al actualizar usuario',
        error: error instanceof Error ? error.message : 'Error desconocido'
      }, { status: 500 });
    }
  }

  /**
   * Elimina un usuario por ID
   */
  async deleteUser(request: NextRequest, params: { id: string }): Promise<NextResponse> {
    try {
      // Validar parámetros
      const paramValidation = validateData(userParamsSchema, params);
      if (!paramValidation.success) {
        return NextResponse.json({
          success: false,
          message: 'ID de usuario inválido',
          error: paramValidation.error
        }, { status: 400 });
      }

      const { id } = paramValidation.data;

      // Eliminar usuario
      const deleted = await this.userService.deleteUser(id);

      if (!deleted) {
        return NextResponse.json({
          success: false,
          message: 'Usuario no encontrado'
        }, { status: 404 });
      }

      return NextResponse.json({
        success: true,
        message: 'Usuario eliminado exitosamente'
      });

    } catch (error) {
      console.error('Error al eliminar usuario:', error);
      return NextResponse.json({
        success: false,
        message: error instanceof Error ? error.message : 'Error al eliminar usuario',
        error: error instanceof Error ? error.message : 'Error desconocido'
      }, { status: 500 });
    }
  }

  /**
   * Obtiene el perfil del usuario autenticado
   */
  async getUserProfile(request: NextRequest): Promise<NextResponse> {
    try {
      // Obtener ID del usuario desde el token (esto debería venir del middleware)
      const userId = request.headers.get('x-user-id');
      
      if (!userId) {
        return NextResponse.json({
          success: false,
          message: 'Usuario no autenticado'
        }, { status: 401 });
      }

      // Obtener perfil
      const profile = await this.userService.getUserProfile(userId);

      if (!profile) {
        return NextResponse.json({
          success: false,
          message: 'Usuario no encontrado'
        }, { status: 404 });
      }

      return NextResponse.json({
        success: true,
        data: profile.toPlainObject(),
        message: 'Perfil obtenido exitosamente'
      });

    } catch (error) {
      console.error('Error al obtener perfil:', error);
      return NextResponse.json({
        success: false,
        message: 'Error al obtener perfil',
        error: error instanceof Error ? error.message : 'Error desconocido'
      }, { status: 500 });
    }
  }

  /**
   * Actualiza el perfil del usuario autenticado
   */
  async updateUserProfile(request: NextRequest): Promise<NextResponse> {
    try {
      // Obtener ID del usuario desde el token
      const userId = request.headers.get('x-user-id');
      
      if (!userId) {
        return NextResponse.json({
          success: false,
          message: 'Usuario no autenticado'
        }, { status: 401 });
      }

      const body = await request.json();

      // Validar datos de entrada
      const validation = validateData(updateUserSchema, body);
      if (!validation.success) {
        return NextResponse.json({
          success: false,
          message: 'Datos de entrada inválidos',
          error: validation.error
        }, { status: 400 });
      }

      const profileData = validation.data;

      // Actualizar perfil
      const updatedProfile = await this.userService.updateUserProfile(userId, profileData);

      if (!updatedProfile) {
        return NextResponse.json({
          success: false,
          message: 'Usuario no encontrado'
        }, { status: 404 });
      }

      return NextResponse.json({
        success: true,
        data: updatedProfile.toPlainObject(),
        message: 'Perfil actualizado exitosamente'
      });

    } catch (error) {
      console.error('Error al actualizar perfil:', error);
      return NextResponse.json({
        success: false,
        message: error instanceof Error ? error.message : 'Error al actualizar perfil',
        error: error instanceof Error ? error.message : 'Error desconocido'
      }, { status: 500 });
    }
  }
}
