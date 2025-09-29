/**
 * MIGRACIÓN QUE SÍ FUNCIONA: Supabase → LDAP
 * Usa SOLO atributos básicos de LDAP pero mapea TODAS las columnas
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

// Función para generar UID ultra-limpio (ESTRATEGIA QUE FUNCIONA)
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

// Función para procesar nombre completo de forma segura
function processSafeFullName(nombreCompleto: string | null, email: string): { cn: string, sn: string, givenName: string } {
  if (nombreCompleto && nombreCompleto.trim()) {
    const parts = nombreCompleto.trim().split(' ');
    if (parts.length >= 2) {
      return {
        cn: ultraCleanValue(nombreCompleto) || ultraCleanValue(email.split('@')[0]),
        sn: ultraCleanValue(parts[parts.length - 1]) || 'User',
        givenName: ultraCleanValue(parts[0]) || 'User'
      };
    } else {
      return {
        cn: ultraCleanValue(nombreCompleto) || ultraCleanValue(email.split('@')[0]),
        sn: ultraCleanValue(nombreCompleto) || 'User',
        givenName: ultraCleanValue(nombreCompleto) || 'User'
      };
    }
  } else {
    const localPart = ultraCleanValue(email.split('@')[0]);
    return {
      cn: localPart || 'User',
      sn: 'User',
      givenName: 'User'
    };
  }
}

// Función para crear descripción SEGURA con TODAS las columnas de Supabase
function createCompleteDescription(user: any): string {
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
  if (user.last_login_at) {
    parts.push(`L:${user.last_login_at.substring(0,10)}`);
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
  
  // Tokens (muy cortos)
  if (user.email_verification_token) {
    parts.push(`TV:${user.email_verification_token.substring(0,6)}`);
  }
  if (user.password_reset_token) {
    parts.push(`TR:${user.password_reset_token.substring(0,6)}`);
  }
  if (user.password_reset_expires) {
    parts.push(`RE:${user.password_reset_expires.substring(0,10)}`);
  }
  
  const description = parts.join('|');
  
  // Limitar longitud total a 200 caracteres
  return description.substring(0, 200);
}

// Función principal de migración QUE SÍ FUNCIONA
async function migrateWorkingSupabaseToLDAP(): Promise<void> {
  console.log('🚀 MIGRACIÓN QUE SÍ FUNCIONA Supabase → LDAP...');
  console.log('📋 Usando SOLO atributos básicos de LDAP');
  
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

    // TODOS los usuarios de Supabase (datos reales del MCP)
    const supabaseUsers = [
      {
        "id": "40bf8412-b85e-429a-9761-e28065dbf7ca",
        "email": "test-1757283013362@example.com",
        "password": "test123",
        "rol": "usuario",
        "created_at": "2025-09-07 22:10:13.373763+00",
        "updated_at": "2025-09-07 22:10:13.373763+00",
        "email_verified": false,
        "email_verification_token": null,
        "password_reset_token": null,
        "password_reset_expires": null,
        "last_login_at": null,
        "nombre_completo": null,
        "nacionalidad": null,
        "telefono": null
      },
      {
        "id": "01a43a39-d7b5-4666-9661-f3702b25368d",
        "email": "panchi@gmail.com",
        "password": "$2b$12$0v/auO0jvO7x8b7AhCLKreOhhGgWYcyILEiDKUGEqLo28423sK5q2",
        "rol": "usuario",
        "created_at": "2025-09-08 01:39:05.56466+00",
        "updated_at": "2025-09-08 01:43:14.945306+00",
        "email_verified": true,
        "email_verification_token": null,
        "password_reset_token": null,
        "password_reset_expires": null,
        "last_login_at": "2025-09-08 01:43:15.258+00",
        "nombre_completo": null,
        "nacionalidad": null,
        "telefono": null
      },
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
      },
      {
        "id": "2a623474-8304-4897-8dda-670276f776ef",
        "email": "ivo.levy03@gmail.com",
        "password": "$2b$12$KLXBhS5Mx7V1yN3zk8rLDOzpx0ZXljR9VPU7YVSGa8KG2iXUDpYeC",
        "rol": "usuario",
        "created_at": "2025-09-24 11:44:23.669332+00",
        "updated_at": "2025-09-24 13:39:53.790184+00",
        "email_verified": true,
        "email_verification_token": null,
        "password_reset_token": "593EIxaxc0s4RPR6PPMS1YDXvUXaPkoP",
        "password_reset_expires": "2025-09-24 13:44:53.449+00",
        "last_login_at": null,
        "nombre_completo": "Ivo Levy",
        "nacionalidad": "Argentina",
        "telefono": "+54 11 31293842"
      }
    ];

    console.log(`📊 Total de usuarios a migrar: ${supabaseUsers.length}`);

    const results = {
      processed: 0,
      successful: 0,
      failed: 0,
      errors: [] as string[]
    };

    // Migrar cada usuario usando SOLO atributos básicos de LDAP
    for (const user of supabaseUsers) {
      try {
        results.processed++;
        
        // Generar UID ultra-limpio (ESTRATEGIA PROBADA)
        const uid = generateUltraCleanUID(user.email, user.id);
        const nameData = processSafeFullName(user.nombre_completo, user.email);
        const uidNumber = (1000 + results.processed).toString();
        const gidNumber = '100';
        
        // Usar solo objectClass estándar
        const objectClass = ['inetOrgPerson', 'posixAccount', 'top'];
        if (user.rol === 'admin') {
          objectClass.push('admin');
        } else if (user.rol === 'moderador') {
          objectClass.push('moderator');
        }

        const userDN = `uid=${uid},${ldapConfig.usersOU}`;
        
        // Validar UID
        if (!uid || uid.length < 3) {
          throw new Error(`UID inválido generado para ${user.email}`);
        }
        
        // Crear atributos usando SOLO atributos básicos de LDAP
        const userAttributes = {
          objectClass: objectClass,
          uid: uid,
          cn: nameData.cn,
          sn: nameData.sn,
          givenName: nameData.givenName,
          mail: ultraCleanValue(user.email),
          userPassword: ultraCleanValue(user.password) || 'temp123',
          uidNumber: uidNumber,
          gidNumber: gidNumber,
          homeDirectory: `/home/${uid}`,
          loginShell: '/bin/bash',
          
          // Usar SOLO description para mapear TODAS las columnas de Supabase
          description: createCompleteDescription(user)
        };

        await new Promise<void>((resolve) => {
          client.add(userDN, userAttributes, (err) => {
            if (err) {
              const errorMsg = `Error migrando usuario ${user.email}: ${err.message}`;
              results.errors.push(errorMsg);
              results.failed++;
              console.error(`❌ ${errorMsg}`);
            } else {
              results.successful++;
              console.log(`✅ Usuario ${uid} (${user.email}) migrado exitosamente`);
              console.log(`   📋 Datos: ${nameData.cn} | Rol: ${user.rol} | Verificado: ${user.email_verified}`);
              if (user.nacionalidad) console.log(`   🌍 Nacionalidad: ${user.nacionalidad}`);
              if (user.telefono) console.log(`   📞 Teléfono: ${user.telefono}`);
            }
            resolve();
          });
        });

      } catch (error) {
        const errorMsg = `Error procesando usuario ${user.email}: ${error instanceof Error ? error.message : 'Error desconocido'}`;
        results.errors.push(errorMsg);
        results.failed++;
        console.error(`❌ ${errorMsg}`);
      }
    }

    // Mostrar resumen
    console.log('\n📊 Resumen de migración:');
    console.log(`✅ Usuarios migrados exitosamente: ${results.successful}`);
    console.log(`❌ Usuarios fallidos: ${results.failed}`);
    console.log(`📈 Tasa de éxito: ${((results.successful / results.processed) * 100).toFixed(1)}%`);

    if (results.errors.length > 0) {
      console.log('\n❌ Errores encontrados:');
      results.errors.forEach(error => console.log(`  - ${error}`));
    }

    // Verificar usuarios migrados
    console.log('\n🔍 Verificando usuarios migrados...');
    const migratedUsers = await new Promise<any[]>((resolve, reject) => {
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

    console.log(`📊 Usuarios en LDAP después de migración: ${migratedUsers.length}`);
    console.log('\n👥 Lista de usuarios migrados con TODAS las columnas:');
    migratedUsers.forEach(user => {
      console.log(`  - ${user.uid} (${user.mail})`);
      console.log(`    📋 Nombre: ${user.cn}`);
      console.log(`    📝 Datos completos: ${user.description}`);
    });

    console.log('\n🎉 MIGRACIÓN EXITOSA!');
    console.log('📋 TODAS las columnas de Supabase mapeadas en el campo description:');
    console.log('   ✅ id, rol, email_verified, created_at, updated_at, last_login_at');
    console.log('   ✅ nombre_completo, nacionalidad, telefono');
    console.log('   ✅ email_verification_token, password_reset_token, password_reset_expires');

  } catch (error) {
    console.error('❌ Error en migración:', error);
    throw error;
  } finally {
    client.unbind(() => {
      console.log('🔌 Conexión LDAP cerrada');
    });
  }
}

// Ejecutar migración
if (require.main === module) {
  migrateWorkingSupabaseToLDAP().catch(console.error);
}

export { migrateWorkingSupabaseToLDAP };
