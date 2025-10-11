// Configuración LDAP para migración de usuarios
export const ldapConfig = {
  url: process.env.LDAP_URL || 'ldap://35.184.48.90:389',
  baseDN: process.env.LDAP_BASE_DN || 'dc=empresa,dc=local',
  bindDN: process.env.LDAP_BIND_DN || 'cn=admin,dc=empresa,dc=local',
  bindPassword: process.env.LDAP_BIND_PASSWORD || 'boca2002',
  usersOU: process.env.LDAP_USERS_OU || 'ou=users,dc=empresa,dc=local'
};

// Sistema completamente migrado a LDAP - No hay configuración de Supabase

// Interfaz para entrada LDAP
export interface LDAPUserEntry {
  dn: string;
  attributes: {
    objectClass: string[];
    cn: string;
    sn: string;
    mail: string;
    userPassword: string;
    uid: string;
    givenName?: string;
    telephoneNumber?: string;
    description?: string;
    title?: string;
    [key: string]: any;
  };
}
