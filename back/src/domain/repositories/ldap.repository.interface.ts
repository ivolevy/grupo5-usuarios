import { LDAPUser, CreateLDAPUserDto, UpdateLDAPUserDto } from '../../types/ldap.types';

export interface LDAPRepository {
  // Conexión
  bind(): Promise<void>;

  // Buscar usuarios
  findUserByUid(uid: string): Promise<LDAPUser | null>;
  findUserByEmail(email: string): Promise<LDAPUser | null>;
  findAllUsers(): Promise<LDAPUser[]>;
  searchUsers(filter: string): Promise<LDAPUser[]>;

  // Operaciones CRUD
  createUser(userData: CreateLDAPUserDto): Promise<LDAPUser>;
  updateUser(uid: string, userData: UpdateLDAPUserDto): Promise<LDAPUser>;
  deleteUser(uid: string): Promise<boolean>;

  // Autenticación
  authenticateUser(uid: string, password: string): Promise<boolean>;
  
  // Utilidades
  userExists(uid: string): Promise<boolean>;
  emailExists(email: string): Promise<boolean>;
}
