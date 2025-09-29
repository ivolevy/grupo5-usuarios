import { LDAPRepository } from '../../domain/repositories/ldap.repository.interface';
import { 
  LDAPUser, 
  CreateLDAPUserDto, 
  UpdateLDAPUserDto, 
  LDAPResponse 
} from '../../types/ldap.types';

export class LDAPServiceImpl {
  constructor(private ldapRepository: LDAPRepository) {}

  async getAllUsers(): Promise<LDAPResponse<LDAPUser[]>> {
    try {
      const users = await this.ldapRepository.findAllUsers();
      return {
        success: true,
        data: users,
        message: `Found ${users.length} users`
      };
    } catch (error) {
      console.error('Error getting all users:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  async getUserByUid(uid: string): Promise<LDAPResponse<LDAPUser>> {
    try {
      if (!uid || uid.trim() === '') {
        return {
          success: false,
          error: 'UID is required'
        };
      }

      const user = await this.ldapRepository.findUserByUid(uid);
      if (!user) {
        return {
          success: false,
          error: `User with UID '${uid}' not found`
        };
      }

      return {
        success: true,
        data: user,
        message: 'User found successfully'
      };
    } catch (error) {
      console.error('Error getting user by UID:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  async getUserByEmail(email: string): Promise<LDAPResponse<LDAPUser>> {
    try {
      if (!email || email.trim() === '') {
        return {
          success: false,
          error: 'Email is required'
        };
      }

      // Validar formato de email básico
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return {
          success: false,
          error: 'Invalid email format'
        };
      }

      const user = await this.ldapRepository.findUserByEmail(email);
      if (!user) {
        return {
          success: false,
          error: `User with email '${email}' not found`
        };
      }

      return {
        success: true,
        data: user,
        message: 'User found successfully'
      };
    } catch (error) {
      console.error('Error getting user by email:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  async searchUsers(searchTerm: string): Promise<LDAPResponse<LDAPUser[]>> {
    try {
      if (!searchTerm || searchTerm.trim() === '') {
        return {
          success: false,
          error: 'Search term is required'
        };
      }

      // Buscar por múltiples campos
      const filter = `(|(uid=*${searchTerm}*)(cn=*${searchTerm}*)(sn=*${searchTerm}*)(givenName=*${searchTerm}*)(mail=*${searchTerm}*))`;
      const users = await this.ldapRepository.searchUsers(filter);

      return {
        success: true,
        data: users,
        message: `Found ${users.length} users matching '${searchTerm}'`
      };
    } catch (error) {
      console.error('Error searching users:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  async createUser(userData: CreateLDAPUserDto): Promise<LDAPResponse<LDAPUser>> {
    try {
      // Validaciones de entrada
      const validation = this.validateCreateUserData(userData);
      if (!validation.isValid) {
        return {
          success: false,
          error: validation.error
        };
      }

      const user = await this.ldapRepository.createUser(userData);
      return {
        success: true,
        data: user,
        message: `User '${userData.uid}' created successfully`
      };
    } catch (error) {
      console.error('Error creating user:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  async updateUser(uid: string, userData: UpdateLDAPUserDto): Promise<LDAPResponse<LDAPUser>> {
    try {
      if (!uid || uid.trim() === '') {
        return {
          success: false,
          error: 'UID is required'
        };
      }

      // Verificar que el usuario existe
      const existingUser = await this.ldapRepository.findUserByUid(uid);
      if (!existingUser) {
        return {
          success: false,
          error: `User with UID '${uid}' not found`
        };
      }

      // Validaciones de entrada
      const validation = this.validateUpdateUserData(userData);
      if (!validation.isValid) {
        return {
          success: false,
          error: validation.error
        };
      }

      // Verificar que el email no esté en uso por otro usuario
      if (userData.mail && userData.mail !== existingUser.mail) {
        const emailExists = await this.ldapRepository.emailExists(userData.mail);
        if (emailExists) {
          return {
            success: false,
            error: `Email '${userData.mail}' is already in use by another user`
          };
        }
      }

      const updatedUser = await this.ldapRepository.updateUser(uid, userData);
      return {
        success: true,
        data: updatedUser,
        message: `User '${uid}' updated successfully`
      };
    } catch (error) {
      console.error('Error updating user:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  async deleteUser(uid: string): Promise<LDAPResponse<boolean>> {
    try {
      if (!uid || uid.trim() === '') {
        return {
          success: false,
          error: 'UID is required'
        };
      }

      // Verificar que el usuario existe
      const existingUser = await this.ldapRepository.findUserByUid(uid);
      if (!existingUser) {
        return {
          success: false,
          error: `User with UID '${uid}' not found`
        };
      }

      const deleted = await this.ldapRepository.deleteUser(uid);
      return {
        success: true,
        data: deleted,
        message: `User '${uid}' deleted successfully`
      };
    } catch (error) {
      console.error('Error deleting user:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  async authenticateUser(uid: string, password: string): Promise<LDAPResponse<boolean>> {
    try {
      if (!uid || uid.trim() === '') {
        return {
          success: false,
          error: 'UID is required'
        };
      }

      if (!password || password.trim() === '') {
        return {
          success: false,
          error: 'Password is required'
        };
      }

      const isValid = await this.ldapRepository.authenticateUser(uid, password);
      return {
        success: true,
        data: isValid,
        message: isValid ? 'Authentication successful' : 'Authentication failed'
      };
    } catch (error) {
      console.error('Error authenticating user:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  private validateCreateUserData(userData: CreateLDAPUserDto): { isValid: boolean; error?: string } {
    if (!userData.uid || userData.uid.trim() === '') {
      return { isValid: false, error: 'UID is required' };
    }

    if (!userData.cn || userData.cn.trim() === '') {
      return { isValid: false, error: 'Common Name (CN) is required' };
    }

    if (!userData.sn || userData.sn.trim() === '') {
      return { isValid: false, error: 'Surname (SN) is required' };
    }

    if (!userData.givenName || userData.givenName.trim() === '') {
      return { isValid: false, error: 'Given Name is required' };
    }

    if (!userData.mail || userData.mail.trim() === '') {
      return { isValid: false, error: 'Email is required' };
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(userData.mail)) {
      return { isValid: false, error: 'Invalid email format' };
    }

    if (!userData.userPassword || userData.userPassword.trim() === '') {
      return { isValid: false, error: 'Password is required' };
    }

    // Validar longitud mínima de contraseña
    if (userData.userPassword.length < 6) {
      return { isValid: false, error: 'Password must be at least 6 characters long' };
    }

    // Validar formato de UID (alfanumérico, guiones bajos y puntos)
    const uidRegex = /^[a-zA-Z0-9_.-]+$/;
    if (!uidRegex.test(userData.uid)) {
      return { isValid: false, error: 'UID can only contain letters, numbers, underscores, dots, and hyphens' };
    }

    return { isValid: true };
  }

  private validateUpdateUserData(userData: UpdateLDAPUserDto): { isValid: boolean; error?: string } {
    // Si se proporciona email, validar formato
    if (userData.mail !== undefined) {
      if (userData.mail.trim() === '') {
        return { isValid: false, error: 'Email cannot be empty' };
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(userData.mail)) {
        return { isValid: false, error: 'Invalid email format' };
      }
    }

    // Si se proporciona contraseña, validar longitud
    if (userData.userPassword !== undefined) {
      if (userData.userPassword.length < 6) {
        return { isValid: false, error: 'Password must be at least 6 characters long' };
      }
    }

    // Validar que al menos un campo esté siendo actualizado
    const hasUpdates = Object.values(userData).some(value => value !== undefined);
    if (!hasUpdates) {
      return { isValid: false, error: 'At least one field must be provided for update' };
    }

    return { isValid: true };
  }
}
