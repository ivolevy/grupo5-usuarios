// Cliente de Supabase para reemplazar Prisma
import { supabaseConfig } from './supabase';

export interface Usuario {
  id: string;
  email: string;
  password: string;
  rol: string;
  email_verified: boolean;
  email_verification_token?: string;
  password_reset_token?: string;
  password_reset_expires?: string;
  last_login_at?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateUsuarioData {
  email: string;
  password: string;
  rol?: string;
  email_verified?: boolean;
  email_verification_token?: string;
  password_reset_token?: string;
  password_reset_expires?: string;
  last_login_at?: string;
}

export interface UpdateUsuarioData {
  email?: string;
  password?: string;
  rol?: string;
  email_verified?: boolean;
  email_verification_token?: string;
  password_reset_token?: string;
  password_reset_expires?: string;
  last_login_at?: string;
}

class SupabaseClient {
  private baseUrl: string;
  private anonKey: string;

  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || supabaseConfig.url;
    this.anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || supabaseConfig.anonKey;
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    const url = `${this.baseUrl}/rest/v1/${endpoint}`;
    
    const defaultHeaders = {
      'apikey': this.anonKey,
      'Authorization': `Bearer ${this.anonKey}`,
      'Content-Type': 'application/json'
    };

    const response = await fetch(url, {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Supabase request failed: ${response.status} ${response.statusText} - ${errorText}`);
    }

    return response;
  }

  // Métodos para usuarios
  get usuarios() {
    return {
      // Contar usuarios
      count: async (options?: { where?: { [key: string]: any } }): Promise<number> => {
        let query = 'usuarios?select=count';
        
        if (options?.where) {
          const whereClause = Object.entries(options.where)
            .map(([key, value]) => `${key}=eq.${value}`)
            .join('&');
          if (whereClause) {
            query += `&${whereClause}`;
          }
        }
        
        const response = await this.request(query, {
          headers: {
            'Prefer': 'count=exact'
          }
        });
        const count = response.headers.get('content-range')?.split('/')[1];
        return count ? parseInt(count) : 0;
      },

      // Buscar por ID
      findUnique: async (where: { id: string }): Promise<Usuario | null> => {
        const response = await this.request(`usuarios?id=eq.${where.id}&select=*`);
        const data = await response.json();
        return data.length > 0 ? data[0] : null;
      },

      // Buscar por email
      findFirst: async (where: { email: string }): Promise<Usuario | null> => {
        const response = await this.request(`usuarios?email=eq.${where.email}&select=*`);
        const data = await response.json();
        return data.length > 0 ? data[0] : null;
      },

      // Buscar por token de verificación
      findByVerificationToken: async (token: string): Promise<Usuario | null> => {
        const response = await this.request(`usuarios?emailVerificationToken=eq.${token}&select=*`);
        const data = await response.json();
        return data.length > 0 ? data[0] : null;
      },

      // Buscar por token de reset de password
      findByResetToken: async (token: string): Promise<Usuario | null> => {
        const response = await this.request(`usuarios?passwordResetToken=eq.${token}&select=*`);
        const data = await response.json();
        return data.length > 0 ? data[0] : null;
      },

      // Crear usuario
      create: async (data: CreateUsuarioData): Promise<Usuario> => {
        const response = await this.request('usuarios', {
          method: 'POST',
          body: JSON.stringify(data),
          headers: {
            'Prefer': 'return=representation'
          }
        });
        const text = await response.text();
        if (!text) {
          throw new Error('No se pudo crear el usuario');
        }
        const result = JSON.parse(text);
        return result[0];
      },

      // Actualizar usuario
      update: async (where: { id: string }, data: UpdateUsuarioData): Promise<Usuario> => {
        const response = await this.request(`usuarios?id=eq.${where.id}`, {
          method: 'PATCH',
          body: JSON.stringify(data),
          headers: {
            'Prefer': 'return=representation'
          }
        });
        const text = await response.text();
        if (!text) {
          throw new Error('No se pudo actualizar el usuario');
        }
        const result = JSON.parse(text);
        return result[0];
      },

      // Actualizar por email
      updateByEmail: async (email: string, data: UpdateUsuarioData): Promise<Usuario> => {
        const response = await this.request(`usuarios?email=eq.${email}`, {
          method: 'PATCH',
          body: JSON.stringify(data),
          headers: {
            'Prefer': 'return=representation'
          }
        });
        const text = await response.text();
        if (!text) {
          throw new Error('No se pudo actualizar el usuario');
        }
        const result = JSON.parse(text);
        return result[0];
      },

      // Eliminar usuario
      delete: async (where: { id: string }): Promise<void> => {
        await this.request(`usuarios?id=eq.${where.id}`, {
          method: 'DELETE'
        });
      },

      // Listar usuarios con paginación
      findMany: async (options: {
        skip?: number;
        take?: number;
        where?: {
          rol?: string;
          email_verified?: boolean;
          created_at?: {
            gte?: string;
            lte?: string;
          };
        };
        select?: {
          [key: string]: boolean;
        };
        orderBy?: {
          [key: string]: 'asc' | 'desc';
        };
      } = {}): Promise<Usuario[]> => {
        let query = 'usuarios?select=*';
        
        // Manejar select
        if (options.select) {
          const selectFields = Object.keys(options.select).filter(key => options.select![key]);
          if (selectFields.length > 0) {
            query = `usuarios?select=${selectFields.join(',')}`;
          }
        }
        
        if (options.where?.rol) {
          query += `&rol=eq.${options.where.rol}`;
        }
        
        if (options.where?.email_verified !== undefined) {
          query += `&email_verified=eq.${options.where.email_verified}`;
        }
        
        if (options.where?.created_at?.gte) {
          query += `&created_at=gte.${options.where.created_at.gte}`;
        }
        
        if (options.where?.created_at?.lte) {
          query += `&created_at=lte.${options.where.created_at.lte}`;
        }

        if (options.orderBy) {
          const orderField = Object.keys(options.orderBy)[0];
          const orderDirection = options.orderBy[orderField];
          query += `&order=${orderField}.${orderDirection}`;
        }

        if (options.skip) {
          query += `&offset=${options.skip}`;
        }

        if (options.take) {
          query += `&limit=${options.take}`;
        }

        const response = await this.request(query);
        return await response.json();
      },

      // Query raw SQL (para casos especiales)
      $queryRaw: async (query: string): Promise<any[]> => {
        // Para consultas SQL complejas, usar la API REST con filtros
        // Esto es una implementación simplificada
        throw new Error('Raw SQL queries not supported with REST API. Use findMany with filters instead.');
      }
    };
  }

  // Método para cerrar conexión (compatibilidad con Prisma)
  async $disconnect(): Promise<void> {
    // No hay conexión persistente que cerrar con REST API
  }
}

// Instancia singleton
const supabaseClient = new SupabaseClient();

// Crear un objeto que simule la interfaz de Prisma
export const prisma = {
  usuarios: supabaseClient.usuarios,
  $disconnect: () => supabaseClient.$disconnect()
};
