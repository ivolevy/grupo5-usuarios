/**
 * Cliente de Prisma - Capa de Infraestructura
 * Configuración centralizada de la conexión a la base de datos
 */

// Importar el cliente de Supabase en lugar de Prisma
import { prisma, UpdateUsuarioData } from '../../lib/supabase-client';

// Configuración del cliente (usando Supabase)
// El cliente ya está configurado en supabase-client.ts

// Función para conectar a la base de datos
export async function connectDatabase(): Promise<void> {
  try {
    // Con Supabase no necesitamos conectar explícitamente
    console.log('✅ Database connected successfully (Supabase)');
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    throw error;
  }
}

// Función para desconectar de la base de datos
export async function disconnectDatabase(): Promise<void> {
  try {
    await prisma.$disconnect();
    console.log('✅ Database disconnected successfully');
  } catch (error) {
    console.error('❌ Database disconnection failed:', error);
    throw error;
  }
}

// Función para verificar la conexión
export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    // Verificar conexión con una consulta simple
    await prisma.usuarios.count();
    return true;
  } catch (error) {
    console.error('Database connection check failed:', error);
    return false;
  }
}

// Exportar el cliente Prisma
export { prisma };
export type { UpdateUsuarioData };
