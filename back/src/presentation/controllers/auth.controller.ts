/**
 * Controlador de Autenticación - Capa de Presentación
 * Maneja las peticiones HTTP relacionadas con autenticación
 */

import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '../../domain/services/auth.service.interface';
import { LoginDto } from '../../types/common.types';
import { validateData } from '../../infrastructure/validation/validation.service';
import { z } from 'zod';

// Schema de validación para login
const loginSchema = z.object({
  email: z
    .string()
    .email('Debe ser un email válido')
    .min(1, 'El email es requerido'),
  password: z
    .string()
    .min(1, 'La contraseña es requerida'),
});

export class AuthController {
  constructor(private authService: AuthService) {}

  /**
   * Maneja el login de usuario
   */
  async login(request: NextRequest): Promise<NextResponse> {
    try {
      const body = await request.json();
      
      // Validar datos de entrada
      const validation = validateData(loginSchema, body);
      if (!validation.success) {
        return NextResponse.json({
          success: false,
          message: 'Datos de entrada inválidos',
          error: validation.error
        }, { status: 400 });
      }

      const loginData: LoginDto = validation.data;

      // Autenticar usuario
      const authResponse = await this.authService.authenticate(loginData);

      return NextResponse.json({
        success: true,
        message: 'Login exitoso',
        data: authResponse
      }, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        }
      });

    } catch (error) {
      console.error('Error en login:', error);
      return NextResponse.json({
        success: false,
        message: error instanceof Error ? error.message : 'Error interno del servidor',
        error: error instanceof Error ? error.message : 'Error desconocido'
      }, { status: 500 });
    }
  }

  /**
   * Maneja la verificación del token (auth/me)
   */
  async getMe(request: NextRequest): Promise<NextResponse> {
    try {
      // Extraer token del header
      const authHeader = request.headers.get('authorization');
      const token = this.authService.extractTokenFromHeader(authHeader);

      if (!token) {
        return NextResponse.json({
          success: false,
          message: 'Token de autorización requerido'
        }, { status: 401 });
      }

      // Verificar token
      const decoded = this.authService.verifyToken(token);
      if (!decoded) {
        return NextResponse.json({
          success: false,
          message: 'Token de autorización inválido o expirado'
        }, { status: 401 });
      }

      return NextResponse.json({
        success: true,
        message: 'Información del usuario obtenida exitosamente',
        data: {
          user: {
            userId: decoded.userId,
            email: decoded.email,
            rol: decoded.rol
          },
          tokenInfo: {
            userId: decoded.userId,
            email: decoded.email,
            rol: decoded.rol,
            iat: decoded.iat,
            exp: decoded.exp
          }
        }
      });

    } catch (error) {
      console.error('Error al obtener información del usuario:', error);
      return NextResponse.json({
        success: false,
        message: 'Error interno del servidor',
        error: error instanceof Error ? error.message : 'Error desconocido'
      }, { status: 500 });
    }
  }

  /**
   * Maneja el refresh del token
   */
  async refreshToken(request: NextRequest): Promise<NextResponse> {
    try {
      // Extraer token del header
      const authHeader = request.headers.get('authorization');
      const token = this.authService.extractTokenFromHeader(authHeader);

      if (!token) {
        return NextResponse.json({
          success: false,
          message: 'Token de autorización requerido para refrescar'
        }, { status: 401 });
      }

      // Refrescar token
      const authResponse = await this.authService.refreshToken(token);

      return NextResponse.json({
        success: true,
        message: 'Token refrescado exitosamente',
        data: authResponse
      });

    } catch (error) {
      console.error('Error al refrescar token:', error);
      return NextResponse.json({
        success: false,
        message: error instanceof Error ? error.message : 'Error interno del servidor',
        error: error instanceof Error ? error.message : 'Error desconocido'
      }, { status: 500 });
    }
  }
}
