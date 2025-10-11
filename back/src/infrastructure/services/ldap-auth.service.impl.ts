/**
 * Implementación del servicio de autenticación usando LDAP
 * Reemplaza la implementación de Supabase manteniendo la misma interfaz
 */

import { Client } from 'ldapts';
import { AuthService } from '../../domain/services/auth.service.interface';
import { UserRepository } from '../../domain/repositories/user.repository.interface';
import { UserEntity } from '../../domain/entities/user.entity';
import { LoginDto, AuthResponse } from '../../types/common.types';
import { JWTPayload } from '../../types/common.types';
import { ldapConfig } from '../../lib/ldap-config';
import bcrypt from 'bcryptjs';

export class LDAPAuthServiceImpl implements AuthService {
  private client: Client;

  constructor(private userRepository: UserRepository) {
    this.client = new Client({
      url: ldapConfig.url,
      timeout: 30000,
      connectTimeout: 30000
    });
  }

  private async connect(): Promise<void> {
    if (!this.client.isConnected) {
      await this.client.bind(ldapConfig.bindDN, ldapConfig.bindPassword);
    }
  }

  private async disconnect(): Promise<void> {
    if (this.client.isConnected) {
      await this.client.unbind();
    }
  }

  private generateUID(email: string): string {
    return email.split('@')[0];
  }

  private generateDN(uid: string): string {
    return `uid=${uid},${ldapConfig.usersOU}`;
  }

  async authenticate(loginData: LoginDto): Promise<AuthResponse> {
    try {
      await this.connect();

      // Buscar usuario por email
      const user = await this.userRepository.findByEmail(loginData.email);
      
      if (!user) {
        throw new Error('Credenciales inválidas');
      }

      // Verificar contraseña
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
    } finally {
      await this.disconnect();
    }
  }

  generateToken(user: UserEntity): string {
    const payload: Omit<JWTPayload, 'iat' | 'exp'> = {
      userId: user.id,
      email: user.toPlainObject().email,
      rol: user.toPlainObject().rol
    };

    // Importar jwt dinámicamente para evitar problemas de dependencias
    const jwt = require('jsonwebtoken');
    const secret = process.env.JWT_SECRET || 'your-secret-key';

    return jwt.sign(payload, secret, { 
      expiresIn: '24h',
      issuer: 'ldap-auth-service'
    });
  }

  async verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
    try {
      // Verificar si es un hash bcrypt válido
      if (hashedPassword.startsWith('$2b$') || hashedPassword.startsWith('$2a$')) {
        return await bcrypt.compare(password, hashedPassword);
      }
      
      // Si es un hash SHA256 (como algunos usuarios de prueba)
      if (hashedPassword.length === 64) {
        const crypto = require('crypto');
        const hash = crypto.createHash('sha256').update(password).digest('hex');
        return hash === hashedPassword;
      }

      // Si es texto plano (como algunos usuarios de prueba)
      return password === hashedPassword;
    } catch (error) {
      console.error('Password verification error:', error);
      return false;
    }
  }

  async hashPassword(password: string): Promise<string> {
    const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS || '12');
    return await bcrypt.hash(password, saltRounds);
  }

  validatePasswordStrength(password: string): {
    isValid: boolean;
    score: number;
    feedback: string[];
  } {
    // Importar la función de validación de contraseña
    const { validatePasswordStrength } = require('../../lib/auth');
    return validatePasswordStrength(password);
  }

  verifyToken(token: string): JWTPayload | null {
    try {
      const jwt = require('jsonwebtoken');
      const secret = process.env.JWT_SECRET || 'your-secret-key';
      
      const decoded = jwt.verify(token, secret) as JWTPayload;
      
      // Verificar que no esté expirado
      if (decoded.exp && decoded.exp < Date.now() / 1000) {
        return null;
      }
      
      return decoded;
    } catch (error) {
      console.error('Token verification error:', error);
      return null;
    }
  }

  extractTokenFromHeader(authHeader: string | null): string | null {
    if (!authHeader) {
      return null;
    }

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return null;
    }

    return parts[1];
  }

  async refreshToken(token: string): Promise<AuthResponse> {
    try {
      // Verificar el token actual
      const payload = this.verifyToken(token);
      if (!payload) {
        throw new Error('Token inválido');
      }

      // Buscar usuario
      const user = await this.userRepository.findById(payload.userId);
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
      throw new Error('Error al renovar token');
    }
  }

  async validateUser(userId: string): Promise<UserEntity | null> {
    try {
      return await this.userRepository.findById(userId);
    } catch (error) {
      console.error('User validation error:', error);
      return null;
    }
  }

  async logout(userId: string): Promise<void> {
    // En un sistema JWT stateless, el logout se maneja del lado del cliente
    // removiendo el token. Aquí podríamos implementar una blacklist de tokens
    // si fuera necesario.
    console.log(`User ${userId} logged out`);
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<boolean> {
    try {
      const user = await this.userRepository.findById(userId);
      
      if (!user) {
        throw new Error('Usuario no encontrado');
      }

      // Verificar contraseña actual
      const userPlain = user.toPlainObject();
      const isCurrentPasswordValid = await this.verifyPassword(currentPassword, (userPlain as any).password);
      
      if (!isCurrentPasswordValid) {
        throw new Error('Contraseña actual incorrecta');
      }

      // Hashear nueva contraseña
      const hashedNewPassword = await this.hashPassword(newPassword);

      // Actualizar contraseña
      await this.userRepository.update(userId, {
        password: hashedNewPassword,
        updated_at: new Date().toISOString()
      });

      return true;
    } catch (error) {
      console.error('Password change error:', error);
      throw error;
    }
  }

  async resetPassword(email: string, newPassword: string): Promise<boolean> {
    try {
      const user = await this.userRepository.findByEmail(email);
      
      if (!user) {
        throw new Error('Usuario no encontrado');
      }

      // Hashear nueva contraseña
      const hashedNewPassword = await this.hashPassword(newPassword);

      // Actualizar contraseña
      await this.userRepository.update(user.id, {
        password: hashedNewPassword,
        updated_at: new Date().toISOString()
      });

      return true;
    } catch (error) {
      console.error('Password reset error:', error);
      throw error;
    }
  }

  async verifyEmail(userId: string): Promise<boolean> {
    try {
      const user = await this.userRepository.findById(userId);
      
      if (!user) {
        throw new Error('Usuario no encontrado');
      }

      // Actualizar estado de verificación de email
      await this.userRepository.update(userId, {
        email_verified: true,
        updated_at: new Date().toISOString()
      });

      return true;
    } catch (error) {
      console.error('Email verification error:', error);
      throw error;
    }
  }
}
