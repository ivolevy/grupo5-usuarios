/**
 * Interfaz del servicio de usuarios - Capa de Dominio
 * Define el contrato para la lógica de negocio de usuarios
 */

import { UserEntity } from '../entities/user.entity';
import { CreateUserDto, UpdateUserDto, UserRole } from '../../types/common.types';

export interface UserService {
  /**
   * Obtiene un usuario por ID
   */
  getUserById(id: string): Promise<UserEntity | null>;

  /**
   * Obtiene un usuario por email
   */
  getUserByEmail(email: string): Promise<UserEntity | null>;

  /**
   * Obtiene todos los usuarios con filtros y paginación
   */
  getUsers(options: {
    page?: number;
    limit?: number;
    search?: string;
    rol?: UserRole;
    email_verified?: boolean;
  }): Promise<{
    users: UserEntity[];
    total: number;
    page: number;
    limit: number;
  }>;

  /**
   * Crea un nuevo usuario
   */
  createUser(userData: CreateUserDto): Promise<UserEntity>;

  /**
   * Actualiza un usuario existente
   */
  updateUser(id: string, userData: UpdateUserDto): Promise<UserEntity | null>;

  /**
   * Elimina un usuario
   */
  deleteUser(id: string): Promise<boolean>;

  /**
   * Obtiene el perfil de un usuario
   */
  getUserProfile(id: string): Promise<UserEntity | null>;

  /**
   * Actualiza el perfil de un usuario
   */
  updateUserProfile(id: string, profileData: Partial<UpdateUserDto>): Promise<UserEntity | null>;

  /**
   * Verifica si un usuario puede acceder a un recurso
   */
  canUserAccessResource(userId: string, resourceUserId: string): Promise<boolean>;

  /**
   * Obtiene métricas de usuarios
   */
  getUserMetrics(): Promise<{
    totalUsers: number;
    usersByRole: Record<UserRole, number>;
    recentUsers: number;
    usersCreatedToday: number;
  }>;
}
