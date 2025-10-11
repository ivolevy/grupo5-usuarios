/**
 * Tipos comunes y interfaces base para la aplicación
 */

// Tipos de respuesta estándar
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
  code?: string;
  timestamp?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Tipos de usuario
export interface User {
  id: string;
  nombre_completo: string;
  email: string;
  password?: string; // Campo opcional para evitar exponerlo
  rol: UserRole;
  email_verified: boolean;
  created_at: string;
  updated_at?: string;
  last_login_at?: string;
  telefono?: string;
  nacionalidad?: string;
}

export interface CreateUserDto {
  nombre_completo?: string;
  email: string;
  password: string;
  rol?: UserRole;
  telefono?: string;
  nacionalidad?: string;
  email_verified?: boolean;
}

export interface UpdateUserDto {
  nombre_completo?: string;
  email?: string;
  password?: string;
  rol?: UserRole;
  email_verified?: boolean;
  telefono?: string;
  nacionalidad?: string;
  updated_at?: string;
  last_login_at?: string;
}

export type UserRole = 'admin' | 'moderador' | 'usuario';

// Tipos de autenticación
export interface LoginDto {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  token: string;
  tokenType: string;
  expiresIn: string;
}

export interface JWTPayload {
  userId: string;
  email: string;
  rol: UserRole;
  iat?: number;
  exp?: number;
}