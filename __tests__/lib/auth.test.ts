import { 
  hashPassword, 
  verifyPassword, 
  validatePasswordStrength, 
  generateJWT, 
  verifyJWT, 
  decodeJWT, 
  extractTokenFromHeader 
} from '@/lib/auth';

// Mock bcrypt
jest.mock('bcryptjs', () => ({
  hash: jest.fn(),
  compare: jest.fn()
}));

// Mock jsonwebtoken
jest.mock('jsonwebtoken', () => ({
  sign: jest.fn(),
  verify: jest.fn(),
  decode: jest.fn()
}));

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const mockBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;
const mockJwt = jwt as jest.Mocked<typeof jwt>;

describe('auth', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('hashPassword', () => {
    it('hashes password successfully', async () => {
      mockBcrypt.hash.mockResolvedValue('hashed-password');
      
      const result = await hashPassword('password123');
      
      expect(result).toBe('hashed-password');
      expect(mockBcrypt.hash).toHaveBeenCalledWith('password123', 12);
    });

    it('throws error on bcrypt failure', async () => {
      mockBcrypt.hash.mockRejectedValue(new Error('bcrypt error'));
      
      await expect(hashPassword('password123')).rejects.toThrow('Error al procesar la contraseña');
    });
  });

  describe('verifyPassword', () => {
    it('verifies correct password', async () => {
      mockBcrypt.compare.mockResolvedValue(true);
      
      const result = await verifyPassword('password123', 'hashed-password');
      
      expect(result).toBe(true);
      expect(mockBcrypt.compare).toHaveBeenCalledWith('password123', 'hashed-password');
    });

    it('verifies incorrect password', async () => {
      mockBcrypt.compare.mockResolvedValue(false);
      
      const result = await verifyPassword('wrong-password', 'hashed-password');
      
      expect(result).toBe(false);
    });

    it('throws error on bcrypt failure', async () => {
      mockBcrypt.compare.mockRejectedValue(new Error('bcrypt error'));
      
      await expect(verifyPassword('password123', 'hashed-password')).rejects.toThrow('Error al verificar la contraseña');
    });
  });

  describe('validatePasswordStrength', () => {
    it('validates strong password', () => {
      const result = validatePasswordStrength('password123');
      
      expect(result.isValid).toBe(true);
      expect(result.score).toBe(1);
      expect(result.feedback).toEqual([]);
    });

    it('validates weak password', () => {
      const result = validatePasswordStrength('123');
      
      expect(result.isValid).toBe(false);
      expect(result.score).toBe(0);
      expect(result.feedback).toContain('Debe tener al menos 8 caracteres');
    });
  });

  describe('generateJWT', () => {
    it('generates JWT successfully', () => {
      mockJwt.sign.mockReturnValue('jwt-token');
      
      const payload = { userId: '1', email: 'test@test.com', rol: 'admin' };
      const result = generateJWT(payload);
      
      expect(result).toBe('jwt-token');
      expect(mockJwt.sign).toHaveBeenCalledWith(payload, expect.any(String), {
        expiresIn: '24h',
        issuer: 'grupousuarios-tp',
        audience: 'grupousuarios-tp-users'
      });
    });

    it('throws error on JWT generation failure', () => {
      mockJwt.sign.mockImplementation(() => {
        throw new Error('JWT error');
      });
      
      const payload = { userId: '1', email: 'test@test.com', rol: 'admin' };
      
      expect(() => generateJWT(payload)).toThrow('Error al generar token de autenticación');
    });
  });

  describe('verifyJWT', () => {
    it('verifies valid JWT', () => {
      const mockPayload = { userId: '1', email: 'test@test.com', rol: 'admin' };
      mockJwt.verify.mockReturnValue(mockPayload);
      
      const result = verifyJWT('valid-token');
      
      expect(result).toEqual(mockPayload);
      expect(mockJwt.verify).toHaveBeenCalledWith('valid-token', expect.any(String), {
        issuer: 'grupousuarios-tp',
        audience: 'grupousuarios-tp-users'
      });
    });

    it('returns null for invalid JWT', () => {
      mockJwt.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });
      
      const result = verifyJWT('invalid-token');
      
      expect(result).toBeNull();
    });
  });

  describe('decodeJWT', () => {
    it('decodes valid JWT', () => {
      const mockPayload = { userId: '1', email: 'test@test.com', rol: 'admin' };
      mockJwt.decode.mockReturnValue(mockPayload);
      
      const result = decodeJWT('token');
      
      expect(result).toEqual(mockPayload);
      expect(mockJwt.decode).toHaveBeenCalledWith('token');
    });

    it('returns null for invalid JWT', () => {
      mockJwt.decode.mockImplementation(() => {
        throw new Error('Invalid token');
      });
      
      const result = decodeJWT('invalid-token');
      
      expect(result).toBeNull();
    });
  });

  describe('extractTokenFromHeader', () => {
    it('extracts token from valid header', () => {
      const result = extractTokenFromHeader('Bearer valid-token');
      
      expect(result).toBe('valid-token');
    });

    it('returns null for invalid header format', () => {
      const result = extractTokenFromHeader('Invalid token');
      
      expect(result).toBeNull();
    });

    it('returns null for null header', () => {
      const result = extractTokenFromHeader(null);
      
      expect(result).toBeNull();
    });
  });
});
