/**
 * Interfaz del servicio de autenticación - Capa de Dominio
 * Define el contrato para la lógica de autenticación
 */

import { UserEntity } from '../entities/user.entity';
import { LoginDto, AuthResponse, JWTPayload } from '../../types/common.types';

export interface AuthService {
  /**
   * Autentica un usuario con email y contraseña
   */
  authenticate(loginData: LoginDto): Promise<AuthResponse>;

  /**
   * Genera un token JWT para un usuario
   */
  generateToken(user: UserEntity): string;

  /**
   * Verifica y decodifica un token JWT
   */
  verifyToken(token: string): JWTPayload | null;

  /**
   * Refresca un token JWT
   */
  refreshToken(token: string): Promise<AuthResponse>;

  /**
   * Hashea una contraseña
   */
  hashPassword(password: string): Promise<string>;

  /**
   * Verifica una contraseña contra su hash
   */
  verifyPassword(password: string, hashedPassword: string): Promise<boolean>;

  /**
   * Valida la fortaleza de una contraseña
   */
  validatePasswordStrength(password: string): {
    isValid: boolean;
    score: number;
    feedback: string[];
  };

  /**
   * Extrae el token del header Authorization
   */
  extractTokenFromHeader(authHeader: string | null): string | null;
}
