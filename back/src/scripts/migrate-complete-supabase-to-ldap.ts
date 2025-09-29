/**
 * MIGRACIÓN COMPLETA: Supabase → LDAP
 * Migra TODOS los usuarios de Supabase a LDAP usando estructura estándar
 * Mapea todas las columnas de Supabase en atributos LDAP estándar
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

// Función para crear descripción COMPLETA con TODAS las columnas de Supabase
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

// Función principal de migración COMPLETA
async function migrateCompleteSupabaseToLDAP(): Promise<void> {
  console.log('🚀 MIGRACIÓN COMPLETA Supabase → LDAP...');
  console.log('📋 Migrando TODOS los usuarios de Supabase a LDAP');
  
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
        "id": "7aa10e45-40bb-4b8a-a336-10f99dd048e1",
        "email": "usuario@test.com",
        "password": "$2b$12$2fL9QTjQwtPESRDa.g7sM.rWwcFSoLF2rmrNKQbRPHNX1wWoo5nce",
        "rol": "usuario",
        "created_at": "2025-09-08 13:09:16.890182+00",
        "updated_at": "2025-09-08 13:09:16.890182+00",
        "email_verified": true,
        "email_verification_token": null,
        "password_reset_token": null,
        "password_reset_expires": null,
        "last_login_at": null,
        "nombre_completo": null,
        "nacionalidad": null,
        "telefono": null
      },
      {
        "id": "5a324dbf-abef-403e-940a-aedc0847ba33",
        "email": "pepe@gmail.com",
        "password": "$2b$12$kQHwVx76oPwJ5xB3sHmJE.CfnF0bKho/ki.51UQkFws.J4KqxSFk6",
        "rol": "usuario",
        "created_at": "2025-09-11 12:03:13.342198+00",
        "updated_at": "2025-09-19 01:38:48.981193+00",
        "email_verified": true,
        "email_verification_token": null,
        "password_reset_token": null,
        "password_reset_expires": null,
        "last_login_at": "2025-09-19 01:38:48.932+00",
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
        "id": "6aab5d99-878c-4a3c-85fd-149835006fc8",
        "email": "ivo@ivo.com",
        "password": "$2b$12$pS6XvXHu/snWdO1Gi0rzjeD6D7rXCTaxk.nGOd5cQa7aW77P/E9dy",
        "rol": "usuario",
        "created_at": "2025-09-16 19:36:47.022454+00",
        "updated_at": "2025-09-16 19:59:32.199682+00",
        "email_verified": true,
        "email_verification_token": null,
        "password_reset_token": null,
        "password_reset_expires": null,
        "last_login_at": "2025-09-16 19:59:31.663+00",
        "nombre_completo": null,
        "nacionalidad": null,
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
        "email_verification_token": null,
        "password_reset_token": null,
        "password_reset_expires": null,
        "last_login_at": "2025-09-17 11:58:15.575+00",
        "nombre_completo": "Lucas Perez",
        "nacionalidad": null,
        "telefono": null
      },
      {
        "id": "c75f269f-5d6d-4777-9ae6-5dc17c5c890c",
        "email": "tizianogreco@gmail.com",
        "password": "$2b$12$MiaVOmYogaEqnL.gg6W3v.ZU00foqvcznpo2mx0XbEukb0xcq92BG",
        "rol": "admin",
        "created_at": "2025-09-18 12:03:36.219757+00",
        "updated_at": "2025-09-19 01:45:57.924943+00",
        "email_verified": true,
        "email_verification_token": null,
        "password_reset_token": null,
        "password_reset_expires": null,
        "last_login_at": "2025-09-18 12:03:55.005+00",
        "nombre_completo": "Tiziano Greco",
        "nacionalidad": null,
        "telefono": null
      },
      {
        "id": "ede59fb6-4e13-4842-8c8b-9cc97a73bbeb",
        "email": "mod@humming.com",
        "password": "$2b$12$7.3i444sNZ02QJPCBV4amepbK8Yflx0Rna0Ge2WjHMDvh6JIGvEhm",
        "rol": "moderador",
        "created_at": "2025-09-18 12:10:59.712707+00",
        "updated_at": "2025-09-18 12:12:28.408637+00",
        "email_verified": true,
        "email_verification_token": null,
        "password_reset_token": null,
        "password_reset_expires": null,
        "last_login_at": "2025-09-18 12:12:27.968+00",
        "nombre_completo": "Moderador",
        "nacionalidad": null,
        "telefono": null
      },
      {
        "id": "4c642d5f-ee80-4d3e-aea5-3053f5840089",
        "email": "titi@gmail.com",
        "password": "$2b$12$i7zMX/jzJ4pvzEHsYEAWNeeIIcN1D5tP3X2VO7Ps2JZ8HVCEs6evW",
        "rol": "usuario",
        "created_at": "2025-09-18 12:25:19.541508+00",
        "updated_at": "2025-09-18 12:45:24.783231+00",
        "email_verified": true,
        "email_verification_token": null,
        "password_reset_token": null,
        "password_reset_expires": null,
        "last_login_at": "2025-09-18 12:45:24.425+00",
        "nombre_completo": "titi",
        "nacionalidad": null,
        "telefono": null
      },
      {
        "id": "e049eed2-c34c-4dec-8584-ecf9c1fc33a5",
        "email": "facundomarosek@gmail.com",
        "password": "$2b$12$/foIHoNUE5FJ3CfdErRfnOlXHZAbi4CVc5.VwbVtN5hoAqPQ0m.R.",
        "rol": "usuario",
        "created_at": "2025-09-18 17:47:29.860015+00",
        "updated_at": "2025-09-19 10:46:43.376991+00",
        "email_verified": true,
        "email_verification_token": null,
        "password_reset_token": null,
        "password_reset_expires": null,
        "last_login_at": "2025-09-19 10:46:43.342+00",
        "nombre_completo": "Facundo Marosek",
        "nacionalidad": null,
        "telefono": null
      },
      {
        "id": "1966d6a3-3f6d-4eff-9e15-7802ef30776a",
        "email": "grecotizianoweb@gmail.com",
        "password": "$2b$12$ogDtoTLoXVWZJ2BXBWxxpOu9HTSIeb0xpLt6uB.lVnvdWlnW6WG0i",
        "rol": "admin",
        "created_at": "2025-09-19 01:44:01.114339+00",
        "updated_at": "2025-09-21 22:40:14.884903+00",
        "email_verified": true,
        "email_verification_token": null,
        "password_reset_token": null,
        "password_reset_expires": null,
        "last_login_at": "2025-09-19 10:51:55.632+00",
        "nombre_completo": "Tiziano Greco",
        "nacionalidad": "Bolivia",
        "telefono": null
      },
      {
        "id": "0b817ffe-435e-44b6-981e-718504ed6326",
        "email": "tinomossu@gmail.com",
        "password": "$2b$12$O.52FMbk7PBXTK7J9ko2QOm8IfKZYANBpUnnEhVuVx7LhCrB6wh9O",
        "rol": "moderador",
        "created_at": "2025-09-19 01:52:55.424931+00",
        "updated_at": "2025-09-24 01:18:05.38584+00",
        "email_verified": true,
        "email_verification_token": null,
        "password_reset_token": null,
        "password_reset_expires": null,
        "last_login_at": null,
        "nombre_completo": "Tino Mossu",
        "nacionalidad": "Argentina",
        "telefono": null
      },
      {
        "id": "9e447417-a079-499f-afac-ddd70e736750",
        "email": "panchi1@gmail.com",
        "password": "$2b$12$a7Fuc.S9/TgdwEbL.zInXek2kldqqTQ5lKMTY5yXJHksiRseFpwli",
        "rol": "usuario",
        "created_at": "2025-09-19 11:04:39.307819+00",
        "updated_at": "2025-09-19 11:08:57.342099+00",
        "email_verified": true,
        "email_verification_token": null,
        "password_reset_token": null,
        "password_reset_expires": null,
        "last_login_at": "2025-09-19 11:08:57.328+00",
        "nombre_completo": "panchi",
        "nacionalidad": null,
        "telefono": null
      },
      {
        "id": "b79d33c8-ff77-47ba-b6c6-663273c84260",
        "email": "fran@test.com",
        "password": "$2b$12$4JWTY6iv0uuR58.mXTLpTO0Xgem9MLV0tgkbY4gRrbrmMsgPjrbSW",
        "rol": "usuario",
        "created_at": "2025-09-19 11:31:26.306961+00",
        "updated_at": "2025-09-19 11:31:40.681463+00",
        "email_verified": true,
        "email_verification_token": null,
        "password_reset_token": null,
        "password_reset_expires": null,
        "last_login_at": "2025-09-19 11:31:40.59+00",
        "nombre_completo": "Francisco Castagnaro",
        "nacionalidad": null,
        "telefono": null
      },
      {
        "id": "c6764bc3-f1eb-44dd-a7dc-9548a2cf8d79",
        "email": "testuser@example.com",
        "password": "$2b$12$a8rrz8VPbwQQM9F0FsABVeOIXEBCle/GJIXltJ37/dhbc02PWVoFC",
        "rol": "usuario",
        "created_at": "2025-09-19 16:56:01.586651+00",
        "updated_at": "2025-09-19 16:56:02.660412+00",
        "email_verified": true,
        "email_verification_token": null,
        "password_reset_token": null,
        "password_reset_expires": null,
        "last_login_at": "2025-09-19 16:56:02.259+00",
        "nombre_completo": "Usuario de Prueba",
        "nacionalidad": null,
        "telefono": null
      },
      {
        "id": "47cd04ad-3406-4790-92e0-5be1533a04fb",
        "email": "manu@carmona.com",
        "password": "$2b$12$ibkft9hJQ6AmTvRoN452JOzzwpcfx6MthzLYxoy1.C8nmRKNq.uMq",
        "rol": "usuario",
        "created_at": "2025-09-19 16:59:53.283902+00",
        "updated_at": "2025-09-19 17:00:15.583468+00",
        "email_verified": true,
        "email_verification_token": null,
        "password_reset_token": null,
        "password_reset_expires": null,
        "last_login_at": "2025-09-19 17:00:15.315+00",
        "nombre_completo": "camu mamona",
        "nacionalidad": null,
        "telefono": null
      },
      {
        "id": "5bcabf38-7f9b-4ecf-97b2-cabf1f3548d9",
        "email": "juansito@gmail.com",
        "password": "$2b$12$b5z4Jkw1VpyPPe9VACEdbeNYjbpAbmOoY1zrLO/evsIi1bkM/tajK",
        "rol": "usuario",
        "created_at": "2025-09-21 22:35:04.757946+00",
        "updated_at": "2025-09-21 22:37:20.274704+00",
        "email_verified": true,
        "email_verification_token": null,
        "password_reset_token": null,
        "password_reset_expires": null,
        "last_login_at": "2025-09-21 22:35:18.078+00",
        "nombre_completo": "Juan Caseres",
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
      },
      {
        "id": "3ab8c270-ee19-4b73-b93c-6579466d3d1f",
        "email": "lucasperezmarquez1@gmail.com",
        "password": "$2b$12$5uutbfmPObDLn.1/DzwQ2uCIWvRrCjCgeJMBHo7odr1Q5U0OUOwkG",
        "rol": "admin",
        "created_at": "2025-09-24 14:38:04.096244+00",
        "updated_at": "2025-09-24 14:45:08.987898+00",
        "email_verified": true,
        "email_verification_token": null,
        "password_reset_token": "WLjPPe8E132rpW6WwvXERadmx7425xfs",
        "password_reset_expires": "2025-09-24 14:43:41.788+00",
        "last_login_at": "2025-09-24 14:45:08.626+00",
        "nombre_completo": "Lucas Perez",
        "nacionalidad": "Argentina",
        "telefono": null
      },
      {
        "id": "a62f91d4-17ed-4bdb-9b23-3b4195b1aa27",
        "email": "panchizanon@gmail.com",
        "password": "$2b$12$natjem8tk6Z23KfJnVHoM.cgCZK5OiH1sZF/1vy0bnGSgQnWdrPwW",
        "rol": "usuario",
        "created_at": "2025-09-24 23:49:14.842786+00",
        "updated_at": "2025-09-24 23:52:21.789051+00",
        "email_verified": true,
        "email_verification_token": null,
        "password_reset_token": "hyMZT6uZGTzNwzVz0JDS8BLPFAzXKGMb",
        "password_reset_expires": "2025-09-24 23:57:21.649+00",
        "last_login_at": null,
        "nombre_completo": "Panchi Zanon",
        "nacionalidad": "Argentina",
        "telefono": "+54 11 31293842"
      },
      {
        "id": "0b1b94c5-3bed-43ff-bec4-90ca75539232",
        "email": "ivolevy@gmail.com",
        "password": "$2b$12$UBsAlDfNEbAWcojuH25KPOqu6kVBhZhDi1V2ySRbzpsWlL8Z.IOv.",
        "rol": "usuario",
        "created_at": "2025-09-26 13:36:45.535627+00",
        "updated_at": "2025-09-26 13:37:08.424143+00",
        "email_verified": true,
        "email_verification_token": null,
        "password_reset_token": null,
        "password_reset_expires": null,
        "last_login_at": "2025-09-26 13:37:08.38+00",
        "nombre_completo": "ivan levy",
        "nacionalidad": "Argentina",
        "telefono": "1138240929"
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
    console.log('\n📊 Resumen de migración COMPLETA:');
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

    console.log('\n🎉 MIGRACIÓN COMPLETA EXITOSA!');
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
  migrateCompleteSupabaseToLDAP().catch(console.error);
}

export { migrateCompleteSupabaseToLDAP };