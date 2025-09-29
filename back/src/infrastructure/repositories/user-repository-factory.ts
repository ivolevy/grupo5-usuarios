/**
 * Factory para crear repositorios de usuarios
 * Permite cambiar entre LDAP, Supabase o híbrido fácilmente
 */

import { UserRepository } from '../../domain/repositories/user.repository.interface';
import { UserRepositoryImpl } from './user.repository.impl';
import { HybridUserRepositoryImpl } from './hybrid-user.repository.impl';
import { LDAPConfig } from '../../types/ldap.types';

export type RepositoryType = 'supabase' | 'ldap' | 'hybrid';

export class UserRepositoryFactory {
  private static instance: UserRepository | null = null;
  private static currentType: RepositoryType = 'hybrid';

  static createRepository(type: RepositoryType = 'hybrid'): UserRepository {
    // Si ya existe una instancia del mismo tipo, reutilizarla
    if (this.instance && this.currentType === type) {
      return this.instance;
    }

    const ldapConfig: LDAPConfig = {
      url: process.env.LDAP_URL || 'ldap://35.184.48.90:389',
      baseDN: process.env.LDAP_BASE_DN || 'dc=empresa,dc=local',
      bindDN: process.env.LDAP_BIND_DN || 'cn=admin,dc=empresa,dc=local',
      bindPassword: process.env.LDAP_BIND_PASSWORD || 'boca2002',
      usersOU: process.env.LDAP_USERS_OU || 'ou=users,dc=empresa,dc=local'
    };

    switch (type) {
      case 'supabase':
        this.instance = new UserRepositoryImpl();
        break;
      case 'ldap':
        // Para LDAP puro, usaríamos una implementación directa
        throw new Error('LDAP puro no implementado, usar hybrid');
      case 'hybrid':
        this.instance = new HybridUserRepositoryImpl(ldapConfig);
        break;
      default:
        throw new Error(`Tipo de repositorio no soportado: ${type}`);
    }

    this.currentType = type;
    console.log(`🏭 Repositorio de usuarios creado: ${type}`);
    
    return this.instance;
  }

  static getCurrentType(): RepositoryType {
    return this.currentType;
  }

  static reset(): void {
    this.instance = null;
    this.currentType = 'hybrid';
  }
}

