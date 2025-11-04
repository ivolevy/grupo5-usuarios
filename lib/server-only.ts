/**
 * Este archivo marca que los módulos que lo importan solo deben ejecutarse en el servidor
 * Si se intenta importar en el cliente, Next.js lanzará un error
 */

if (typeof window !== 'undefined') {
  throw new Error(
    'Este módulo solo puede ser usado en el servidor. No puede ser importado en componentes del cliente.'
  );
}

