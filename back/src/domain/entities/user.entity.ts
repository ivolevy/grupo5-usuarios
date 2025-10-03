/**
 * Entidad de Usuario - Capa de Dominio
 * Representa la lógica de negocio del usuario
 */

import { UserRole } from '../../types/common.types';

export class UserEntity {
  constructor(
    public readonly id: string,
    public readonly nombre_completo: string,
    public readonly email: string,
    public readonly rol: UserRole,
    public readonly email_verified: boolean,
    public readonly created_at: string,
    public readonly updated_at?: string,
    public readonly last_login_at?: string,
    public readonly telefono?: string
  ) {}

  /**
   * Verifica si el usuario es administrador
   */
  isAdmin(): boolean {
    return this.rol === 'admin';
  }

  /**
   * Verifica si el usuario es interno o admin
   */
  isInternoOrAdmin(): boolean {
    return this.rol === 'admin' || this.rol === 'interno';
  }

  /**
   * Verifica si el usuario puede acceder a un recurso específico
   */
  canAccessResource(resourceUserId: string): boolean {
    return this.isAdmin() || this.id === resourceUserId;
  }

  /**
   * Verifica si el usuario puede gestionar otros usuarios
   */
  canManageUsers(): boolean {
    return this.isModeratorOrAdmin();
  }

  /**
   * Verifica si el usuario puede crear usuarios
   */
  canCreateUsers(): boolean {
    return this.isAdmin();
  }

  /**
   * Verifica si el usuario puede actualizar usuarios
   */
  canUpdateUsers(): boolean {
    return this.isAdmin();
  }

  /**
   * Verifica si el usuario puede eliminar usuarios
   */
  canDeleteUsers(): boolean {
    return this.isAdmin();
  }

  /**
   * Verifica si el usuario puede acceder al dashboard de admin
   */
  canAccessAdminDashboard(): boolean {
    return this.isAdmin();
  }

  /**
   * Actualiza el último login
   */
  updateLastLogin(): UserEntity {
    return new UserEntity(
      this.id,
      this.nombre_completo,
      this.email,
      this.rol,
      this.email_verified,
      this.created_at,
      new Date().toISOString(),
      new Date().toISOString(),
      this.telefono
    );
  }

  /**
   * Actualiza información del usuario
   */
  update(updates: Partial<{
    nombre_completo: string;
    email: string;
    rol: UserRole;
    email_verified: boolean;
    telefono: string;
  }>): UserEntity {
    return new UserEntity(
      this.id,
      updates.nombre_completo ?? this.nombre_completo,
      updates.email ?? this.email,
      updates.rol ?? this.rol,
      updates.email_verified ?? this.email_verified,
      this.created_at,
      new Date().toISOString(),
      this.last_login_at,
      updates.telefono ?? this.telefono
    );
  }

  /**
   * Convierte la entidad a objeto plano
   */
  toPlainObject() {
    return {
      id: this.id,
      nombre_completo: this.nombre_completo,
      email: this.email,
      rol: this.rol,
      email_verified: this.email_verified,
      created_at: this.created_at,
      updated_at: this.updated_at,
      last_login_at: this.last_login_at,
      telefono: this.telefono
    };
  }

  /**
   * Crea una entidad desde un objeto plano
   */
  static fromPlainObject(data: any): UserEntity {
    return new UserEntity(
      data.id,
      data.nombre_completo,
      data.email,
      data.rol,
      data.email_verified,
      data.created_at,
      data.updated_at,
      data.last_login_at,
      data.telefono
    );
  }
}
