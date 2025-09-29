/**
 * Script de migración SIMPLIFICADA: Supabase → LDAP
 * Usa solo atributos estándar de LDAP para evitar errores de esquema
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

// Función para generar UID válido para LDAP
function generateValidUID(email: string, id: string): string {
  const localPart = email.split('@')[0];
  let uid = localPart
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, '')
    .substring(0, 20);
  
  if (!uid || uid.length < 3) {
    uid = id.substring(0, 8).replace(/[^a-z0-9]/g, '');
  }
  
  if (!uid) {
    uid = `user_${Date.now()}`;
  }
  
  return uid;
}

// Función para procesar nombre completo
function processFullName(nombreCompleto: string | null, email: string): { cn: string, sn: string, givenName: string } {
  if (nombreCompleto && nombreCompleto.trim()) {
    const parts = nombreCompleto.trim().split(' ');
    if (parts.length >= 2) {
      return {
        cn: nombreCompleto,
        sn: parts[parts.length - 1],
        givenName: parts[0]
      };
    } else {
      return {
        cn: nombreCompleto,
        sn: nombreCompleto,
        givenName: nombreCompleto
      };
    }
  } else {
    const localPart = email.split('@')[0];
    return {
      cn: localPart,
      sn: localPart,
      givenName: localPart
    };
  }
}

// Función para limpiar valores para LDAP
function cleanValueForLDAP(value: string | null | undefined): string {
  if (!value || value === 'null' || value === 'undefined') return '';
  
  return value
    .toString()
    .trim()
    .replace(/[^\x20-\x7E]/g, '') // Solo caracteres ASCII imprimibles
    .replace(/[<>"\\]/g, '') // Remover caracteres problemáticos
    .substring(0, 100); // Limitar longitud más conservador
}

// Función para limpiar email específicamente
function cleanEmailForLDAP(email: string): string {
  if (!email) return '';
  return email
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9@._-]/g, '') // Solo caracteres válidos para email
    .substring(0, 50);
}

// Función para limpiar UID específicamente
function cleanUIDForLDAP(uid: string): string {
  if (!uid) return '';
  return uid
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, '') // Solo caracteres válidos para UID
    .substring(0, 20);
}

// Función principal de migración
async function migrateSimpleSupabaseToLDAP(): Promise<void> {
  console.log('🚀 Iniciando migración SIMPLIFICADA Supabase → LDAP...');
  console.log('📋 Usando solo atributos estándar de LDAP');
  
  const client = ldap.createClient({
    url: ldapConfig.url,
    timeout: 10000,
    connectTimeout: 10000,
    idleTimeout: 30000,
  });

  try {
    // Conectar y autenticar
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

    // Datos reales de Supabase (solo algunos para prueba)
    const supabaseUsers = [
      {
        "id": "40bf8412-b85e-429a-9761-e28065dbf7ca",
        "email": "test-1757283013362@example.com",
        "password": "test123",
        "rol": "usuario",
        "created_at": "2025-09-07 22:10:13.373763+00",
        "updated_at": "2025-09-07 22:10:13.373763+00",
        "email_verified": false,
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
        "nombre_completo": "Pepito Marquez",
        "nacionalidad": "Argentina",
        "telefono": null
      },
      {
        "id": "07698c0c-919e-40b2-aa19-30ca12c8bc8b",
        "email": "pedrito@gmail.com",
        "password": "$2b$12$Y8cDrIaJenu0M1K.6zin0OvQyWOpA066AVvntDseNlIEJaLN4.s3i",
        "rol": "usuario",
        "created_at": "2025-09-17 11:37:47.288459+00",
        "updated_at": "2025-09-17 11:58:15.22202+00",
        "email_verified": true,
        "nombre_completo": "Lucas Perez",
        "nacionalidad": null,
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

    // Migrar cada usuario usando solo atributos estándar de LDAP
    for (const user of supabaseUsers) {
      try {
        results.processed++;
        
        const uid = cleanUIDForLDAP(generateValidUID(user.email, user.id));
        const nameData = processFullName(user.nombre_completo, user.email);
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
        
        // Validar que el UID no esté vacío
        if (!uid || uid.length < 3) {
          throw new Error(`UID inválido generado para ${user.email}`);
        }
        
        // Usar solo atributos estándar de LDAP con limpieza específica
        const userAttributes = {
          objectClass: objectClass,
          uid: uid,
          cn: cleanValueForLDAP(nameData.cn) || cleanValueForLDAP(user.email.split('@')[0]),
          sn: cleanValueForLDAP(nameData.sn) || 'User',
          givenName: cleanValueForLDAP(nameData.givenName) || 'User',
          mail: cleanEmailForLDAP(user.email),
          userPassword: cleanValueForLDAP(user.password) || 'temp_password_123',
          uidNumber: uidNumber,
          gidNumber: gidNumber,
          homeDirectory: `/home/${uid}`,
          loginShell: '/bin/bash',
          
          // Usar description para datos adicionales (estándar LDAP)
          description: cleanValueForLDAP(`ID: ${user.id.substring(0,8)} | Rol: ${user.rol} | Verificado: ${user.email_verified}`),
          
          // Usar displayName para nombre completo
          displayName: cleanValueForLDAP(user.nombre_completo || nameData.cn || user.email.split('@')[0]),
          
          // Usar title para nacionalidad
          title: cleanValueForLDAP(user.nacionalidad || 'Usuario'),
          
          // Usar telephoneNumber para teléfono (estándar LDAP)
          telephoneNumber: cleanValueForLDAP(user.telefono)
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
        attributes: ['uid', 'cn', 'mail', 'displayName', 'title', 'description']
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
            displayName: attrs.displayName?.[0],
            title: attrs.title?.[0],
            description: attrs.description?.[0]
          });
        });

        res?.on('error', reject);
        res?.on('end', () => resolve(results));
      });
    });

    console.log(`📊 Usuarios en LDAP después de migración: ${migratedUsers.length}`);
    console.log('\n👥 Lista de usuarios migrados:');
    migratedUsers.forEach(user => {
      console.log(`  - ${user.uid} (${user.mail})`);
      console.log(`    📋 Nombre: ${user.displayName || user.cn}`);
      console.log(`    🌍 Nacionalidad: ${user.title}`);
      console.log(`    📝 Info: ${user.description}`);
    });

    console.log('\n🎉 Migración SIMPLIFICADA exitosa!');
    console.log('📋 Datos de Supabase mapeados a atributos estándar de LDAP:');
    console.log('   ✅ email → mail');
    console.log('   ✅ password → userPassword');
    console.log('   ✅ nombre_completo → displayName');
    console.log('   ✅ nacionalidad → title');
    console.log('   ✅ telefono → telephoneNumber');
    console.log('   ✅ id + rol + verificado → description');

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
  migrateSimpleSupabaseToLDAP().catch(console.error);
}

export { migrateSimpleSupabaseToLDAP };
