import * as ldap from 'ldapjs';
import { LDAPClient } from '../ldap/ldap.client';
import { LDAPRepository } from '../../domain/repositories/ldap.repository.interface';
import { 
  LDAPUser, 
  CreateLDAPUserDto, 
  UpdateLDAPUserDto, 
  LDAPConfig 
} from '@/types/ldap.types';

export class LDAPRepositoryImpl implements LDAPRepository {
  private ldapClient: LDAPClient;
  private config: LDAPConfig;

  constructor(config: LDAPConfig) {
    this.config = config;
    this.ldapClient = new LDAPClient(config);
  }

  async bind(): Promise<void> {
    await this.ldapClient.bind();
  }

  private async ensureConnection(): Promise<void> {
    try {
      await this.ldapClient.bind();
    } catch (error) {
      console.error('Failed to establish LDAP connection:', error);
      throw new Error('LDAP connection failed');
    }
  }

  private buildUserDN(uid: string): string {
    return `uid=${uid},${this.config.usersOU}`;
  }

  private ldapEntryToUser(entry: any): LDAPUser {
    // Convertir attributes de ldapjs a un objeto más fácil de usar
    const attrs: Record<string, string[]> = {};
    
    if (entry.attributes && Array.isArray(entry.attributes)) {
      entry.attributes.forEach((attr: any) => {
        if (attr.type && attr.values) {
          attrs[attr.type] = attr.values;
        }
      });
    }

    // Extraer datos del campo description (formato: ID:xxx|Rol:xxx|Ver:S|C:2025-09-07|...)
    const description = attrs.description?.[0] || '';
    const descriptionData = this.parseDescription(description);

    return {
      dn: entry.dn,
      uid: attrs.uid?.[0] || '',
      cn: attrs.cn?.[0] || '',
      sn: attrs.sn?.[0] || '',
      givenName: attrs.givenName?.[0] || '',
      mail: attrs.mail?.[0] || '',
      userPassword: attrs.userPassword?.[0],
      objectClass: attrs.objectClass || [],
      uidNumber: attrs.uidNumber?.[0],
      gidNumber: attrs.gidNumber?.[0],
      homeDirectory: attrs.homeDirectory?.[0],
      loginShell: attrs.loginShell?.[0],
      
      // Campos LDAP estándar - leer principalmente de description
      title: descriptionData.nacionalidad || attrs.o?.[0] || attrs.title?.[0],
      telephoneNumber: descriptionData.telefono || attrs.telephoneNumber?.[0],
      displayName: descriptionData.nombreCompleto || attrs.displayName?.[0] || attrs.cn?.[0],
      
      // Campos extraídos del description
      supabaseId: descriptionData.id,
      rol: descriptionData.rol,
      emailVerified: descriptionData.emailVerified,
      emailVerificationToken: descriptionData.emailVerificationToken,
      passwordResetToken: descriptionData.passwordResetToken,
      passwordResetExpires: descriptionData.passwordResetExpires,
      lastLoginAt: descriptionData.lastLoginAt,
      nombreCompleto: descriptionData.nombreCompleto,
      nacionalidad: descriptionData.nacionalidad,
      telefono: descriptionData.telefono,
      createdAt: descriptionData.createdAt,
      updatedAt: descriptionData.updatedAt,
      
      // Campo description completo para referencia
      description: description
    };
  }

  private parseDescription(description: string): any {
    const data: any = {};
    
    if (!description) return data;
    
    const parts = description.split('|');
    parts.forEach(part => {
      const [key, value] = part.split(':');
      if (key && value) {
        switch (key) {
          case 'ID':
            data.id = value;
            break;
          case 'Rol':
            data.rol = value;
            break;
          case 'Ver':
            data.emailVerified = value === 'S';
            break;
          case 'C':
            data.createdAt = value;
            break;
          case 'U':
            data.updatedAt = value;
            break;
          case 'L':
            data.lastLoginAt = value;
            break;
          case 'Nom':
            data.nombreCompleto = value;
            break;
          case 'Nac':
            data.nacionalidad = value;
            break;
          case 'Tel':
            data.telefono = value;
            break;
          case 'TV':
            data.emailVerificationToken = value;
            break;
          case 'TR':
            data.passwordResetToken = value;
            break;
          case 'RE':
            // Convertir solo los guiones que agregamos nosotros (formato: 2025-09-29T04-05-13.868Z)
            // Convertir a formato ISO estándar: 2025-09-29T04:05:13.868Z
            data.passwordResetExpires = value.replace(/(\d{4}-\d{2}-\d{2}T\d{2})-(\d{2})-(\d{2}\.\d{3}Z)/, '$1:$2:$3');
            console.log('🔍 [PARSE] RE field parsed:', { value, parsed: data.passwordResetExpires });
            break;
        }
      }
    });
    
    return data;
  }

  async findUserByUid(uid: string): Promise<LDAPUser | null> {
    await this.ensureConnection();
    
    try {
      // Primero intentar con scope 'base' (búsqueda directa)
      const userDN = this.buildUserDN(uid);
      try {
        const results = await this.ldapClient.search(userDN, {
          scope: 'base',
          attributes: ['*']
        });

        if (results.length > 0) {
          return this.ldapEntryToUser(results[0]);
        }
      } catch (baseError) {
        // Si falla con scope 'base', intentar con scope 'sub' en la OU
        console.log('Base search failed, trying sub search...');
      }

      // Búsqueda alternativa con scope 'sub'
      const results = await this.ldapClient.search(this.config.usersOU, {
        scope: 'sub',
        filter: `(&(objectClass=inetOrgPerson)(uid=${uid}))`,
        attributes: ['*']
      });

      if (results.length === 0) {
        return null;
      }

      return this.ldapEntryToUser(results[0]);
    } catch (error) {
      console.error('Error finding user by UID:', error);
      return null; // Retornar null en lugar de lanzar error
    }
  }

  async findUserByEmail(email: string): Promise<LDAPUser | null> {
    await this.ensureConnection();
    
    try {
      const results = await this.ldapClient.search(this.config.usersOU, {
        scope: 'sub',
        filter: `(&(objectClass=inetOrgPerson)(mail=${email}))`,
        attributes: ['*']
      });

      if (results.length === 0) {
        return null;
      }

      return this.ldapEntryToUser(results[0]);
    } catch (error) {
      console.error('Error finding user by email:', error);
      throw new Error(`Failed to find user by email: ${error}`);
    }
  }

  async findAllUsers(): Promise<LDAPUser[]> {
    await this.ensureConnection();
    
    try {
      const results = await this.ldapClient.search(this.config.usersOU, {
        scope: 'sub',
        filter: '(objectClass=inetOrgPerson)',
        attributes: ['*']
      });

      return results.map(result => this.ldapEntryToUser(result));
    } catch (error) {
      console.error('Error finding all users:', error);
      throw new Error(`Failed to find all users: ${error}`);
    }
  }

  async searchUsers(filter: string): Promise<LDAPUser[]> {
    await this.ensureConnection();
    
    try {
      const results = await this.ldapClient.search(this.config.usersOU, {
        scope: 'sub',
        filter: `(&(objectClass=inetOrgPerson)(${filter}))`,
        attributes: ['*']
      });

      return results.map(result => this.ldapEntryToUser(result));
    } catch (error) {
      console.error('Error searching users:', error);
      throw new Error(`Failed to search users: ${error}`);
    }
  }

  async createUser(userData: CreateLDAPUserDto): Promise<LDAPUser> {
    await this.ensureConnection();
    
    try {
      // Verificar que el usuario no exista
      if (await this.userExists(userData.uid)) {
        throw new Error(`User with UID '${userData.uid}' already exists`);
      }

      if (await this.emailExists(userData.mail)) {
        throw new Error(`User with email '${userData.mail}' already exists`);
      }

      const userDN = this.buildUserDN(userData.uid);
      const attributes: any = {
        objectClass: ['inetOrgPerson', 'posixAccount', 'top'],
        uid: userData.uid,
        cn: userData.cn,
        sn: userData.sn,
        givenName: userData.givenName,
        mail: userData.mail,
        userPassword: userData.userPassword,
        uidNumber: userData.uidNumber || '1000',
        gidNumber: userData.gidNumber || '100',
        homeDirectory: userData.homeDirectory || `/home/${userData.uid}`,
        loginShell: userData.loginShell || '/bin/bash'
      };

      await this.ldapClient.add(userDN, attributes);

      // Retornar el usuario creado
      const createdUser = await this.findUserByUid(userData.uid);
      if (!createdUser) {
        throw new Error('Failed to retrieve created user');
      }

      return createdUser;
    } catch (error) {
      console.error('Error creating user:', error);
      throw new Error(`Failed to create user: ${error}`);
    }
  }

  async updateUser(uid: string, userData: UpdateLDAPUserDto): Promise<LDAPUser> {
    await this.ensureConnection();
    
    try {
      const userDN = this.buildUserDN(uid);
      const changes: ldap.Change[] = [];

      // Preparar cambios
      if (userData.cn !== undefined) {
        changes.push(new ldap.Change({
          operation: 'replace',
          modification: {
            type: 'cn',
            values: [userData.cn]
          }
        }));
      }

      if (userData.sn !== undefined) {
        changes.push(new ldap.Change({
          operation: 'replace',
          modification: {
            type: 'sn',
            values: [userData.sn]
          }
        }));
      }

      if (userData.givenName !== undefined) {
        changes.push(new ldap.Change({
          operation: 'replace',
          modification: {
            type: 'givenName',
            values: [userData.givenName]
          }
        }));
      }

      if (userData.mail !== undefined) {
        changes.push(new ldap.Change({
          operation: 'replace',
          modification: {
            type: 'mail',
            values: [userData.mail]
          }
        }));
      }

      if (userData.userPassword !== undefined) {
        changes.push(new ldap.Change({
          operation: 'replace',
          modification: {
            type: 'userPassword',
            values: [userData.userPassword]
          }
        }));
      }

      // Solo usar atributos básicos garantizados
      if (userData.description !== undefined) {
        // Usar 'description' estándar - este es el más seguro
        changes.push(new ldap.Change({
          operation: 'replace',
          modification: {
            type: 'description',
            values: [userData.description]
          }
        }));
        console.log('ℹ️ [LDAP UPDATE] Actualizando description con todos los datos');
      }

      // Los otros campos (title, telephoneNumber) se almacenan solo en description
      if (userData.title !== undefined) {
        console.log('ℹ️ [LDAP UPDATE] title se almacena en description (ya incluido)');
      }

      if (userData.telephoneNumber !== undefined) {
        console.log('ℹ️ [LDAP UPDATE] telephoneNumber se almacena en description (ya incluido)');
      }

      if (userData.displayName !== undefined) {
        console.log('ℹ️ [LDAP UPDATE] displayName se mapea a cn (ya actualizado)');
      }

      if (changes.length > 0) {
        console.log('🔧 [LDAP UPDATE] Aplicando cambios:', changes.map(c => c.modification.type));
        await this.ldapClient.modify(userDN, changes);
        console.log('✅ [LDAP UPDATE] Cambios aplicados exitosamente');
      }

      // Retornar el usuario actualizado
      const updatedUser = await this.findUserByUid(uid);
      if (!updatedUser) {
        throw new Error('Failed to retrieve updated user');
      }

      return updatedUser;
    } catch (error) {
      console.error('Error updating user:', error);
      throw new Error(`Failed to update user: ${error}`);
    }
  }

  async deleteUser(uid: string): Promise<boolean> {
    await this.ensureConnection();
    
    try {
      const userDN = this.buildUserDN(uid);
      await this.ldapClient.delete(userDN);
      return true;
    } catch (error) {
      console.error('Error deleting user:', error);
      throw new Error(`Failed to delete user: ${error}`);
    }
  }

  async authenticateUser(uid: string, password: string): Promise<boolean> {
    try {
      // Crear una conexión temporal para autenticación
      const authClient = new LDAPClient({
        ...this.config,
        bindDN: this.buildUserDN(uid),
        bindPassword: password
      });
      
      // Intentar bind con las credenciales del usuario
      await authClient.bind();
      await authClient.unbind();
      
      return true;
    } catch (error) {
      console.error('Authentication failed:', error);
      return false;
    }
  }

  async userExists(uid: string): Promise<boolean> {
    const user = await this.findUserByUid(uid);
    return user !== null;
  }

  async emailExists(email: string): Promise<boolean> {
    const user = await this.findUserByEmail(email);
    return user !== null;
  }
}
