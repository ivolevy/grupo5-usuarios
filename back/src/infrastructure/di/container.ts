/**
 * Container de Inyección de Dependencias - Capa de Infraestructura
 * Configura y resuelve las dependencias de la aplicación
 */

import { UserRepository } from '../../domain/repositories/user.repository.interface';
import { UserService } from '../../domain/services/user.service.interface';
import { AuthService } from '../../domain/services/auth.service.interface';

// Implementaciones LDAP
import { LDAPUserRepositoryImpl } from '../repositories/ldap-user.repository.impl';
import { UserServiceImpl } from '../../application/services/user.service.impl';
import { LDAPAuthServiceImpl } from '../services/ldap-auth.service.impl';

// Controladores
import { UserController } from '../../presentation/controllers/user.controller';
import { AuthController } from '../../presentation/controllers/auth.controller';

/**
 * Container de dependencias
 */
export class DIContainer {
  private static instance: DIContainer;
  private dependencies: Map<string, any> = new Map();

  private constructor() {
    this.initializeDependencies();
  }

  public static getInstance(): DIContainer {
    if (!DIContainer.instance) {
      DIContainer.instance = new DIContainer();
    }
    return DIContainer.instance;
  }

  /**
   * Inicializa todas las dependencias
   */
  private initializeDependencies(): void {
    // Repositorios LDAP
    this.dependencies.set('UserRepository', new LDAPUserRepositoryImpl());

    // Servicios
    this.dependencies.set('UserService', new UserServiceImpl(
      this.dependencies.get('UserRepository')
    ));

    this.dependencies.set('AuthService', new LDAPAuthServiceImpl(
      this.dependencies.get('UserRepository')
    ));

    // Controladores
    this.dependencies.set('UserController', new UserController(
      this.dependencies.get('UserService')
    ));

    this.dependencies.set('AuthController', new AuthController(
      this.dependencies.get('AuthService')
    ));
  }

  /**
   * Obtiene una dependencia por su nombre
   */
  public get<T>(name: string): T {
    const dependency = this.dependencies.get(name);
    if (!dependency) {
      throw new Error(`Dependency ${name} not found`);
    }
    return dependency as T;
  }

  /**
   * Registra una nueva dependencia
   */
  public register<T>(name: string, dependency: T): void {
    this.dependencies.set(name, dependency);
  }

  /**
   * Obtiene el repositorio de usuarios
   */
  public getUserRepository(): UserRepository {
    return this.get<UserRepository>('UserRepository');
  }

  /**
   * Obtiene el servicio de usuarios
   */
  public getUserService(): UserService {
    return this.get<UserService>('UserService');
  }

  /**
   * Obtiene el servicio de autenticación
   */
  public getAuthService(): AuthService {
    return this.get<AuthService>('AuthService');
  }

  /**
   * Obtiene el controlador de usuarios
   */
  public getUserController(): UserController {
    return this.get<UserController>('UserController');
  }

  /**
   * Obtiene el controlador de autenticación
   */
  public getAuthController(): AuthController {
    return this.get<AuthController>('AuthController');
  }
}

// Instancia singleton del container
export const container = DIContainer.getInstance();
