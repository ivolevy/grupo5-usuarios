#!/usr/bin/env node

/**
 * Script para actualizar el campo created_by_admin de varios usuarios aleatorios
 * 
 * Cambia created_by_admin de false a true para usuarios seleccionados aleatoriamente
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

// Lista de usuarios para actualizar (seleccionados aleatoriamente)
const USERS_TO_UPDATE = [
  'catalogo@gmail.com',
  'matias@uade.edu.ar', 
  'largerich@uade.edu.ar',
  'bsalvalai@uade.edu.ar',
  'admin@test.com',
  'juan@gmail.com',
  'maria@gmail.com',
  'ricardo@gmail.com'
];

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

  async updateUserCreatedByAdmin(userDN, currentMetadata, email) {
    try {
      console.log(`🔄 Actualizando created_by_admin a true para ${email}`);

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

      const tempFile = path.join('/tmp', `update_${email.replace('@', '_').replace('.', '_')}_${Date.now()}.ldif`);
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

  async updateAllUsers() {
    console.log('🎯 ACTUALIZANDO USUARIOS ALEATORIOS');
    console.log('='.repeat(50));
    console.log();

    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < USERS_TO_UPDATE.length; i++) {
      const email = USERS_TO_UPDATE[i];
      console.log(`\n${'─'.repeat(50)}`);
      console.log(`📧 Procesando usuario ${i + 1}/${USERS_TO_UPDATE.length}: ${email}`);
      console.log('─'.repeat(50));

      const user = await this.findUserByEmail(email);
      
      if (!user) {
        console.log(`❌ No se pudo procesar ${email}\n`);
        failCount++;
        continue;
      }

      console.log(`🔗 DN: ${user.dn}`);
      console.log();

      const success = await this.updateUserCreatedByAdmin(user.dn, user.description, email);
      
      if (success) {
        successCount++;
      } else {
        failCount++;
      }

      // Pequeña pausa para no sobrecargar el servidor
      await new Promise(resolve => setTimeout(resolve, 200));
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
    console.log('\n🔧 ACTUALIZADOR DE CAMPO created_by_admin (ALEATORIO)');
    console.log('====================================================');
    console.log(`Servidor: ${LDAP_CONFIG.url}`);
    console.log(`Base DN: ${LDAP_CONFIG.baseDN}`);
    console.log(`Users OU: ${LDAP_CONFIG.usersOU}`);
    console.log();

    const connected = await this.connect();
    if (!connected) {
      process.exit(1);
    }

    try {
      const success = await this.updateAllUsers();
      
      if (success) {
        console.log('\n✅ Todos los usuarios actualizados exitosamente');
        console.log('📝 Campo created_by_admin = true para usuarios seleccionados');
      } else {
        console.log('\n⚠️  Algunos usuarios no pudieron ser actualizados');
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
