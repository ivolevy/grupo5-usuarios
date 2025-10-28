#!/usr/bin/env node

/**
 * Script para actualizar el campo created_by_admin del usuario pepito@gmail.com
 * 
 * Cambia created_by_admin de false a true para pepito@gmail.com
 */

const { Client } = require('ldapts');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
require('dotenv').config();

// Configuración LDAP
const LDAP_CONFIG = {
  url: process.env.LDAP_URL || 'ldap://35.184.48.90:389',
  baseDN: process.env.LDAP_BASE_DN || 'dc=empresa,dc=local',
  bindDN: process.env.LDAP_BIND_DN || 'cn=admin,dc=empresa,dc=local',
  bindPassword: process.env.LDAP_BIND_PASSWORD || 'boca2002',
  usersOU: process.env.LDAP_USERS_OU || 'ou=users,dc=empresa,dc=local'
};

class LDAPFieldUpdater {
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

  async findUserByEmail(email) {
    try {
      console.log(`🔍 Buscando usuario: ${email}`);
      
      const searchResult = await this.client.search(LDAP_CONFIG.usersOU, {
        scope: 'sub',
        filter: `(mail=${email})`,
        attributes: ['dn', 'uid', 'mail', 'description']
      });

      for await (const entry of searchResult.searchEntries) {
        console.log(`   ✅ Usuario encontrado: ${entry.dn}`);
        return entry;
      }

      console.log(`   ❌ Usuario no encontrado`);
      return null;
    } catch (error) {
      console.error(`   ❌ Error buscando usuario:`, error.message);
      return null;
    }
  }

  async updateUserCreatedByAdmin(userDN, currentMetadata) {
    try {
      console.log(`🔄 Actualizando created_by_admin a true para pepito@gmail.com`);

      // Parsear metadatos existentes
      let metadata = {};
      if (currentMetadata) {
        try {
          metadata = JSON.parse(currentMetadata);
        } catch (e) {
          console.log(`   ⚠️  No se pudieron parsear los metadatos existentes, creando nuevos`);
        }
      }

      // Actualizar el campo created_by_admin a true
      metadata.created_by_admin = true;
      metadata.updated_at = new Date().toISOString();

      // Crear archivo LDIF temporal
      const ldifContent = `dn: ${userDN}
changetype: modify
replace: description
description: Migrado desde Supabase - ${JSON.stringify(metadata)}
`;

      const tempFile = path.join('/tmp', `update_pepito_created_by_admin_${Date.now()}.ldif`);
      fs.writeFileSync(tempFile, ldifContent);

      // Ejecutar ldapmodify
      const ldapHost = LDAP_CONFIG.url.replace('ldap://', '').replace(':389', '');
      const command = `ldapmodify -h ${ldapHost} -D "${LDAP_CONFIG.bindDN}" -w "${LDAP_CONFIG.bindPassword}" -f "${tempFile}"`;

      console.log('   🔧 Ejecutando ldapmodify...');
      execSync(command, { stdio: 'pipe' });

      console.log(`   ✅ Campo created_by_admin actualizado exitosamente a: true`);

      // Limpiar archivo temporal
      try {
        fs.unlinkSync(tempFile);
      } catch (e) {
        // Ignorar error de limpieza
      }

      return true;
    } catch (error) {
      console.error(`   ❌ Error actualizando usuario:`, error.message);
      return false;
    }
  }

  async run() {
    console.log('\n🔧 ACTUALIZADOR DE CAMPO created_by_admin');
    console.log('==========================================');
    console.log(`Servidor: ${LDAP_CONFIG.url}`);
    console.log(`Base DN: ${LDAP_CONFIG.baseDN}`);
    console.log(`Users OU: ${LDAP_CONFIG.usersOU}`);
    console.log();

    const connected = await this.connect();
    if (!connected) {
      process.exit(1);
    }

    try {
      console.log('🎯 ACTUALIZANDO pepito@gmail.com');
      console.log('='.repeat(40));
      console.log();

      const user = await this.findUserByEmail('pepito@gmail.com');
      
      if (!user) {
        console.log('❌ Usuario pepito@gmail.com no encontrado');
        process.exit(1);
      }

      console.log(`📧 Email: ${user.mail}`);
      console.log(`🔗 DN: ${user.dn}`);
      console.log();

      const success = await this.updateUserCreatedByAdmin(user.dn, user.description);
      
      if (success) {
        console.log('\n✅ pepito@gmail.com actualizado exitosamente');
        console.log('📝 Campo created_by_admin = true');
      } else {
        console.log('\n❌ Error actualizando pepito@gmail.com');
        process.exit(1);
      }

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
  const updater = new LDAPFieldUpdater();
  updater.run()
    .then(() => {
      console.log('\n✅ Proceso completado');
    })
    .catch((error) => {
      console.error('\n💥 Error fatal:', error.message);
      process.exit(1);
    });
}

module.exports = LDAPFieldUpdater;
