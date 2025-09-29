/**
 * Servicio Híbrido de Usuarios - Implementa la misma interfaz que UserService
 * pero con lógica de fallback entre LDAP y Supabase
 */

import { UserService } from '../../domain/services/user.service.interface';
import { UserEntity } from '../../domain/entities/user.entity';
import { CreateUserDto, UpdateUserDto, UserRole } from '../../types/common.types';
import { HybridUserRepositoryImpl } from '../repositories/hybrid-user.repository.impl';
import { LDAPConfig } from '../../types/ldap.types';
import { hashPassword, verifyPassword } from '../../lib/auth';

export class HybridUserServiceImpl implements UserService {
  private userRepository: HybridUserRepositoryImpl;

  constructor() {
    const ldapConfig: LDAPConfig = {
      url: process.env.LDAP_URL || 'ldap://35.184.48.90:389',
      baseDN: process.env.LDAP_BASE_DN || 'dc=empresa,dc=local',
      bindDN: process.env.LDAP_BIND_DN || 'cn=admin,dc=empresa,dc=local',
      bindPassword: process.env.LDAP_BIND_PASSWORD || 'boca2002',
      usersOU: process.env.LDAP_USERS_OU || 'ou=users,dc=empresa,dc=local'
    };
    this.userRepository = new HybridUserRepositoryImpl(ldapConfig);
  }

  async getAllUsers(options?: {
    page?: number;
    limit?: number;
    search?: string;
    rol?: UserRole;
    email_verified?: boolean;
  }): Promise<{
    success: boolean;
    data?: UserEntity[];
    error?: string;
    pagination?: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    try {
      const result = await this.userRepository.findAll(options || {});
      
      return {
        success: true,
        data: result.users,
        pagination: {
          page: result.page,
          limit: result.limit,
          total: result.total,
          totalPages: Math.ceil(result.total / result.limit)
        }
      };
    } catch (error) {
      console.error('Error getting all users:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async getUserById(id: string): Promise<{
    success: boolean;
    data?: UserEntity;
    error?: string;
  }> {
    try {
      const user = await this.userRepository.findById(id);
      if (!user) {
        return {
          success: false,
          error: 'User not found'
        };
      }

      return {
        success: true,
        data: user
      };
    } catch (error) {
      console.error('Error getting user by ID:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async getUserByEmail(email: string): Promise<{
    success: boolean;
    data?: UserEntity;
    error?: string;
  }> {
    try {
      const user = await this.userRepository.findByEmail(email);
      if (!user) {
        return {
          success: false,
          error: 'User not found'
        };
      }

      return {
        success: true,
        data: user
      };
    } catch (error) {
      console.error('Error getting user by email:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async createUser(userData: CreateUserDto): Promise<{
    success: boolean;
    data?: UserEntity;
    error?: string;
  }> {
    try {
      // Verificar si el usuario ya existe
      const existingUser = await this.userRepository.existsByEmail(userData.email);
      if (existingUser) {
        return {
          success: false,
          error: 'User with this email already exists'
        };
      }

      // Hashear la contraseña antes de crear
      const hashedPassword = await hashPassword(userData.password);
      const userDataWithHashedPassword = {
        ...userData,
        password: hashedPassword
      };

      const user = await this.userRepository.create(userDataWithHashedPassword);
      
      return {
        success: true,
        data: user
      };
    } catch (error) {
      console.error('Error creating user:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async updateUser(id: string, userData: UpdateUserDto): Promise<{
    success: boolean;
    data?: UserEntity;
    error?: string;
  }> {
    try {
      // Verificar que el usuario existe
      const existingUser = await this.userRepository.findById(id);
      if (!existingUser) {
        return {
          success: false,
          error: 'User not found'
        };
      }

      // Si se proporciona una nueva contraseña, hashearla
      let updateData = { ...userData };
      if (userData.password) {
        updateData.password = await hashPassword(userData.password);
      }

      const user = await this.userRepository.update(id, updateData);
      if (!user) {
        return {
          success: false,
          error: 'Failed to update user'
        };
      }

      return {
        success: true,
        data: user
      };
    } catch (error) {
      console.error('Error updating user:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async deleteUser(id: string): Promise<{
    success: boolean;
    data?: boolean;
    error?: string;
  }> {
    try {
      // Verificar que el usuario existe
      const existingUser = await this.userRepository.findById(id);
      if (!existingUser) {
        return {
          success: false,
          error: 'User not found'
        };
      }

      const deleted = await this.userRepository.delete(id);
      
      return {
        success: true,
        data: deleted
      };
    } catch (error) {
      console.error('Error deleting user:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async authenticateUser(email: string, password: string): Promise<{
    success: boolean;
    data?: UserEntity;
    error?: string;
  }> {
    try {
      const user = await this.userRepository.authenticateUser(email, password);
      if (!user) {
        return {
          success: false,
          error: 'Invalid credentials'
        };
      }

      // Actualizar último login
      await this.userRepository.updateLastLogin(user.id);

      return {
        success: true,
        data: user
      };
    } catch (error) {
      console.error('Error authenticating user:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async getUsersByRole(role: UserRole): Promise<{
    success: boolean;
    data?: UserEntity[];
    error?: string;
  }> {
    try {
      const users = await this.userRepository.findByRole(role);
      
      return {
        success: true,
        data: users
      };
    } catch (error) {
      console.error('Error getting users by role:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async getUserCount(): Promise<{
    success: boolean;
    data?: number;
    error?: string;
  }> {
    try {
      const count = await this.userRepository.count();
      
      return {
        success: true,
        data: count
      };
    } catch (error) {
      console.error('Error getting user count:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async getUserCountByRole(role: UserRole): Promise<{
    success: boolean;
    data?: number;
    error?: string;
  }> {
    try {
      const count = await this.userRepository.countByRole(role);
      
      return {
        success: true,
        data: count
      };
    } catch (error) {
      console.error('Error getting user count by role:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async searchUsers(searchTerm: string): Promise<{
    success: boolean;
    data?: UserEntity[];
    error?: string;
  }> {
    try {
      const result = await this.userRepository.findAll({
        search: searchTerm,
        page: 1,
        limit: 100 // Límite alto para búsquedas
      });
      
      return {
        success: true,
        data: result.users
      };
    } catch (error) {
      console.error('Error searching users:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}

