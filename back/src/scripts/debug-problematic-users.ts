/**
 * Script de diagnóstico para usuarios problemáticos
 * Identifica exactamente qué causa el error en admin@test.com y pepito@gmail.com
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

// Función para limpiar valores de forma ultra-conservadora
function ultraCleanValue(value: string | null | undefined): string {
  if (!value) return '';
  
  return value
    .toString()
    .trim()
    .replace(/[^a-zA-Z0-9@._-]/g, '') // Solo caracteres alfanuméricos y básicos
    .substring(0, 50);
}

// Función para crear descripción SEGURA
function createSafeDescription(user: any): string {
  const parts = [];
  
  // Información básica (muy corta)
  parts.push(`ID:${user.id.substring(0,6)}`);
  parts.push(`Rol:${user.rol}`);
  parts.push(`Ver:${user.email_verified ? 'S' : 'N'}`);
  
  // Fechas (solo año-mes-día)
  if (user.created_at) {
    parts.push(`C:${user.created_at.substring(0,10)}`);
  }
  if (user.updated_at) {
    parts.push(`U:${user.updated_at.substring(0,10)}`);
  }
  
  // Información personal (muy corta)
  if (user.nombre_completo) {
    const nombre = ultraCleanValue(user.nombre_completo).substring(0, 10);
    parts.push(`Nom:${nombre}`);
  }
  if (user.nacionalidad) {
    const nac = ultraCleanValue(user.nacionalidad).substring(0, 5);
    parts.push(`Nac:${nac}`);
  }
  if (user.telefono) {
    const tel = ultraCleanValue(user.telefono).substring(0, 10);
    parts.push(`Tel:${tel}`);
  }
  
  return parts.join('|');
}

// Función de diagnóstico
async function debugProblematicUsers(): Promise<void> {
  console.log('🔍 DIAGNÓSTICO de usuarios problemáticos...');
  
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

    // Usuarios problemáticos específicos
    const problematicUsers = [
      {
        "id": "8df1a56e-0304-4c16-ae46-09c40808a227",
        "email": "admin@test.com",
        "password": "$2b$12$ZwEBnRNh0uq4WMaOl/8poOCywir8Gm1E.jxAxN15/4qPmQVNWBTTi",
        "rol": "admin",
        "created_at": "2025-09-08 13:08:11.967327+00",
        "updated_at": "2025-09-08 13:17:40.506173+00",
        "email_verified": true,
        "email_verification_token": null,
        "password_reset_token": null,
        "password_reset_expires": null,
        "last_login_at": "2025-09-08 13:17:40.361+00",
        "nombre_completo": null,
        "nacionalidad": null,
        "telefono": null
      },
      {
        "id": "83ddd0a0-0e0c-48d0-aadf-54fafe109147",
        "email": "pepito@gmail.com",
        "password": "$2b$10$CLWrh8REZoQxSKqKQzsi0O3PbywPFaLmojCIdkqXOnCQYwClOOdFm",
        "rol": "admin",
        "created_at": "2025-09-11 12:54:26.327159+00",
        "updated_at": "2025-09-26 12:47:27.454255+00",
        "email_verified": true,
        "email_verification_token": null,
        "password_reset_token": null,
        "password_reset_expires": null,
        "last_login_at": "2025-09-26 12:47:27.407+00",
        "nombre_completo": "Pepito Marquez",
        "nacionalidad": "Argentina",
        "telefono": null
      }
    ];

    console.log(`\n📊 Probando migración con ${problematicUsers.length} usuarios problemáticos...`);

    for (let i = 0; i < problematicUsers.length; i++) {
      const user = problematicUsers[i];
      console.log(`\n🔍 Procesando usuario problemático ${i + 1}: ${user.email}`);
      
      try {
        // Generar datos ultra-limpios
        const uid = generateUltraCleanUID(user.email, user.id);
        const cleanEmail = ultraCleanValue(user.email);
        const cleanPassword = ultraCleanValue(user.password);
        const safeDescription = createSafeDescription(user);
        
        console.log(`   📋 UID generado: "${uid}"`);
        console.log(`   📧 Email limpio: "${cleanEmail}"`);
        console.log(`   🔑 Password limpio: "${cleanPassword.substring(0, 20)}..."`);
        console.log(`   📝 Descripción segura: "${safeDescription}"`);
        console.log(`   📏 Longitud descripción: ${safeDescription.length} caracteres`);
        
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
          uidNumber: (2000 + i + 1).toString(),
          gidNumber: '100',
          homeDirectory: `/home/${uid}`,
          loginShell: '/bin/bash',
          description: safeDescription
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
        attributes: ['uid', 'cn', 'mail', 'description']
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
            mail: attrs.mail?.[0],
            description: attrs.description?.[0]
          });
        });

        res?.on('error', reject);
        res?.on('end', () => resolve(results));
      });
    });

    console.log(`📊 Usuarios creados exitosamente: ${createdUsers.length}`);
    createdUsers.forEach(user => {
      console.log(`   - ${user.uid} (${user.mail})`);
      console.log(`     📝 Descripción: ${user.description}`);
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
  debugProblematicUsers().catch(console.error);
}

export { debugProblematicUsers };
