/**
 * Script para crear la estructura de usuarios en LDAP
 * Este script crea la OU de usuarios y algunos usuarios de ejemplo
 */

import * as ldap from 'ldapjs';
import { LDAPConfig } from '@/types/ldap.types';

// Configuración LDAP
const ldapConfig: LDAPConfig = {
  url: process.env.LDAP_URL || 'ldap://35.184.48.90:389',
  baseDN: process.env.LDAP_BASE_DN || 'dc=example,dc=com',
  bindDN: process.env.LDAP_BIND_DN || 'cn=admin,dc=example,dc=com',
  bindPassword: process.env.LDAP_BIND_PASSWORD || 'admin_password',
  usersOU: process.env.LDAP_USERS_OU || 'ou=users,dc=example,dc=com'
};

async function createLDAPStructure() {
  console.log('🏗️  Creando estructura LDAP para usuarios...');
  console.log('📋 Configuración:', {
    url: ldapConfig.url,
    baseDN: ldapConfig.baseDN,
    bindDN: ldapConfig.bindDN,
    usersOU: ldapConfig.usersOU
  });

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

    // Verificar si la OU de usuarios ya existe
    console.log('\n🔍 Verificando estructura existente...');
    try {
      await new Promise<void>((resolve, reject) => {
        client.search(ldapConfig.usersOU, { scope: 'base' }, (err, res) => {
          if (err) {
            if (err.code === 32) { // No such object
              console.log('📁 OU de usuarios no existe, creándola...');
              resolve();
            } else {
              reject(err);
            }
          } else {
            res?.on('end', () => {
              console.log('✅ OU de usuarios ya existe');
              resolve();
            });
          }
        });
      });
    } catch (error: any) {
      if (error.code === 32) {
        // Crear la OU de usuarios
        console.log('📁 Creando OU de usuarios...');
        await new Promise<void>((resolve, reject) => {
          const ouAttributes = {
            objectClass: ['organizationalUnit', 'top'],
            ou: ['users'],
            description: ['Organizational Unit for users']
          };

          client.add(ldapConfig.usersOU, ouAttributes, (err) => {
            if (err) {
              reject(new Error(`Failed to create users OU: ${err.message}`));
            } else {
              console.log('✅ OU de usuarios creada exitosamente');
              resolve();
            }
          });
        });
      } else {
        throw error;
      }
    }

    // Crear usuarios de ejemplo
    const exampleUsers = [
      {
        uid: 'admin',
        cn: 'Administrator',
        sn: 'Admin',
        givenName: 'Admin',
        mail: 'admin@example.com',
        userPassword: 'admin123',
        uidNumber: '1000',
        gidNumber: '100'
      },
      {
        uid: 'testuser',
        cn: 'Test User',
        sn: 'User',
        givenName: 'Test',
        mail: 'test@example.com',
        userPassword: 'test123',
        uidNumber: '1001',
        gidNumber: '100'
      },
      {
        uid: 'john.doe',
        cn: 'John Doe',
        sn: 'Doe',
        givenName: 'John',
        mail: 'john.doe@example.com',
        userPassword: 'password123',
        uidNumber: '1002',
        gidNumber: '100'
      }
    ];

    console.log('\n👥 Creando usuarios de ejemplo...');
    
    for (const userData of exampleUsers) {
      const userDN = `uid=${userData.uid},${ldapConfig.usersOU}`;
      
      // Verificar si el usuario ya existe
      try {
        await new Promise<void>((resolve, reject) => {
          client.search(userDN, { scope: 'base' }, (err, res) => {
            if (err) {
              if (err.code === 32) { // No such object
                resolve();
              } else {
                reject(err);
              }
            } else {
              res?.on('end', () => {
                reject(new Error('User already exists'));
              });
            }
          });
        });
      } catch (error: any) {
        if (error.message === 'User already exists') {
          console.log(`⚠️  Usuario ${userData.uid} ya existe, saltando...`);
          continue;
        }
      }

      // Crear el usuario
      const userAttributes = {
        objectClass: ['inetOrgPerson', 'posixAccount', 'top'],
        uid: userData.uid,
        cn: userData.cn,
        sn: userData.sn,
        givenName: userData.givenName,
        mail: userData.mail,
        userPassword: userData.userPassword,
        uidNumber: userData.uidNumber,
        gidNumber: userData.gidNumber,
        homeDirectory: `/home/${userData.uid}`,
        loginShell: '/bin/bash'
      };

      await new Promise<void>((resolve, reject) => {
        client.add(userDN, userAttributes, (err) => {
          if (err) {
            reject(new Error(`Failed to create user ${userData.uid}: ${err.message}`));
          } else {
            console.log(`✅ Usuario ${userData.uid} creado exitosamente`);
            resolve();
          }
        });
      });
    }

    // Listar usuarios creados
    console.log('\n📋 Listando usuarios creados...');
    await new Promise<void>((resolve, reject) => {
      const users: any[] = [];
      
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
          users.push({
            uid: entry.attributes.find(attr => attr.type === 'uid')?.values?.[0] || '',
            cn: entry.attributes.find(attr => attr.type === 'cn')?.values?.[0] || '',
            mail: entry.attributes.find(attr => attr.type === 'mail')?.values?.[0] || ''
          });
        });

        res?.on('error', (err) => {
          reject(err);
        });

        res?.on('end', () => {
          console.log(`📊 Total de usuarios: ${users.length}`);
          users.forEach(user => {
            console.log(`  - ${user.uid} (${user.cn}) - ${user.mail}`);
          });
          resolve();
        });
      });
    });

    console.log('\n🎉 Estructura LDAP creada exitosamente!');
    console.log('\n📝 Próximos pasos:');
    console.log('1. Configurar las variables de entorno en tu archivo .env');
    console.log('2. Ejecutar el servidor de desarrollo: npm run dev');
    console.log('3. Probar los endpoints de la API');
    console.log('4. Acceder a phpLDAPadmin para gestionar usuarios');

  } catch (error) {
    console.error('❌ Error creando estructura LDAP:', error);
    console.log('\n💡 Posibles soluciones:');
    console.log('1. Verificar que el servidor LDAP esté ejecutándose');
    console.log('2. Verificar las credenciales de administrador');
    console.log('3. Verificar que el Base DN existe en el servidor');
    console.log('4. Verificar permisos de escritura en el servidor LDAP');
  } finally {
    // Cerrar conexión
    client.unbind(() => {
      console.log('🔌 Conexión LDAP cerrada');
    });
  }
}

// Ejecutar script
if (require.main === module) {
  createLDAPStructure().catch(console.error);
}

export { createLDAPStructure };

