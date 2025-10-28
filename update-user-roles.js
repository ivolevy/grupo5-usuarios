#!/usr/bin/env node

/**
 * Script para actualizar roles de usuarios en LDAP
 * 
 * Actualiza:
 * - metricas@gmail.com → rol "administrador"
 * - metricas-2@gmail.com → rol "interno"
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

// Usuarios a actualizar
const USERS_TO_UPDATE = [
  { email: 'metricas@mail.com', newRole: 'admin' },
  { email: 'metricas-2@mail.com', newRole: 'interno' },
  { email: 'bsalvalai@uade.edu.ar', newRole: 'admin' }
];

class LDAPRoleUpdater {
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
        attributes: ['*']
      });

      for await (const entry of searchResult.searchEntries) {
        console.log(`   ✅ Usuario encontrado: ${entry.dn}`);
        console.log(`   📋 Rol actual: ${entry.title || 'sin rol'}`);
        return entry;
      }

      console.log(`   ❌ Usuario no encontrado`);
      return null;
    } catch (error) {
      console.error(`   ❌ Error buscando usuario:`, error.message);
      return null;
    }
  }

  async updateUserRole(userDN, newRole, currentMetadata) {
    try {
      console.log(`🔄 Actualizando rol a: ${newRole}`);

      // Actualizar metadatos si existen
      let newDescription = null;
      if (currentMetadata) {
        try {
          const metadata = JSON.parse(currentMetadata);
          metadata.updated_at = new Date().toISOString();
          newDescription = `Migrado desde Supabase - ${JSON.stringify(metadata)}`;
        } catch (e) {
          console.log(`   ⚠️  No se pudieron parsear los metadatos`);
        }
      }

      // Crear archivo LDIF temporal
      let ldifContent = `dn: ${userDN}
changetype: modify
replace: title
title: ${newRole}
`;

      // Agregar actualización de description si existe
      if (newDescription) {
        ldifContent += `-
replace: description
description: ${newDescription}
`;
      }

      const tempFile = path.join('/tmp', `update_role_${Date.now()}.ldif`);
      fs.writeFileSync(tempFile, ldifContent);

      // Ejecutar ldapmodify
      const ldapHost = LDAP_CONFIG.url.replace('ldap://', '').replace(':389', '');
      const command = `ldapmodify -h ${ldapHost} -D "${LDAP_CONFIG.bindDN}" -w "${LDAP_CONFIG.bindPassword}" -f "${tempFile}"`;

      console.log('   🔧 Ejecutando ldapmodify...');
      execSync(command, { stdio: 'pipe' });

      console.log(`   ✅ Rol actualizado exitosamente a: ${newRole}`);

      // Limpiar archivo temporal
      try {
        fs.unlinkSync(tempFile);
      } catch (e) {
        // Ignorar error de limpieza
      }

      return true;
    } catch (error) {
      console.error(`   ❌ Error actualizando rol:`, error.message);
      return false;
    }
  }

  async updateAllRoles() {
    console.log('🎯 ACTUALIZANDO ROLES DE USUARIOS');
    console.log('='.repeat(50));
    console.log();

    let successCount = 0;
    let failCount = 0;

    for (const userConfig of USERS_TO_UPDATE) {
      console.log(`\n${'─'.repeat(50)}`);
      console.log(`📧 Procesando: ${userConfig.email}`);
      console.log(`🎭 Nuevo rol: ${userConfig.newRole}`);
      console.log('─'.repeat(50));

      const user = await this.findUserByEmail(userConfig.email);
      
      if (!user) {
        console.log(`❌ No se pudo procesar ${userConfig.email}\n`);
        failCount++;
        continue;
      }

      if (user.title === userConfig.newRole) {
        console.log(`ℹ️  El usuario ya tiene el rol "${userConfig.newRole}"\n`);
        successCount++;
        continue;
      }

      const success = await this.updateUserRole(user.dn, userConfig.newRole, user.description);
      
      if (success) {
        successCount++;
      } else {
        failCount++;
      }
    }

    console.log('\n' + '='.repeat(50));
    console.log('📊 RESUMEN DE ACTUALIZACIÓN');
    console.log('='.repeat(50));
    console.log(`✅ Exitosas: ${successCount}`);
    console.log(`❌ Fallidas: ${failCount}`);
    console.log(`📋 Total procesadas: ${USERS_TO_UPDATE.length}`);
    console.log('='.repeat(50));

    return failCount === 0;
  }

  async run() {
    console.log('\n🔧 ACTUALIZADOR DE ROLES LDAP');
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
      const success = await this.updateAllRoles();
      process.exit(success ? 0 : 1);
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
  const updater = new LDAPRoleUpdater();
  updater.run()
    .then(() => {
      console.log('\n✅ Proceso completado');
    })
    .catch((error) => {
      console.error('\n💥 Error fatal:', error.message);
      process.exit(1);
    });
}

module.exports = LDAPRoleUpdater;

