/**
 * Configuración LDAP para el proyecto principal
 * Sistema completamente migrado a LDAP
 */

import dotenv from 'dotenv';
dotenv.config({ path: '.env' });

export const ldapConfig = {
  url: process.env.LDAP_URL || 'ldap://localhost:389',
  baseDn: process.env.LDAP_BASE_DN || 'dc=empresa,dc=local',
  bindDN: process.env.LDAP_BIND_DN || 'cn=admin,dc=empresa,dc=local',
  bindPassword: process.env.LDAP_BIND_PASSWORD || 'boca2002',
  usersOU: process.env.LDAP_USERS_OU || 'ou=users,dc=empresa,dc=local',
};

// Interfaz para entrada LDAP
export interface LDAPUserEntry {
  dn: string;
  attributes: {
    uid: string;
    cn: string;
    sn: string;
    givenName: string;
    mail: string;
    userPassword: string;
    title: string;
    description?: string;
    telephoneNumber?: string;
    st?: string;
    objectClass: string[];
  };
}

// Interfaz para usuario (compatible con la interfaz existente)
export interface Usuario {
  id: string;
  email: string;
  password: string;
  rol: string;
  email_verified: boolean;
  email_verification_token?: string;
  password_reset_token?: string;
  password_reset_expires?: string;
  last_login_at?: string;
  created_at: string;
  updated_at: string;
  nombre_completo?: string;
  nacionalidad?: string;
  telefono?: string;
}
