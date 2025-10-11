/**
 * Configuración de base de datos - SOLO LDAP
 * Sistema completamente migrado a LDAP
 */

// Configurar qué tipo de base de datos usar (SOLO LDAP)
export const DATABASE_TYPE = 'ldap'; // Forzado a LDAP únicamente

// Exportar las implementaciones LDAP únicamente
export const getDatabaseImplementation = () => {
  console.log('🔧 Usando implementación LDAP (única disponible)');
  return {
    UserRepository: () => import('../infrastructure/repositories/ldap-user.repository.impl').then(m => new m.LDAPUserRepositoryImpl()),
    AuthService: (userRepo: any) => import('../infrastructure/services/ldap-auth.service.impl').then(m => new m.LDAPAuthServiceImpl(userRepo))
  };
};

// Helper para obtener instancias
export const getServices = async () => {
  const impl = getDatabaseImplementation();
  const userRepo = await impl.UserRepository();
  const authService = await impl.AuthService(userRepo);
  
  return {
    userRepository: userRepo,
    authService: authService
  };
};

export default {
  DATABASE_TYPE,
  getDatabaseImplementation,
  getServices
};
