/**
 * Cliente LDAP para reemplazar Supabase
 * Implementa la misma interfaz que el cliente de Supabase para compatibilidad
 */

import { Client } from 'ldapts';
import { ldapConfig, Usuario, LDAPUserEntry } from './ldap-config';
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

class LDAPClient {
  private client: Client;

  constructor() {
    this.client = new Client({
      url: ldapConfig.url,
      timeout: 30000,
      connectTimeout: 30000
    });
  }

  private async connect(): Promise<void> {
    if (!this.client.isConnected) {
      try {
        console.log('🔗 Conectando a LDAP:', {
          url: ldapConfig.url,
          bindDN: ldapConfig.bindDN
        });
        await this.client.bind(ldapConfig.bindDN, ldapConfig.bindPassword);
        console.log('✅ Conexión LDAP exitosa');
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        const errorDetails = error instanceof Error ? error.stack : JSON.stringify(error);
        console.error('❌ Error conectando a LDAP:', {
          message: errorMessage,
          details: errorDetails,
          config: {
            url: ldapConfig.url,
            bindDN: ldapConfig.bindDN,
            hasPassword: !!ldapConfig.bindPassword
          }
        });
        throw new Error(`Error de conexión LDAP: ${errorMessage}. Verifica que el servidor LDAP esté corriendo en ${ldapConfig.url}`);
      }
    }
  }

  private async disconnect(): Promise<void> {
    if (this.client.isConnected) {
      await this.client.unbind();
    }
  }

  private generateUID(email: string): string {
    return email.split('@')[0];
  }

  private generateDN(uid: string): string {
    return `uid=${uid},${ldapConfig.usersOU}`;
  }

  private parseMetadataFromDescription(description: string): any {
    try {
      if (description && description.includes('Migrado desde Supabase -')) {
        const jsonPart = description.replace('Migrado desde Supabase - ', '');
        return JSON.parse(jsonPart);
      }
      return {};
    } catch {
      return {};
    }
  }

  private ldapUserToUsuario(ldapUser: any): Usuario {
    const metadata = this.parseMetadataFromDescription(ldapUser.description || '');
    
    // Debug: Log completo de la entrada LDAP
    console.log('🔍 [DEBUG] Entrada LDAP completa:', {
      dn: ldapUser.dn,
      description: ldapUser.description,
      telephoneNumber: ldapUser.telephoneNumber,
      metadata: metadata
    });
    
    // Debug: Log de lectura de telefono y nacionalidad
    console.log('🔍 [DEBUG] Leyendo telefono:', {
      metadataTelefono: metadata.telefono,
      ldapTelephoneNumber: ldapUser.telephoneNumber,
      finalTelefono: metadata.telefono || ldapUser.telephoneNumber || undefined
    });
    
    console.log('🔍 [DEBUG] Leyendo nacionalidad:', {
      metadataNacionalidad: metadata.nacionalidad,
      ldapSt: ldapUser.st,
      finalNacionalidad: metadata.nacionalidad || ldapUser.st || undefined
    });
    
    return {
      id: metadata.supabase_id || ldapUser.uid,
      email: ldapUser.mail,
      password: metadata.password || ldapUser.userPassword,
      rol: ldapUser.title || 'usuario',
      nombre_completo: metadata.nombre_completo || ldapUser.cn,
      nacionalidad: metadata.nacionalidad || ldapUser.st || undefined,
      telefono: metadata.telefono || ldapUser.telephoneNumber || undefined,
      email_verified: metadata.email_verified !== undefined ? metadata.email_verified : true,
      created_at: metadata.created_at || new Date().toISOString(),
      updated_at: metadata.updated_at || new Date().toISOString(),
      last_login_at: metadata.last_login_at,
      password_reset_token: metadata.password_reset_token,
      password_reset_expires: metadata.password_reset_expires,
      email_verification_token: metadata.email_verification_token,
      created_by_admin: metadata.created_by_admin,
      initial_password_changed: metadata.initial_password_changed
    };
  }

  // Métodos para usuarios (compatible con la interfaz de Supabase)
  get usuarios() {
    return {
      // Contar usuarios
      count: async (options?: { where?: { [key: string]: any } }): Promise<number> => {
        try {
          await this.connect();

          const searchResult = await this.client.search(ldapConfig.usersOU, {
            scope: 'sub',
            filter: '(objectClass=inetOrgPerson)',
            attributes: ['dn']
          });

          let count = 0;
          for await (const entry of searchResult.searchEntries) {
            count++;
          }

          return count;
        } catch (error) {
          console.error('Error counting users:', error);
          throw new Error('Error al contar usuarios');
        } finally {
          await this.disconnect();
        }
      },

      // Buscar por ID
      findUnique: async (where: { id: string }): Promise<Usuario | null> => {
        try {
          await this.connect();

          // Primero intentar buscar por supabase_id en metadatos
          let searchResult = await this.client.search(ldapConfig.usersOU, {
            scope: 'sub',
            filter: `(description=*"supabase_id":"${where.id}"*)`,
            attributes: ['*']
          });

          for await (const entry of searchResult.searchEntries) {
            return this.ldapUserToUsuario(entry);
          }

          // Si no se encuentra, buscar directamente por uid (usuarios antiguos migrados)
          console.log('🔍 [LDAP] No se encontró por supabase_id, buscando por uid:', where.id);
          searchResult = await this.client.search(ldapConfig.usersOU, {
            scope: 'sub',
            filter: `(uid=${where.id})`,
            attributes: ['*']
          });

          for await (const entry of searchResult.searchEntries) {
            return this.ldapUserToUsuario(entry);
          }

          return null;
        } catch (error) {
          console.error('Error finding user by ID:', error);
          throw new Error('Error al buscar usuario por ID');
        } finally {
          await this.disconnect();
        }
      },

      // Buscar por email
      findFirst: async (where: { email: string }): Promise<Usuario | null> => {
        try {
          await this.connect();

          // Verificar conexión antes de buscar
          if (!this.client.isConnected) {
            console.log('🔗 Reconectando a LDAP antes de buscar usuario...');
            await this.connect();
          }

          const searchResult = await this.client.search(ldapConfig.usersOU, {
            scope: 'sub',
            filter: `(mail=${where.email})`,
            attributes: ['*']
          });

          for await (const entry of searchResult.searchEntries) {
            return this.ldapUserToUsuario(entry);
          }

          return null;
        } catch (error) {
          console.error('Error finding user by email:', error);
          throw new Error('Error al buscar usuario por email');
        } finally {
          await this.disconnect();
        }
      },

      // Buscar por token de verificación
      findByVerificationToken: async (token: string): Promise<Usuario | null> => {
        try {
          await this.connect();

          const searchResult = await this.client.search(ldapConfig.usersOU, {
            scope: 'sub',
            filter: `(description=*"email_verification_token":"${token}"*)`,
            attributes: ['*']
          });

          for await (const entry of searchResult.searchEntries) {
            return this.ldapUserToUsuario(entry);
          }

          return null;
        } catch (error) {
          console.error('Error finding user by verification token:', error);
          throw new Error('Error al buscar usuario por token de verificación');
        } finally {
          await this.disconnect();
        }
      },

      // Buscar por token de reset de password
      findByResetToken: async (token: string): Promise<Usuario | null> => {
        try {
          await this.connect();

          const searchResult = await this.client.search(ldapConfig.usersOU, {
            scope: 'sub',
            filter: `(description=*"password_reset_token":"${token}"*)`,
            attributes: ['*']
          });

          for await (const entry of searchResult.searchEntries) {
            return this.ldapUserToUsuario(entry);
          }

          return null;
        } catch (error) {
          console.error('Error finding user by reset token:', error);
          throw new Error('Error al buscar usuario por token de reset');
        } finally {
          await this.disconnect();
        }
      },

      // Crear usuario
      create: async (data: Partial<Usuario>): Promise<Usuario> => {
        try {
          await this.connect();

          const uid = this.generateUID(data.email!);
          const dn = this.generateDN(uid);

          // Verificar conexión antes de buscar usuario existente
          if (!this.client.isConnected) {
            console.log('🔗 Reconectando a LDAP antes de buscar usuario existente...');
            await this.connect();
          }
          
          // Verificar que el email no exista
          const existingUser = await this.usuarios.findFirst({ email: data.email! });
          if (existingUser) {
            throw new Error('Ya existe un usuario con este email');
          }

          // Construir metadatos
          const metadata = {
            supabase_id: data.id || `temp-${Date.now()}`,
            created_at: data.created_at || new Date().toISOString(),
            updated_at: data.updated_at || new Date().toISOString(),
            email_verified: data.email_verified || true,
            last_login_at: data.last_login_at,
            nombre_completo: data.nombre_completo,
            nacionalidad: data.nacionalidad,
            telefono: data.telefono,
            password: data.password, // Incluir contraseña en metadatos si existe
            password_reset_token: data.password_reset_token,
            password_reset_expires: data.password_reset_expires,
            email_verification_token: data.email_verification_token,
            created_by_admin: data.created_by_admin,
            initial_password_changed: data.initial_password_changed ?? false
          };

          const description = `Migrado desde Supabase - ${JSON.stringify(metadata)}`;

          // Extraer nombre y apellido
          let givenName = uid;
          let sn = uid;
          
          if (data.nombre_completo) {
            const nameParts = data.nombre_completo.trim().split(' ');
            givenName = nameParts[0] || uid;
            sn = nameParts.slice(1).join(' ') || uid;
          }

          const ldapEntry = {
            objectClass: ['inetOrgPerson', 'organizationalPerson', 'person', 'top'],
            cn: data.nombre_completo || uid,
            sn: sn,
            givenName: givenName,
            mail: data.email!,
            uid: uid,
            userPassword: data.password!,
            title: data.rol || 'usuario',
            description: description
          };

          // Agregar campos opcionales si existen
          if (data.telefono) {
            (ldapEntry as any).telephoneNumber = data.telefono;
          }
          if (data.nacionalidad) {
            (ldapEntry as any).st = data.nacionalidad;
          }

          // Verificar conexión antes de crear usuario
          if (!this.client.isConnected) {
            console.log('🔗 Reconectando a LDAP antes de crear usuario...');
            await this.connect();
          }
          
          // Crear en LDAP
          await this.client.add(dn, ldapEntry);

          return this.ldapUserToUsuario({
            dn,
            ...ldapEntry
          });
        } catch (error) {
          console.error('Error creating user:', error);
          throw new Error('Error al crear usuario');
        } finally {
          await this.disconnect();
        }
      },

      // Actualizar usuario
        update: async (where: { id: string }, data: Partial<Usuario>): Promise<Usuario> => {
          console.log('🚀 [LDAP UPDATE] Iniciando actualización para ID:', where.id, 'con datos:', data);
          try {
            await this.connect();

          // Buscar usuario existente
          const existingUser = await this.usuarios.findUnique(where);
          if (!existingUser) {
            throw new Error('Usuario no encontrado');
          }

          // Verificar si el email cambió
          const emailChanged = data.email && data.email !== existingUser.email;
          
          // Actualizar datos
          const updatedData = {
            ...existingUser,
            ...data,
            updated_at: new Date().toISOString()
          };

          const uid = this.generateUID(updatedData.email);
          const newDn = this.generateDN(uid);
          
          // Si el email cambió, necesitamos el DN anterior para borrar el usuario
          const oldUid = this.generateUID(existingUser.email);
          const oldDn = this.generateDN(oldUid);

          // Construir metadatos actualizados
          const metadata = {
            supabase_id: updatedData.id,
            created_at: updatedData.created_at,
            updated_at: updatedData.updated_at,
            email_verified: updatedData.email_verified,
            last_login_at: updatedData.last_login_at,
            nombre_completo: updatedData.nombre_completo,
            nacionalidad: updatedData.nacionalidad,
            telefono: updatedData.telefono,
            password: updatedData.password, // Incluir contraseña en metadatos si existe
            password_reset_token: updatedData.password_reset_token,
            password_reset_expires: updatedData.password_reset_expires,
            email_verification_token: updatedData.email_verification_token,
            created_by_admin: updatedData.created_by_admin,
            initial_password_changed: updatedData.initial_password_changed
          };

          // Debug: Log del campo telefono
          console.log('🔍 [DEBUG] Campo telefono en metadatos:', {
            telefono: updatedData.telefono,
            tipo: typeof updatedData.telefono,
            metadataTelefono: metadata.telefono
          });
          
          // Debug: Log del campo password
          console.log('🔍 [DEBUG] Campo password en metadatos:', {
            password: updatedData.password ? '[HASHED]' : 'undefined',
            tipo: typeof updatedData.password,
            hasPassword: !!updatedData.password
          });

          const description = `Migrado desde Supabase - ${JSON.stringify(metadata)}`;

          // Extraer nombre y apellido
          let givenName = uid;
          let sn = uid;
          
          if (updatedData.nombre_completo) {
            const nameParts = updatedData.nombre_completo.trim().split(' ');
            givenName = nameParts[0] || uid;
            sn = nameParts.slice(1).join(' ') || uid;
          }

          const ldapEntry = {
            objectClass: ['inetOrgPerson', 'organizationalPerson', 'person', 'top'],
            cn: updatedData.nombre_completo || uid,
            sn: sn,
            givenName: givenName,
            mail: updatedData.email,
            uid: uid,
            userPassword: updatedData.password,
            title: updatedData.rol,
            description: description
          };

          // Agregar campos opcionales si existen
          if (updatedData.telefono) {
            (ldapEntry as any).telephoneNumber = updatedData.telefono;
          }
          if (updatedData.nacionalidad) {
            (ldapEntry as any).st = updatedData.nacionalidad;
          }

          // Si el email cambió, necesitamos borrar el usuario anterior y crear uno nuevo
          if (emailChanged) {
            console.log('🔄 Email cambió, borrando usuario anterior y creando uno nuevo...');
            console.log(`DN anterior: ${oldDn}`);
            console.log(`DN nuevo: ${newDn}`);
            
            // Verificar conexión antes de operaciones críticas
            if (!this.client.isConnected) {
              console.log('🔗 Reconectando a LDAP...');
              await this.connect();
            }
            
            // Borrar usuario anterior
            await this.client.del(oldDn);
            console.log('✅ Usuario anterior borrado');
            
            // Crear nuevo usuario con datos actualizados
            const ldapEntry = {
              objectClass: ['inetOrgPerson', 'organizationalPerson', 'person', 'top'],
              uid: uid,
              cn: updatedData.nombre_completo || uid,
              sn: updatedData.nombre_completo ? updatedData.nombre_completo.split(' ')[1] || uid : uid,
              givenName: updatedData.nombre_completo ? updatedData.nombre_completo.split(' ')[0] : uid,
              mail: updatedData.email,
              title: updatedData.rol || 'usuario',
              userPassword: updatedData.password,
              description: description,
              st: updatedData.nacionalidad || '',
              telephoneNumber: updatedData.telefono || ''
            };

            // Verificar conexión antes de crear el nuevo usuario
            if (!this.client.isConnected) {
              console.log('🔗 Reconectando a LDAP antes de crear usuario...');
              await this.connect();
            }
            
            await this.client.add(newDn, ldapEntry);
            console.log('✅ Nuevo usuario creado con email actualizado');
            
            // Leer el usuario recién creado para devolverlo
            if (!this.client.isConnected) {
              console.log('🔗 Reconectando a LDAP antes de buscar usuario...');
              await this.connect();
            }
            
            const newUserEntry = await this.client.search(newDn, {
              scope: 'base',
              attributes: ['*']
            });

            let finalUserEntry: any = {};
            for await (const entry of newUserEntry.searchEntries) {
              finalUserEntry = entry;
              break;
            }

            return this.ldapUserToUsuario(finalUserEntry);
          }

          // Si el email no cambió, usar la lógica normal de actualización
          // Obtener el usuario actual para comparar campos
          const currentUserEntry = await this.client.search(oldDn, {
            scope: 'base',
            attributes: ['*']
          });

          let currentAttributes: any = {};
          for await (const entry of currentUserEntry.searchEntries) {
            currentAttributes = entry;
            break;
          }

          // Estrategia alternativa: Solo actualizar campos básicos de LDAP
          // Los campos problemáticos como 'telefono' se manejan solo en metadatos
          const basicLdapChanges: any[] = [];
          const basicFields = ['cn', 'sn', 'givenName', 'mail', 'title', 'description'];
          
          basicFields.forEach(key => {
            const value = (ldapEntry as any)[key];
            if (value !== undefined && value !== null && value !== '') {
              // Usar formato correcto para ldapts
              basicLdapChanges.push({
                operation: 'replace',
                modification: {
                  type: key,
                  values: Array.isArray(value) ? value.map(String) : [String(value)]
                }
              });
            }
          });

          // Log de los cambios para debugging
          console.log('🔍 [DEBUG] Cambios LDAP preparados:', basicLdapChanges);

          // SOLUCIÓN REAL: Usar ldapmodify por línea de comandos (como en el script exitoso)
          try {
            const descriptionValue = ldapEntry.description;
            if (descriptionValue) {
              console.log('🔄 Actualizando campo description con metadatos usando ldapmodify...');
              
              // Verificar conexión antes de ldapmodify
              if (!this.client.isConnected) {
                console.log('🔗 Reconectando a LDAP antes de ldapmodify...');
                await this.connect();
              }
              
              // Crear archivo LDIF temporal
              const ldifContent = `dn: ${oldDn}
changetype: modify
replace: description
description: ${descriptionValue}
`;
              
              const tempFile = path.join('/tmp', `update_${Date.now()}.ldif`);
              
              fs.writeFileSync(tempFile, ldifContent);
              
              // Ejecutar ldapmodify
              const ldapHost = ldapConfig.url.replace('ldap://', '').replace(':389', '');
              const command = `ldapmodify -h ${ldapHost} -D "${ldapConfig.bindDN}" -w "${ldapConfig.bindPassword}" -f "${tempFile}"`;
              
              console.log('Ejecutando ldapmodify...');
              execSync(command, { stdio: 'pipe' });
              
              console.log('✅ Campo description actualizado exitosamente con ldapmodify');
              
              // Limpiar archivo temporal
              try {
                fs.unlinkSync(tempFile);
              } catch (e) {
                // Ignorar error de limpieza
              }
            }
          } catch (error) {
            console.error('❌ Error actualizando description con ldapmodify:', error instanceof Error ? error.message : String(error));
            console.log('⚠️  Continuando sin actualizar LDAP - los metadatos se perderán');
          }

          // Leer los datos actualizados desde LDAP para asegurar que reflejan lo que se guardó
          if (!this.client.isConnected) {
            console.log('🔗 Reconectando a LDAP antes de búsqueda final...');
            await this.connect();
          }
          
          const updatedUserEntry = await this.client.search(oldDn, {
            scope: 'base',
            attributes: ['*']
          });

          let finalUserEntry: any = {};
          for await (const entry of updatedUserEntry.searchEntries) {
            finalUserEntry = entry;
            break;
          }

          return this.ldapUserToUsuario(finalUserEntry);
        } catch (error) {
          console.error('Error updating user:', error);
          throw new Error('Error al actualizar usuario');
        } finally {
          await this.disconnect();
        }
      },

      // Eliminar usuario
      delete: async (where: { id: string }): Promise<void> => {
        try {
          await this.connect();

          const user = await this.usuarios.findUnique(where);
          if (!user) {
            throw new Error('Usuario no encontrado');
          }

          const uid = this.generateUID(user.email);
          const dn = this.generateDN(uid);

          // Verificar conexión antes de eliminar
          if (!this.client.isConnected) {
            console.log('🔗 Reconectando a LDAP antes de eliminar usuario...');
            await this.connect();
          }

          await this.client.del(dn);
        } catch (error) {
          console.error('Error deleting user:', error);
          throw new Error('Error al eliminar usuario');
        } finally {
          await this.disconnect();
        }
      },

      // Buscar múltiples usuarios
      findMany: async (options?: { 
        where?: { [key: string]: any };
        take?: number;
        skip?: number;
      }): Promise<Usuario[]> => {
        try {
          await this.connect();

          // Construir filtro
          let filter = '(objectClass=inetOrgPerson)';
          
          if (options?.where) {
            const conditions = Object.entries(options.where)
              .map(([key, value]) => {
                switch (key) {
                  case 'email':
                    return `(mail=*${value}*)`;
                  case 'rol':
                    return `(title=${value})`;
                  case 'email_verified':
                    return `(description=*"email_verified":${value}*)`;
                  default:
                    return `(description=*"${key}":"${value}"*)`;
                }
              });
            
            if (conditions.length > 0) {
              filter = `(&${filter}(|${conditions.join('')}))`;
            }
          }

          const searchResult = await this.client.search(ldapConfig.usersOU, {
            scope: 'sub',
            filter: filter,
            attributes: ['*']
          });

          const users: Usuario[] = [];
          for await (const entry of searchResult.searchEntries) {
            users.push(this.ldapUserToUsuario(entry));
          }

          // Aplicar paginación si es necesario
          if (options?.skip) {
            users.splice(0, options.skip);
          }
          if (options?.take) {
            users.splice(options.take);
          }

          return users;
        } catch (error) {
          console.error('Error finding users:', error);
          throw new Error('Error al buscar usuarios');
        } finally {
          await this.disconnect();
        }
      }
    };
  }

  async $disconnect(): Promise<void> {
    await this.disconnect();
  }
}

// Instancia singleton
const ldapClient = new LDAPClient();

// Crear un objeto que simule la interfaz de Prisma
export const prisma = {
  usuarios: ldapClient.usuarios,
  $disconnect: () => ldapClient.$disconnect()
};
