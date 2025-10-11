#!/usr/bin/env node

/**
 * Script para listar usuarios de LDAP con todas sus características
 * 
 * Este script:
 * 1. Se conecta al servidor LDAP
 * 2. Busca todos los usuarios en la OU de usuarios
 * 3. Muestra información detallada de cada usuario
 * 4. Formatea la salida de manera legible
 */

const { Client } = require('ldapts');
require('dotenv').config();

// Configuración LDAP
const LDAP_CONFIG = {
  url: process.env.LDAP_URL || 'ldap://35.184.48.90:389',
  baseDN: process.env.LDAP_BASE_DN || 'dc=empresa,dc=local',
  bindDN: process.env.LDAP_BIND_DN || 'cn=admin,dc=empresa,dc=local',
  bindPassword: process.env.LDAP_BIND_PASSWORD || 'boca2002',
  usersOU: process.env.LDAP_USERS_OU || 'ou=users,dc=empresa,dc=local'
};

class LDAPUserLister {
  constructor() {
    this.client = new Client({
      url: LDAP_CONFIG.url,
      timeout: 30000,
      connectTimeout: 30000
    });
  }

  async connect() {
    try {
      await this.client.bind(LDAP_CONFIG.bindDN, LDAP_CONFIG.bindPassword);
      console.log('✅ Conectado exitosamente al servidor LDAP\n');
      return true;
    } catch (error) {
      console.error('❌ Error conectando al servidor LDAP:', error.message);
      return false;
    }
  }

  async disconnect() {
    try {
      await this.client.unbind();
      console.log('\n✅ Desconectado del servidor LDAP');
    } catch (error) {
      console.error('⚠️  Error desconectando del servidor LDAP:', error.message);
    }
  }

  formatUserInfo(user, index) {
    console.log(`┌─ USUARIO #${index + 1}`);
    console.log(`├─ DN: ${user.dn}`);
    console.log(`├─ UID: ${user.uid || 'N/A'}`);
    console.log(`├─ Nombre Completo: ${user.cn || 'N/A'}`);
    console.log(`├─ Nombre: ${user.givenName || 'N/A'}`);
    console.log(`├─ Apellido: ${user.sn || 'N/A'}`);
    console.log(`├─ Email: ${user.mail || 'N/A'}`);
    console.log(`├─ Rol/Título: ${user.title || 'N/A'}`);
    console.log(`├─ Teléfono: ${user.telephoneNumber || 'N/A'}`);
    console.log(`├─ Estado/Nacionalidad: ${user.st || 'N/A'}`);
    
    // Mostrar información de metadatos si existe
    if (user.description) {
      try {
        const metadata = JSON.parse(user.description);
        console.log(`├─ 📋 METADATOS SUPABASE:`);
        console.log(`│  ├─ ID Supabase: ${metadata.supabase_id || 'N/A'}`);
        console.log(`│  ├─ Creado: ${metadata.created_at || 'N/A'}`);
        console.log(`│  ├─ Actualizado: ${metadata.updated_at || 'N/A'}`);
        console.log(`│  ├─ Email Verificado: ${metadata.email_verified ? 'Sí' : 'No'}`);
        console.log(`│  ├─ Último Login: ${metadata.last_login_at || 'Nunca'}`);
        console.log(`│  ├─ Nacionalidad Original: ${metadata.nacionalidad || 'N/A'}`);
        console.log(`│  └─ Teléfono Original: ${metadata.telefono || 'N/A'}`);
      } catch (error) {
        console.log(`├─ Descripción: ${user.description}`);
      }
    } else {
      console.log(`├─ Descripción: N/A`);
    }

    // Mostrar objectClasses
    if (user.objectClass && Array.isArray(user.objectClass)) {
      console.log(`├─ Object Classes: ${user.objectClass.join(', ')}`);
    }

    // Mostrar contraseña (oculta por seguridad)
    if (user.userPassword) {
      const passwordPreview = user.userPassword.length > 20 
        ? `${user.userPassword.substring(0, 20)}...` 
        : user.userPassword;
      console.log(`├─ Contraseña: ${passwordPreview} (${user.userPassword.length} caracteres)`);
    } else {
      console.log(`├─ Contraseña: N/A`);
    }

    console.log(`└─────────────────────────────────────────────────────────\n`);
  }

  async listUsers() {
    try {
      console.log('🔍 Buscando usuarios en LDAP...\n');
      
      const searchResult = await this.client.search(LDAP_CONFIG.usersOU, {
        scope: 'sub',
        filter: '(objectClass=inetOrgPerson)',
        attributes: [
          'dn', 'uid', 'cn', 'sn', 'givenName', 'mail', 'title', 
          'telephoneNumber', 'st', 'description', 'userPassword', 'objectClass'
        ]
      });

      const users = [];
      for await (const entry of searchResult.searchEntries) {
        users.push(entry);
      }

      if (users.length === 0) {
        console.log('❌ No se encontraron usuarios en LDAP');
        return;
      }

      console.log(`📊 RESUMEN: Se encontraron ${users.length} usuarios\n`);
      console.log('='.repeat(70));
      console.log('👥 LISTA DETALLADA DE USUARIOS LDAP');
      console.log('='.repeat(70));
      console.log();

      // Mostrar cada usuario
      users.forEach((user, index) => {
        this.formatUserInfo(user, index);
      });

      // Mostrar estadísticas
      console.log('📈 ESTADÍSTICAS:');
      console.log('='.repeat(30));
      
      const roles = {};
      const verifiedEmails = users.filter(u => {
        try {
          const meta = JSON.parse(u.description || '{}');
          return meta.email_verified === true;
        } catch {
          return false;
        }
      }).length;

      const withPhone = users.filter(u => u.telephoneNumber).length;
      const withNationality = users.filter(u => u.st).length;

      users.forEach(user => {
        const role = user.title || 'sin_rol';
        roles[role] = (roles[role] || 0) + 1;
      });

      console.log(`Total de usuarios: ${users.length}`);
      console.log(`Emails verificados: ${verifiedEmails}`);
      console.log(`Con teléfono: ${withPhone}`);
      console.log(`Con nacionalidad: ${withNationality}`);
      console.log('\nDistribución por roles:');
      Object.entries(roles).forEach(([role, count]) => {
        console.log(`  ${role}: ${count} usuarios`);
      });

      return users;
    } catch (error) {
      console.error('❌ Error listando usuarios:', error.message);
      throw error;
    }
  }

  async run() {
    console.log('📋 LISTADOR DE USUARIOS LDAP');
    console.log('============================');
    console.log(`Servidor: ${LDAP_CONFIG.url}`);
    console.log(`Base DN: ${LDAP_CONFIG.baseDN}`);
    console.log(`Users OU: ${LDAP_CONFIG.usersOU}`);
    console.log();

    const connected = await this.connect();
    if (!connected) {
      process.exit(1);
    }

    try {
      await this.listUsers();
    } catch (error) {
      console.error('💥 Error durante la ejecución:', error.message);
      process.exit(1);
    } finally {
      await this.disconnect();
    }
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  const lister = new LDAPUserLister();
  lister.run()
    .then(() => {
      console.log('✅ Listado completado');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Error fatal:', error.message);
      process.exit(1);
    });
}

module.exports = LDAPUserLister;
