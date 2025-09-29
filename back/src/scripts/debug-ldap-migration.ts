/**
 * Script de DIAGNÓSTICO para migración LDAP
 * Identifica exactamente qué causa los errores de sintaxis
 */

import * as ldap from 'ldapjs';
import { LDAPConfig } from '../types/ldap.types';

// Configuración LDAP
const ldapConfig: LDAPConfig = {
  url: process.env.LDAP_URL || 'ldap://35.184.48.90:389',
  baseDN: process.env.LDAP_BASE_DN || 'dc=empresa,dc=local',
  bindDN: process.env.LDAP_BIND_DN || 'cn=admin,dc=empresa,dc=local',
  bindPassword: process.env.LDAP_BIND_PASSWORD || 'boca2002',
  usersOU: process.env.LDAP_USERS_OU || 'ou=users,dc=empresa,dc=local'
};

// Función para limpiar valores de forma ultra-conservadora
function ultraCleanValue(value: string | null | undefined): string {
  if (!value) return '';
  
  return value
    .toString()
    .trim()
    .replace(/[^a-zA-Z0-9@._-]/g, '') // Solo caracteres alfanuméricos y básicos
    .substring(0, 50);
}

// Función para generar UID ultra-limpio
function generateUltraCleanUID(email: string, id: string): string {
  const localPart = email.split('@')[0];
  let uid = localPart
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '') // Solo letras y números
    .substring(0, 15);
  
  if (!uid || uid.length < 3) {
    uid = id.substring(0, 8).replace(/[^a-z0-9]/g, '');
  }
  
  if (!uid) {
    uid = `user${Date.now().toString().slice(-6)}`;
  }
  
  return uid;
}

// Función de diagnóstico
async function debugLDAPMigration(): Promise<void> {
  console.log('🔍 DIAGNÓSTICO de migración LDAP...');
  
  const client = ldap.createClient({
    url: ldapConfig.url,
    timeout: 10000,
    connectTimeout: 10000,
    idleTimeout: 30000,
  });

  try {
    // Conectar
    console.log('\n🔌 Conectando a LDAP...');
    await new Promise<void>((resolve, reject) => {
      client.bind(ldapConfig.bindDN, ldapConfig.bindPassword, (err) => {
        if (err) {
          reject(new Error(`LDAP Bind failed: ${err.message}`));
        } else {
          console.log('✅ Conexión LDAP exitosa');
          resolve();
        }
      });
    });

    // Limpiar usuarios existentes
    console.log('\n🧹 Limpiando base LDAP...');
    try {
      const existingUsers = await new Promise<any[]>((resolve, reject) => {
        const results: any[] = [];
        client.search(ldapConfig.usersOU, {
          scope: 'sub',
          filter: '(objectClass=inetOrgPerson)',
          attributes: ['uid']
        }, (err, res) => {
          if (err) {
            reject(err);
            return;
          }
          res?.on('searchEntry', (entry) => results.push(entry.dn.toString()));
          res?.on('error', reject);
          res?.on('end', () => resolve(results));
        });
      });

      console.log(`📊 Encontrados ${existingUsers.length} usuarios para eliminar`);
      
      for (const userDN of existingUsers) {
        await new Promise<void>((resolve) => {
          client.del(userDN, (err) => {
            if (err) console.warn(`⚠️  No se pudo eliminar ${userDN}: ${err.message}`);
            resolve();
          });
        });
      }
      
      console.log('✅ Base LDAP limpiada exitosamente');
    } catch (error) {
      console.log('⚠️  Error limpiando LDAP (continuando):', error);
    }

    // Datos de prueba con diagnóstico detallado
    const testUsers = [
      {
        "id": "40bf8412-b85e-429a-9761-e28065dbf7ca",
        "email": "test-1757283013362@example.com",
        "password": "test123",
        "rol": "usuario",
        "nombre_completo": null,
        "nacionalidad": null,
        "telefono": null
      },
      {
        "id": "01a43a39-d7b5-4666-9661-f3702b25368d",
        "email": "panchi@gmail.com",
        "password": "$2b$12$0v/auO0jvO7x8b7AhCLKreOhhGgWYcyILEiDKUGEqLo28423sK5q2",
        "rol": "usuario",
        "nombre_completo": null,
        "nacionalidad": null,
        "telefono": null
      }
    ];

    console.log(`\n📊 Probando migración con ${testUsers.length} usuarios...`);

    for (let i = 0; i < testUsers.length; i++) {
      const user = testUsers[i];
      console.log(`\n🔍 Procesando usuario ${i + 1}: ${user.email}`);
      
      try {
        // Generar datos ultra-limpios
        const uid = generateUltraCleanUID(user.email, user.id);
        const cleanEmail = ultraCleanValue(user.email);
        const cleanPassword = ultraCleanValue(user.password);
        
        console.log(`   📋 UID generado: "${uid}"`);
        console.log(`   📧 Email limpio: "${cleanEmail}"`);
        console.log(`   🔑 Password limpio: "${cleanPassword.substring(0, 20)}..."`);
        
        // Validar UID
        if (!uid || uid.length < 3) {
          throw new Error(`UID inválido: "${uid}"`);
        }
        
        // Validar email
        if (!cleanEmail || !cleanEmail.includes('@')) {
          throw new Error(`Email inválido: "${cleanEmail}"`);
        }
        
        // Crear atributos mínimos y seguros
        const userAttributes = {
          objectClass: ['inetOrgPerson', 'posixAccount', 'top'],
          uid: uid,
          cn: uid, // Usar UID como CN para evitar problemas
          sn: 'User',
          givenName: 'User',
          mail: cleanEmail,
          userPassword: cleanPassword || 'temp123',
          uidNumber: (1000 + i + 1).toString(),
          gidNumber: '100',
          homeDirectory: `/home/${uid}`,
          loginShell: '/bin/bash'
        };
        
        console.log(`   📋 Atributos a crear:`, Object.keys(userAttributes));
        
        const userDN = `uid=${uid},${ldapConfig.usersOU}`;
        console.log(`   🔗 DN: ${userDN}`);
        
        // Intentar crear usuario
        await new Promise<void>((resolve, reject) => {
          client.add(userDN, userAttributes, (err) => {
            if (err) {
              console.error(`   ❌ ERROR: ${err.message}`);
              console.error(`   🔍 Código de error: ${err.code}`);
              console.error(`   📋 Atributos problemáticos:`, userAttributes);
              reject(err);
            } else {
              console.log(`   ✅ Usuario creado exitosamente`);
              resolve();
            }
          });
        });
        
      } catch (error) {
        console.error(`   ❌ Error procesando usuario ${user.email}:`, error);
      }
    }

    // Verificar usuarios creados
    console.log('\n🔍 Verificando usuarios creados...');
    const createdUsers = await new Promise<any[]>((resolve, reject) => {
      const results: any[] = [];
      
      client.search(ldapConfig.usersOU, {
        scope: 'sub',
        filter: '(objectClass=inetOrgPerson)',
        attributes: ['uid', 'cn', 'mail']
      }, (err, res) => {
        if (err) {
          reject(err);
          return;
        }

        res?.on('searchEntry', (entry) => {
          const attrs: Record<string, string[]> = {};
          entry.attributes.forEach((attr: any) => {
            if (attr.type && attr.values) {
              attrs[attr.type] = attr.values;
            }
          });

          results.push({
            uid: attrs.uid?.[0],
            cn: attrs.cn?.[0],
            mail: attrs.mail?.[0]
          });
        });

        res?.on('error', reject);
        res?.on('end', () => resolve(results));
      });
    });

    console.log(`📊 Usuarios creados exitosamente: ${createdUsers.length}`);
    createdUsers.forEach(user => {
      console.log(`   - ${user.uid} (${user.mail})`);
    });

  } catch (error) {
    console.error('❌ Error en diagnóstico:', error);
    throw error;
  } finally {
    client.unbind(() => {
      console.log('🔌 Conexión LDAP cerrada');
    });
  }
}

// Ejecutar diagnóstico
if (require.main === module) {
  debugLDAPMigration().catch(console.error);
}

export { debugLDAPMigration };
