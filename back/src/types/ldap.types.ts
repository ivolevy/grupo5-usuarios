/**
 * Tipos e interfaces para integración con LDAP
 */

// Configuración de conexión LDAP
export interface LDAPConfig {
  url: string;
  baseDN: string;
  bindDN: string;
  bindPassword: string;
  usersOU: string;
}

// Usuario LDAP - Mapeo completo de Supabase
export interface LDAPUser {
  // Campos básicos LDAP
  dn: string;
  uid: string;
  cn: string;
  sn: string;
  givenName: string;
  mail: string;
  userPassword: string;
  objectClass: string[];
  uidNumber: string;
  gidNumber: string;
  homeDirectory?: string;
  loginShell?: string;
  
  // Campos LDAP estándar adicionales
  title?: string;
  telephoneNumber?: string;
  displayName?: string;
  
  // Campos mapeados de Supabase
  supabaseId?: string; // ID original de Supabase
  rol?: string; // admin, moderador, usuario
  emailVerified?: boolean;
  emailVerificationToken?: string;
  passwordResetToken?: string;
  passwordResetExpires?: string;
  lastLoginAt?: string;
  nombreCompleto?: string;
  nacionalidad?: string;
  telefono?: string;
  createdAt?: string;
  updatedAt?: string;
  
  // Campo description completo (donde se almacenan todos los datos de Supabase)
  description?: string;
}

// DTOs para operaciones LDAP
export interface CreateLDAPUserDto {
  uid: string;
  cn: string;
  sn: string;
  givenName: string;
  mail: string;
  userPassword: string;
  uidNumber: string;
  gidNumber: string;
  homeDirectory?: string;
  loginShell?: string;
}

export interface UpdateLDAPUserDto {
  cn?: string;
  sn?: string;
  givenName?: string;
  mail?: string;
  userPassword?: string;
  homeDirectory?: string;
  loginShell?: string;
  title?: string;
  telephoneNumber?: string;
  displayName?: string;
  description?: string;
}

// Resultado de búsqueda LDAP
export interface LDAPSearchResult {
  dn: string;
  attributes: Record<string, string[]>;
}

// Opciones de búsqueda LDAP
export interface LDAPSearchOptions {
  scope: 'base' | 'one' | 'sub';
  filter: string;
  attributes?: string[];
  sizeLimit?: number;
  timeLimit?: number;
}
