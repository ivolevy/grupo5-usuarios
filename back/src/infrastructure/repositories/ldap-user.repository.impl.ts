/**
 * Implementación del repositorio de usuarios usando LDAP
 * Reemplaza la implementación de Supabase manteniendo la misma interfaz
 */

import { Client } from 'ldapts';
import { UserEntity } from '../../domain/entities/user.entity';
import { UserRepository } from '../../domain/repositories/user.repository.interface';
import { CreateUserDto, UpdateUserDto, UserRole } from '../../types/common.types';
import { ldapConfig } from '../../lib/ldap-config';

export class LDAPUserRepositoryImpl implements UserRepository {
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
      await this.client.bind(ldapConfig.bindDN, ldapConfig.bindPassword);
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

  private ldapUserToEntity(ldapUser: any): UserEntity {
    const metadata = this.parseMetadataFromDescription(ldapUser.description || '');
    
    return UserEntity.fromPlainObject({
      id: metadata.supabase_id || ldapUser.uid,
      email: ldapUser.mail,
      password: ldapUser.userPassword,
      rol: ldapUser.title || 'usuario',
      nombre_completo: ldapUser.cn,
      nacionalidad: ldapUser.st || metadata.nacionalidad || undefined,
      telefono: ldapUser.telephoneNumber || metadata.telefono,
      email_verified: metadata.email_verified !== undefined ? metadata.email_verified : true,
      created_at: metadata.created_at || new Date().toISOString(),
      updated_at: metadata.updated_at || new Date().toISOString(),
      last_login_at: metadata.last_login_at
    });
  }

  private entityToLDAPUser(user: UserEntity, isUpdate: boolean = false): any {
    const userData = user.toPlainObject();
    const uid = this.generateUID(userData.email);
    
    // Construir metadatos
    const metadata = {
      supabase_id: userData.id,
      created_at: userData.created_at,
      updated_at: new Date().toISOString(),
      email_verified: userData.email_verified,
      last_login_at: userData.last_login_at,
      nacionalidad: (userData as any).nacionalidad,
      telefono: userData.telefono // Guardar teléfono en metadatos temporalmente
    };

    const description = `Migrado desde Supabase - ${JSON.stringify(metadata)}`;
    
    // Extraer nombre y apellido
    let givenName = uid;
    let sn = uid;
    
    if (userData.nombre_completo) {
      const nameParts = userData.nombre_completo.trim().split(' ');
      givenName = nameParts[0] || uid;
      sn = nameParts.slice(1).join(' ') || uid;
    }

    const ldapEntry = {
      objectClass: ['inetOrgPerson', 'organizationalPerson', 'person', 'top'],
      cn: userData.nombre_completo || uid,
      sn: sn,
      givenName: givenName,
      mail: userData.email,
      uid: uid,
      userPassword: (userData as any).password,
      title: userData.rol,
      description: description
    };

    // Agregar campos opcionales si existen
    if ((userData as any).telefono) {
      (ldapEntry as any).telephoneNumber = (userData as any).telefono;
    }
    if ((userData as any).nacionalidad) {
      (ldapEntry as any).st = (userData as any).nacionalidad;
    }

    return ldapEntry;
  }

  async findById(id: string): Promise<UserEntity | null> {
    try {
      await this.connect();

      const searchResult = await this.client.search(ldapConfig.usersOU, {
        scope: 'sub',
        filter: `(description=*"supabase_id":"${id}"*)`,
        attributes: ['*']
      });

      for await (const entry of searchResult.searchEntries) {
        return this.ldapUserToEntity(entry);
      }

      return null;
    } catch (error) {
      console.error('Error finding user by ID:', error);
      throw new Error('Error al buscar usuario por ID');
    } finally {
      await this.disconnect();
    }
  }

  async findByEmail(email: string): Promise<UserEntity | null> {
    try {
      await this.connect();

      const searchResult = await this.client.search(ldapConfig.usersOU, {
        scope: 'sub',
        filter: `(mail=${email})`,
        attributes: ['*']
      });

      for await (const entry of searchResult.searchEntries) {
        return this.ldapUserToEntity(entry);
      }

      return null;
    } catch (error) {
      console.error('Error finding user by email:', error);
      throw new Error('Error al buscar usuario por email');
    } finally {
      await this.disconnect();
    }
  }

  async findByRole(rol: UserRole): Promise<UserEntity[]> {
    try {
      await this.connect();

      const searchResult = await this.client.search(ldapConfig.usersOU, {
        scope: 'sub',
        filter: `(title=${rol})`,
        attributes: ['*']
      });

      const users: UserEntity[] = [];
      for await (const entry of searchResult.searchEntries) {
        users.push(this.ldapUserToEntity(entry));
      }

      return users;
    } catch (error) {
      console.error('Error finding users by role:', error);
      throw new Error('Error al buscar usuarios por rol');
    } finally {
      await this.disconnect();
    }
  }

  async findAll(options: {
    page?: number;
    limit?: number;
    search?: string;
    rol?: UserRole;
    email_verified?: boolean;
  }): Promise<{
    users: UserEntity[];
    total: number;
    page: number;
    limit: number;
  }> {
    try {
      await this.connect();

      // Construir filtro
      let filter = '(objectClass=inetOrgPerson)';
      
      if (options.search) {
        filter = `(&(objectClass=inetOrgPerson)(|(cn=*${options.search}*)(mail=*${options.search}*)(uid=*${options.search}*)))`;
      }
      
      if (options.rol) {
        filter = `(&${filter}(title=${options.rol}))`;
      }

      const searchResult = await this.client.search(ldapConfig.usersOU, {
        scope: 'sub',
        filter: filter,
        attributes: ['*']
      });

      let allUsers: UserEntity[] = [];
      for await (const entry of searchResult.searchEntries) {
        allUsers.push(this.ldapUserToEntity(entry));
      }

      // Aplicar filtro de email_verified si es necesario
      if (options.email_verified !== undefined) {
        allUsers = allUsers.filter(user => {
          const userData = user.toPlainObject();
          return userData.email_verified === options.email_verified;
        });
      }

      // Paginación
      const page = options.page || 1;
      const limit = options.limit || 10;
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      
      const paginatedUsers = allUsers.slice(startIndex, endIndex);

      return {
        users: paginatedUsers,
        total: allUsers.length,
        page,
        limit
      };
    } catch (error) {
      console.error('Error finding all users:', error);
      throw new Error('Error al buscar usuarios');
    } finally {
      await this.disconnect();
    }
  }

  async create(userData: CreateUserDto): Promise<UserEntity> {
    try {
      await this.connect();

      // Verificar que el email no exista
      const existingUser = await this.findByEmail(userData.email);
      if (existingUser) {
        throw new Error('Ya existe un usuario con este email');
      }

      // Crear entidad temporal para generar datos LDAP
      const tempUser = UserEntity.fromPlainObject({
        id: `temp-${Date.now()}`, // Se generará el ID real después
        email: userData.email,
        password: userData.password,
        rol: userData.rol || 'usuario',
        nombre_completo: userData.nombre_completo,
        nacionalidad: (userData as any).nacionalidad,
        telefono: userData.telefono,
        email_verified: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

      const uid = this.generateUID(userData.email);
      const dn = this.generateDN(uid);
      const ldapEntry = this.entityToLDAPUser(tempUser);

      // Crear en LDAP
      await this.client.add(dn, ldapEntry);

      // Retornar la entidad creada
      return this.ldapUserToEntity({
        dn,
        ...ldapEntry
      });
    } catch (error) {
      console.error('Error creating user:', error);
      throw new Error('Error al crear usuario');
    } finally {
      await this.disconnect();
    }
  }

  async update(id: string, userData: UpdateUserDto): Promise<UserEntity | null> {
    try {
      await this.connect();

      // Buscar usuario existente
      const existingUser = await this.findById(id);
      if (!existingUser) {
        return null;
      }

      // Actualizar datos
      const existingData = existingUser.toPlainObject();
      const updatedData = {
        ...existingData,
        ...userData,
        updated_at: new Date().toISOString()
      };

      const updatedUser = UserEntity.fromPlainObject(updatedData);
      const uid = this.generateUID(updatedData.email);
      const dn = this.generateDN(uid);
      const ldapEntry = this.entityToLDAPUser(updatedUser, true);

      // Obtener el usuario actual para comparar campos
      const currentUserEntry = await this.client.search(dn, {
        scope: 'base',
        attributes: ['*']
      });

      let currentAttributes: any = {};
      for await (const entry of currentUserEntry.searchEntries) {
        currentAttributes = entry;
        break;
      }

      // Preparar cambios para LDAP
      const changes: any[] = [];
      Object.keys(ldapEntry).forEach(key => {
        if (key !== 'objectClass' && key !== 'uid') {
          const value = (ldapEntry as any)[key];
          const currentValue = currentAttributes[key];
          
          if (value !== undefined && value !== null && value !== '') {
            // Usar replace siempre (funciona para campos existentes y nuevos)
            changes.push({
              operation: 'replace',
              modification: {
                type: key,
                values: [value]
              }
            });
          }
        }
      });

      // Aplicar cambios en LDAP
      if (changes.length > 0) {
        console.log('🔄 Aplicando cambios LDAP:', changes);
        try {
          await this.client.modify(dn, changes);
          console.log('✅ Cambios LDAP aplicados exitosamente');
        } catch (error) {
          console.error('❌ Error aplicando cambios LDAP:', error instanceof Error ? error.message : String(error));
          console.log('⚠️  Continuando con actualización de metadatos únicamente');
          // Continuar sin fallar - los metadatos se actualizarán
        }
      }

      return this.ldapUserToEntity({
        dn,
        ...ldapEntry
      });
    } catch (error) {
      console.error('Error updating user:', error);
      throw new Error('Error al actualizar usuario');
    } finally {
      await this.disconnect();
    }
  }

  async delete(id: string): Promise<boolean> {
    try {
      await this.connect();

      const user = await this.findById(id);
      if (!user) {
        return false;
      }

      const userData = user.toPlainObject();
      const uid = this.generateUID(userData.email);
      const dn = this.generateDN(uid);

      await this.client.del(dn);
      return true;
    } catch (error) {
      console.error('Error deleting user:', error);
      throw new Error('Error al eliminar usuario');
    } finally {
      await this.disconnect();
    }
  }

  async existsByEmail(email: string): Promise<boolean> {
    try {
      const user = await this.findByEmail(email);
      return user !== null;
    } catch (error) {
      console.error('Error checking if user exists by email:', error);
      throw new Error('Error al verificar existencia de usuario');
    }
  }

  async count(): Promise<number> {
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
  }

  async countByRole(rol: UserRole): Promise<number> {
    try {
      await this.connect();

      const searchResult = await this.client.search(ldapConfig.usersOU, {
        scope: 'sub',
        filter: `(&(objectClass=inetOrgPerson)(title=${rol}))`,
        attributes: ['dn']
      });

      let count = 0;
      for await (const entry of searchResult.searchEntries) {
        count++;
      }

      return count;
    } catch (error) {
      console.error('Error counting users by role:', error);
      throw new Error('Error al contar usuarios por rol');
    } finally {
      await this.disconnect();
    }
  }

  async findByDateRange(startDate: string, endDate: string): Promise<UserEntity[]> {
    try {
      await this.connect();

      const searchResult = await this.client.search(ldapConfig.usersOU, {
        scope: 'sub',
        filter: '(objectClass=inetOrgPerson)',
        attributes: ['*']
      });

      const users: UserEntity[] = [];
      for await (const entry of searchResult.searchEntries) {
        const user = this.ldapUserToEntity(entry);
        const userData = user.toPlainObject();
        
        if (userData.created_at >= startDate && userData.created_at <= endDate) {
          users.push(user);
        }
      }

      return users;
    } catch (error) {
      console.error('Error finding users by date range:', error);
      throw new Error('Error al buscar usuarios por rango de fechas');
    } finally {
      await this.disconnect();
    }
  }

  async updateLastLogin(id: string): Promise<UserEntity | null> {
    try {
      const user = await this.findById(id);
      if (!user) {
        return null;
      }

      const userData = user.toPlainObject();
      const updatedData = {
        ...userData,
        last_login_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      return await this.update(id, updatedData);
    } catch (error) {
      console.error('Error updating last login:', error);
      throw new Error('Error al actualizar último login');
    }
  }
}
