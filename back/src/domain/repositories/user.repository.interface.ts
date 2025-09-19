/**
 * Interfaz del repositorio de usuarios - Capa de Dominio
 * Define el contrato para el acceso a datos de usuarios
 */

import { UserEntity } from '../entities/user.entity';
import { CreateUserDto, UpdateUserDto, UserRole } from '../../types/common.types';

export interface UserRepository {
  /**
   * Busca un usuario por ID
   */
  findById(id: string): Promise<UserEntity | null>;

  /**
   * Busca un usuario por email
   */
  findByEmail(email: string): Promise<UserEntity | null>;

  /**
   * Busca usuarios por rol
   */
  findByRole(rol: UserRole): Promise<UserEntity[]>;

  /**
   * Obtiene todos los usuarios con paginación
   */
  findAll(options: {
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
  create(userData: CreateUserDto): Promise<UserEntity>;

  /**
   * Actualiza un usuario existente
   */
  update(id: string, userData: UpdateUserDto): Promise<UserEntity | null>;

  /**
   * Elimina un usuario
   */
  delete(id: string): Promise<boolean>;

  /**
   * Verifica si existe un usuario con el email dado
   */
  existsByEmail(email: string): Promise<boolean>;

  /**
   * Cuenta el total de usuarios
   */
  count(): Promise<number>;

  /**
   * Cuenta usuarios por rol
   */
  countByRole(rol: UserRole): Promise<number>;

  /**
   * Obtiene usuarios creados en un rango de fechas
   */
  findByDateRange(startDate: string, endDate: string): Promise<UserEntity[]>;

  /**
   * Actualiza el último login de un usuario
   */
  updateLastLogin(id: string): Promise<UserEntity | null>;
}
