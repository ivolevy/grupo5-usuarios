/**
 * Repositorio Híbrido de Usuarios - LDAP como fuente principal, Supabase como fallback
 * Implementa la misma interfaz que UserRepository pero con lógica de fallback
 */

import { UserRepository } from '../../domain/repositories/user.repository.interface';
import { UserEntity } from '../../domain/entities/user.entity';
import { CreateUserDto, UpdateUserDto, UserRole } from '../../types/common.types';
import { LDAPRepositoryImpl } from './ldap.repository.impl';
import { UserRepositoryImpl } from './user.repository.impl';
import { LDAPConfig } from '../../types/ldap.types';
import { prisma } from '../database/prisma.client';

export class HybridUserRepositoryImpl implements UserRepository {
  private ldapRepository: LDAPRepositoryImpl;
  private supabaseRepository: UserRepositoryImpl;
  private ldapConfig: LDAPConfig;

  constructor(ldapConfig: LDAPConfig) {
    this.ldapConfig = ldapConfig;
    this.ldapRepository = new LDAPRepositoryImpl(ldapConfig);
    this.supabaseRepository = new UserRepositoryImpl();
  }

  private async withFallback<T>(
    ldapOperation: () => Promise<T>,
    supabaseOperation: () => Promise<T>,
    operationName: string
  ): Promise<T> {
    try {
      console.log(`🔄 Ejecutando ${operationName} en LDAP...`);
      const result = await ldapOperation();
      console.log(`✅ ${operationName} exitoso en LDAP`);
      return result;
    } catch (ldapError) {
      console.warn(`⚠️ LDAP falló para ${operationName}, usando Supabase como fallback:`, ldapError);
      try {
        const result = await supabaseOperation();
        console.log(`✅ ${operationName} exitoso en Supabase (fallback)`);
        return result;
      } catch (supabaseError) {
        console.error(`❌ Ambas fuentes fallaron para ${operationName}:`, { ldapError, supabaseError });
        throw new Error(`Operación ${operationName} falló en ambas fuentes`);
      }
    }
  }

  private ldapUserToEntity(ldapUser: any): UserEntity {
    return new UserEntity(
      ldapUser.uid, // Usar UID como ID
      ldapUser.cn || '', // Common Name como nombre_completo
      ldapUser.mail || '',
      this.mapLdapRoleToUserRole(ldapUser.objectClass || []),
      true, // Asumir verificado en LDAP
      new Date().toISOString(), // created_at
      new Date().toISOString(), // updated_at
      undefined, // last_login_at
      undefined // telefono
    );
  }

  private mapLdapRoleToUserRole(objectClasses: string[]): UserRole {
    // Mapear roles de LDAP a roles del sistema
    if (objectClasses.includes('admin')) return 'admin';
    if (objectClasses.includes('moderador')) return 'moderador';
    return 'usuario';
  }

  private mapUserRoleToLdap(role: UserRole): string[] {
    // Mapear roles del sistema a objectClasses de LDAP
    const baseClasses = ['inetOrgPerson', 'posixAccount', 'top'];
    switch (role) {
      case 'admin':
        return [...baseClasses, 'admin'];
      case 'moderador':
        return [...baseClasses, 'moderador'];
      default:
        return baseClasses;
    }
  }

  async findById(id: string): Promise<UserEntity | null> {
    return this.withFallback(
      async () => {
        const ldapUser = await this.ldapRepository.findUserByUid(id);
        return ldapUser ? this.ldapUserToEntity(ldapUser) : null;
      },
      async () => this.supabaseRepository.findById(id),
      'findById'
    );
  }

  async findByEmail(email: string): Promise<UserEntity | null> {
    return this.withFallback(
      async () => {
        const ldapUser = await this.ldapRepository.findUserByEmail(email);
        return ldapUser ? this.ldapUserToEntity(ldapUser) : null;
      },
      async () => this.supabaseRepository.findByEmail(email),
      'findByEmail'
    );
  }

  async findByRole(rol: UserRole): Promise<UserEntity[]> {
    return this.withFallback(
      async () => {
        const filter = `(objectClass=${rol})`;
        const ldapUsers = await this.ldapRepository.searchUsers(filter);
        return ldapUsers.map(user => this.ldapUserToEntity(user));
      },
      async () => this.supabaseRepository.findByRole(rol),
      'findByRole'
    );
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
    return this.withFallback(
      async () => {
        const ldapUsers = await this.ldapRepository.findAllUsers();
        let filteredUsers = ldapUsers;

        // Aplicar filtros
        if (options.search) {
          filteredUsers = await this.ldapRepository.searchUsers(options.search);
        }

        if (options.rol) {
          const roleFilter = `(objectClass=${options.rol})`;
          filteredUsers = await this.ldapRepository.searchUsers(roleFilter);
        }

        const users = filteredUsers.map(user => this.ldapUserToEntity(user));
        
        // Aplicar paginación
        const page = options.page || 1;
        const limit = options.limit || 10;
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit;
        const paginatedUsers = users.slice(startIndex, endIndex);

        return {
          users: paginatedUsers,
          total: users.length,
          page,
          limit
        };
      },
      async () => this.supabaseRepository.findAll(options),
      'findAll'
    );
  }

  async create(userData: CreateUserDto): Promise<UserEntity> {
    return this.withFallback(
      async () => {
        // Crear en LDAP
        const ldapUserData = {
          uid: userData.email.split('@')[0], // Usar parte del email como UID
          cn: userData.nombre_completo,
          sn: userData.nombre_completo.split(' ').slice(-1)[0] || '',
          givenName: userData.nombre_completo.split(' ')[0] || '',
          mail: userData.email,
          userPassword: userData.password,
          objectClass: this.mapUserRoleToLdap(userData.rol || 'usuario')
        };

        const ldapUser = await this.ldapRepository.createUser(ldapUserData);
        return this.ldapUserToEntity(ldapUser);
      },
      async () => this.supabaseRepository.create(userData),
      'create'
    );
  }

  async update(id: string, userData: UpdateUserDto): Promise<UserEntity | null> {
    return this.withFallback(
      async () => {
        const updateData: any = {};
        
        if (userData.nombre_completo) {
          updateData.cn = userData.nombre_completo;
          updateData.sn = userData.nombre_completo.split(' ').slice(-1)[0] || '';
          updateData.givenName = userData.nombre_completo.split(' ')[0] || '';
        }
        
        if (userData.email) updateData.mail = userData.email;
        if (userData.password) updateData.userPassword = userData.password;
        if (userData.rol) {
          updateData.objectClass = this.mapUserRoleToLdap(userData.rol);
        }

        const ldapUser = await this.ldapRepository.updateUser(id, updateData);
        return ldapUser ? this.ldapUserToEntity(ldapUser) : null;
      },
      async () => this.supabaseRepository.update(id, userData),
      'update'
    );
  }

  async delete(id: string): Promise<boolean> {
    return this.withFallback(
      async () => {
        await this.ldapRepository.deleteUser(id);
        return true;
      },
      async () => this.supabaseRepository.delete(id),
      'delete'
    );
  }

  async existsByEmail(email: string): Promise<boolean> {
    return this.withFallback(
      async () => {
        return await this.ldapRepository.emailExists(email);
      },
      async () => this.supabaseRepository.existsByEmail(email),
      'existsByEmail'
    );
  }

  async count(): Promise<number> {
    return this.withFallback(
      async () => {
        const users = await this.ldapRepository.findAllUsers();
        return users.length;
      },
      async () => this.supabaseRepository.count(),
      'count'
    );
  }

  async countByRole(rol: UserRole): Promise<number> {
    return this.withFallback(
      async () => {
        const filter = `(objectClass=${rol})`;
        const users = await this.ldapRepository.searchUsers(filter);
        return users.length;
      },
      async () => this.supabaseRepository.countByRole(rol),
      'countByRole'
    );
  }

  async findByDateRange(startDate: string, endDate: string): Promise<UserEntity[]> {
    // LDAP no maneja fechas de creación nativamente, usar Supabase
    return this.withFallback(
      async () => {
        // En LDAP, retornar todos los usuarios ya que no hay fechas
        const users = await this.ldapRepository.findAllUsers();
        return users.map(user => this.ldapUserToEntity(user));
      },
      async () => this.supabaseRepository.findByDateRange(startDate, endDate),
      'findByDateRange'
    );
  }

  async updateLastLogin(id: string): Promise<UserEntity | null> {
    return this.withFallback(
      async () => {
        // LDAP no maneja last_login_at, usar Supabase para esto
        return await this.supabaseRepository.updateLastLogin(id);
      },
      async () => this.supabaseRepository.updateLastLogin(id),
      'updateLastLogin'
    );
  }

  // Métodos adicionales para autenticación híbrida
  async authenticateUser(email: string, password: string): Promise<UserEntity | null> {
    return this.withFallback(
      async () => {
        // Buscar usuario por email en LDAP
        const ldapUser = await this.ldapRepository.findUserByEmail(email);
        if (!ldapUser) return null;

        // Autenticar en LDAP
        const isAuthenticated = await this.ldapRepository.authenticateUser(ldapUser.uid, password);
        if (!isAuthenticated) return null;

        return this.ldapUserToEntity(ldapUser);
      },
      async () => {
        // Fallback a Supabase con verificación de password
        const user = await this.supabaseRepository.findByEmail(email);
        if (!user) return null;

        // Verificar password usando bcrypt
        const { verifyPassword } = await import('../../lib/auth');
        const rawUser = await prisma.usuarios.findFirst({ email });
        if (!rawUser) return null;

        const isValidPassword = await verifyPassword(password, rawUser.password);
        return isValidPassword ? user : null;
      },
      'authenticateUser'
    );
  }
}
