/**
 * Implementación del servicio de autenticación - Capa de Aplicación
 * Implementa la lógica de negocio de autenticación
 */

import { AuthService } from '../../domain/services/auth.service.interface';
import { UserRepository } from '../../domain/repositories/user.repository.interface';
import { UserEntity } from '../../domain/entities/user.entity';
import { LoginDto, AuthResponse, JWTPayload } from '../../types/common.types';
import { hashPassword, verifyPassword, generateJWT, verifyJWT, validatePasswordStrength, extractTokenFromHeader } from '../../infrastructure/auth/jwt.service';

export class AuthServiceImpl implements AuthService {
  constructor(private userRepository: UserRepository) {}

  async authenticate(loginData: LoginDto): Promise<AuthResponse> {
    try {
      // Buscar usuario por email
      const user = await this.userRepository.findByEmail(loginData.email);
      
      if (!user) {
        throw new Error('Credenciales inválidas');
      }

      // Verificar contraseña (asumiendo que el password está hasheado en la BD)
      const userPlain = user.toPlainObject();
      const isPasswordValid = await this.verifyPassword(loginData.password, (userPlain as any).password);
      
      if (!isPasswordValid) {
        throw new Error('Credenciales inválidas');
      }

      // Actualizar último login
      const updatedUser = await this.userRepository.updateLastLogin(user.id);
      
      if (!updatedUser) {
        throw new Error('Error al actualizar último login');
      }

      // Generar token JWT
      const token = this.generateToken(updatedUser);

      return {
        user: updatedUser.toPlainObject(),
        token,
        tokenType: 'Bearer',
        expiresIn: '24h'
      };
    } catch (error) {
      console.error('Authentication error:', error);
      throw error;
    }
  }

  generateToken(user: UserEntity): string {
    const payload: Omit<JWTPayload, 'iat' | 'exp'> = {
      userId: user.id,
      email: user.email,
      rol: user.rol
    };

    return generateJWT(payload);
  }

  verifyToken(token: string): JWTPayload | null {
    return verifyJWT(token);
  }

  async refreshToken(token: string): Promise<AuthResponse> {
    try {
      // Verificar el token actual
      const decoded = this.verifyToken(token);
      
      if (!decoded) {
        throw new Error('Token inválido para refrescar');
      }

      // Buscar el usuario actualizado
      const user = await this.userRepository.findById(decoded.userId);
      
      if (!user) {
        throw new Error('Usuario no encontrado');
      }

      // Generar nuevo token
      const newToken = this.generateToken(user);

      return {
        user: user.toPlainObject(),
        token: newToken,
        tokenType: 'Bearer',
        expiresIn: '24h'
      };
    } catch (error) {
      console.error('Token refresh error:', error);
      throw error;
    }
  }

  async hashPassword(password: string): Promise<string> {
    return await hashPassword(password);
  }

  async verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
    return await verifyPassword(password, hashedPassword);
  }

  validatePasswordStrength(password: string): {
    isValid: boolean;
    score: number;
    feedback: string[];
  } {
    return validatePasswordStrength(password);
  }

  extractTokenFromHeader(authHeader: string | null): string | null {
    return extractTokenFromHeader(authHeader);
  }
}
