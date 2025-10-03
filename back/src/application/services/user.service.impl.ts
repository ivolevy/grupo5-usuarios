/**
 * Implementación del servicio de usuarios - Capa de Aplicación
 * Implementa la lógica de negocio de usuarios
 */

import { UserService } from '../../domain/services/user.service.interface';
import { UserRepository } from '../../domain/repositories/user.repository.interface';
import { UserEntity } from '../../domain/entities/user.entity';
import { CreateUserDto, UpdateUserDto, UserRole } from '../../types/common.types';
import { hashPassword, validatePasswordStrength } from '../../infrastructure/auth/jwt.service';

export class UserServiceImpl implements UserService {
  constructor(private userRepository: UserRepository) {}

  async getUserById(id: string): Promise<UserEntity | null> {
    try {
      return await this.userRepository.findById(id);
    } catch (error) {
      console.error('Error getting user by ID:', error);
      throw new Error('Error al obtener usuario');
    }
  }

  async getUserByEmail(email: string): Promise<UserEntity | null> {
    try {
      return await this.userRepository.findByEmail(email);
    } catch (error) {
      console.error('Error getting user by email:', error);
      throw new Error('Error al obtener usuario');
    }
  }

  async getUsers(options: {
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
      return await this.userRepository.findAll(options);
    } catch (error) {
      console.error('Error getting users:', error);
      throw new Error('Error al obtener usuarios');
    }
  }

  async createUser(userData: CreateUserDto): Promise<UserEntity> {
    try {
      // Validar que el email no exista
      const existingUser = await this.userRepository.findByEmail(userData.email);
      if (existingUser) {
        throw new Error('Ya existe un usuario con este email');
      }

      // Validar fortaleza de la contraseña
      const passwordValidation = validatePasswordStrength(userData.password);
      if (!passwordValidation.isValid) {
        throw new Error(`La contraseña no cumple con los requisitos: ${passwordValidation.feedback.join(', ')}`);
      }

      // Hashear la contraseña
      const hashedPassword = await hashPassword(userData.password);

      // Crear el usuario
      const userToCreate = {
        ...userData,
        password: hashedPassword
      };

      return await this.userRepository.create(userToCreate);
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  async updateUser(id: string, userData: UpdateUserDto): Promise<UserEntity | null> {
    try {
      // Verificar que el usuario existe
      const existingUser = await this.userRepository.findById(id);
      if (!existingUser) {
        throw new Error('Usuario no encontrado');
      }

      // Si se está cambiando el email, verificar que no exista
      if (userData.email && userData.email !== existingUser.email) {
        const emailExists = await this.userRepository.existsByEmail(userData.email);
        if (emailExists) {
          throw new Error('Ya existe un usuario con este email');
        }
      }

      // Si se está cambiando la contraseña, validar y hashear
      if (userData.password) {
        const passwordValidation = validatePasswordStrength(userData.password);
        if (!passwordValidation.isValid) {
          throw new Error(`La contraseña no cumple con los requisitos: ${passwordValidation.feedback.join(', ')}`);
        }
        userData.password = await hashPassword(userData.password);
      }

      return await this.userRepository.update(id, userData);
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  }

  async deleteUser(id: string): Promise<boolean> {
    try {
      // Verificar que el usuario existe
      const existingUser = await this.userRepository.findById(id);
      if (!existingUser) {
        throw new Error('Usuario no encontrado');
      }

      return await this.userRepository.delete(id);
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  }

  async getUserProfile(id: string): Promise<UserEntity | null> {
    try {
      return await this.userRepository.findById(id);
    } catch (error) {
      console.error('Error getting user profile:', error);
      throw new Error('Error al obtener perfil de usuario');
    }
  }

  async updateUserProfile(id: string, profileData: Partial<UpdateUserDto>): Promise<UserEntity | null> {
    try {
      // Verificar que el usuario existe
      const existingUser = await this.userRepository.findById(id);
      if (!existingUser) {
        throw new Error('Usuario no encontrado');
      }

      // Si se está cambiando el email, verificar que no exista
      if (profileData.email && profileData.email !== existingUser.email) {
        const emailExists = await this.userRepository.existsByEmail(profileData.email);
        if (emailExists) {
          throw new Error('Ya existe un usuario con este email');
        }
      }

      // Si se está cambiando la contraseña, validar y hashear
      if (profileData.password) {
        const passwordValidation = validatePasswordStrength(profileData.password);
        if (!passwordValidation.isValid) {
          throw new Error(`La contraseña no cumple con los requisitos: ${passwordValidation.feedback.join(', ')}`);
        }
        profileData.password = await hashPassword(profileData.password);
      }

      return await this.userRepository.update(id, profileData);
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw error;
    }
  }

  async canUserAccessResource(userId: string, resourceUserId: string): Promise<boolean> {
    try {
      const user = await this.userRepository.findById(userId);
      if (!user) {
        return false;
      }

      return user.canAccessResource(resourceUserId);
    } catch (error) {
      console.error('Error checking user access:', error);
      return false;
    }
  }

  async getUserMetrics(): Promise<{
    totalUsers: number;
    usersByRole: Record<UserRole, number>;
    recentUsers: number;
    usersCreatedToday: number;
  }> {
    try {
      const [totalUsers, adminUsers, internoUsers, usuarioUsers] = await Promise.all([
        this.userRepository.count(),
        this.userRepository.countByRole('admin'),
        this.userRepository.countByRole('interno'),
        this.userRepository.countByRole('usuario')
      ]);

      // Calcular usuarios recientes (últimos 7 días)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const recentUsers = await this.userRepository.findByDateRange(
        sevenDaysAgo.toISOString(),
        new Date().toISOString()
      );

      // Calcular usuarios creados hoy
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const usersCreatedToday = await this.userRepository.findByDateRange(
        today.toISOString(),
        new Date().toISOString()
      );

      return {
        totalUsers,
        usersByRole: {
          admin: adminUsers,
          interno: internoUsers,
          usuario: usuarioUsers
        },
        recentUsers: recentUsers.length,
        usersCreatedToday: usersCreatedToday.length
      };
    } catch (error) {
      console.error('Error getting user metrics:', error);
      throw new Error('Error al obtener métricas de usuarios');
    }
  }
}
