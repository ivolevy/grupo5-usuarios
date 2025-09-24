/**
 * Implementación del repositorio de usuarios - Capa de Infraestructura
 * Implementa el acceso a datos usando Prisma/Supabase
 */

import { UserRepository } from '../../domain/repositories/user.repository.interface';
import { UserEntity } from '../../domain/entities/user.entity';
import { CreateUserDto, UpdateUserDto, UserRole } from '../../types/common.types';
import { prisma } from '../database/prisma.client';

// Tipo local para actualización de usuarios
type UpdateUsuarioData = {
  email?: string;
  password?: string;
  rol?: string;
  email_verified?: boolean;
  email_verification_token?: string;
  password_reset_token?: string;
  password_reset_expires?: string;
  last_login_at?: string;
  nombre_completo?: string;
  nacionalidad?: string;
  telefono?: string;
  updated_at?: string;
};

export class UserRepositoryImpl implements UserRepository {
  async findById(id: string): Promise<UserEntity | null> {
    try {
      const user = await prisma.usuarios.findUnique({ id });
      return user ? UserEntity.fromPlainObject(user) : null;
    } catch (error) {
      console.error('Error finding user by ID:', error);
      throw new Error('Error al buscar usuario por ID');
    }
  }

  async findByEmail(email: string): Promise<UserEntity | null> {
    try {
      const user = await prisma.usuarios.findFirst({ email });
      return user ? UserEntity.fromPlainObject(user) : null;
    } catch (error) {
      console.error('Error finding user by email:', error);
      throw new Error('Error al buscar usuario por email');
    }
  }

  async findByRole(rol: UserRole): Promise<UserEntity[]> {
    try {
      const users = await prisma.usuarios.findMany({ where: { rol } });
      return users.map((user: any) => UserEntity.fromPlainObject(user));
    } catch (error) {
      console.error('Error finding users by role:', error);
      throw new Error('Error al buscar usuarios por rol');
    }
  }

  async findAll(options: {
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
  }> {
    try {
      const page = options.page || 1;
      const limit = options.limit || 10;
      const offset = (page - 1) * limit;

      // Construir filtros
      const where: any = {};
      
      if (options.search) {
        where.OR = [
          { nombre_completo: { contains: options.search, mode: 'insensitive' } },
          { email: { contains: options.search, mode: 'insensitive' } }
        ];
      }
      
      if (options.rol) {
        where.rol = options.rol;
      }
      
      if (options.email_verified !== undefined) {
        where.email_verified = options.email_verified;
      }

      const [users, total] = await Promise.all([
        prisma.usuarios.findMany({
          where,
          skip: offset,
          take: limit,
          orderBy: { created_at: 'desc' }
        }),
        prisma.usuarios.count({ where })
      ]);

      return {
        users: users.map((user: any) => UserEntity.fromPlainObject(user)),
        total,
        page,
        limit
      };
    } catch (error) {
      console.error('Error finding all users:', error);
      throw new Error('Error al buscar usuarios');
    }
  }

  async create(userData: CreateUserDto): Promise<UserEntity> {
    try {
      const user = await prisma.usuarios.create({
        nombre_completo: userData.nombre_completo,
        email: userData.email,
        password: userData.password, // Debe estar hasheada antes de llegar aquí
        rol: userData.rol || 'usuario',
        email_verified: true, // Por defecto, sin verificación por email
        telefono: userData.telefono
      });

      return UserEntity.fromPlainObject(user);
    } catch (error) {
      console.error('Error creating user:', error);
      throw new Error('Error al crear usuario');
    }
  }

  async update(id: string, userData: UpdateUsuarioData): Promise<UserEntity | null> {
    try {
      const user = await prisma.usuarios.update(
        { id },
        {
          ...(userData.nombre_completo && { nombre_completo: userData.nombre_completo }),
          ...(userData.email && { email: userData.email }),
          ...(userData.password && { password: userData.password }), // Debe estar hasheada
          ...(userData.rol && { rol: userData.rol }),
          ...(userData.email_verified !== undefined && { email_verified: userData.email_verified }),
          ...(userData.telefono && { telefono: userData.telefono }),
          updated_at: new Date().toISOString()
        } as UpdateUsuarioData
      );

      return UserEntity.fromPlainObject(user);
    } catch (error) {
      console.error('Error updating user:', error);
      throw new Error('Error al actualizar usuario');
    }
  }

  async delete(id: string): Promise<boolean> {
    try {
      await prisma.usuarios.delete({ id });
      return true;
    } catch (error) {
      console.error('Error deleting user:', error);
      throw new Error('Error al eliminar usuario');
    }
  }

  async existsByEmail(email: string): Promise<boolean> {
    try {
      const count = await prisma.usuarios.count({ where: { email } });
      return count > 0;
    } catch (error) {
      console.error('Error checking if user exists by email:', error);
      throw new Error('Error al verificar existencia de usuario');
    }
  }

  async count(): Promise<number> {
    try {
      return await prisma.usuarios.count();
    } catch (error) {
      console.error('Error counting users:', error);
      throw new Error('Error al contar usuarios');
    }
  }

  async countByRole(rol: UserRole): Promise<number> {
    try {
      return await prisma.usuarios.count({ where: { rol } });
    } catch (error) {
      console.error('Error counting users by role:', error);
      throw new Error('Error al contar usuarios por rol');
    }
  }

  async findByDateRange(startDate: string, endDate: string): Promise<UserEntity[]> {
    try {
      const users = await prisma.usuarios.findMany({
        where: {
          created_at: {
            gte: startDate,
            lte: endDate
          }
        },
        orderBy: { created_at: 'desc' }
      });

      return users.map((user: any) => UserEntity.fromPlainObject(user));
    } catch (error) {
      console.error('Error finding users by date range:', error);
      throw new Error('Error al buscar usuarios por rango de fechas');
    }
  }

  async updateLastLogin(id: string): Promise<UserEntity | null> {
    try {
      const user = await prisma.usuarios.update(
        { id },
        {
          last_login_at: new Date().toISOString()
        }
      );

      return UserEntity.fromPlainObject(user);
    } catch (error) {
      console.error('Error updating last login:', error);
      throw new Error('Error al actualizar último login');
    }
  }
}
