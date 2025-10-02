import { verifyJWTMiddleware, checkUserRole, requireAdmin, canAccessResource } from '@/lib/middleware';

// Mock de auth.ts
jest.mock('@/lib/auth', () => ({
  extractTokenFromHeader: jest.fn(),
  verifyJWT: jest.fn()
}));

import { extractTokenFromHeader, verifyJWT } from '@/lib/auth';

const mockExtractTokenFromHeader = extractTokenFromHeader as jest.MockedFunction<typeof extractTokenFromHeader>;
const mockVerifyJWT = verifyJWT as jest.MockedFunction<typeof verifyJWT>;

describe('middleware', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('verifyJWTMiddleware', () => {
    it('returns error when no token', () => {
      mockExtractTokenFromHeader.mockReturnValue(null);
      
      const request = { headers: { get: () => null } } as any;
      const result = verifyJWTMiddleware(request);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Token de autorización requerido');
      expect(result.status).toBe(401);
    });

    it('returns error when token is invalid', () => {
      mockExtractTokenFromHeader.mockReturnValue('invalid-token');
      mockVerifyJWT.mockReturnValue(null);
      
      const request = { headers: { get: () => 'Bearer invalid-token' } } as any;
      const result = verifyJWTMiddleware(request);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Token de autorización inválido o expirado');
      expect(result.status).toBe(401);
    });

    it('returns success when token is valid', () => {
      const mockUser = { userId: '1', email: 'test@test.com', rol: 'admin' };
      mockExtractTokenFromHeader.mockReturnValue('valid-token');
      mockVerifyJWT.mockReturnValue(mockUser);
      
      const request = { headers: { get: () => 'Bearer valid-token' } } as any;
      const result = verifyJWTMiddleware(request);
      
      expect(result.success).toBe(true);
      expect(result.user).toEqual(mockUser);
    });

    it('handles errors gracefully', () => {
      mockExtractTokenFromHeader.mockImplementation(() => {
        throw new Error('Test error');
      });
      
      const request = { headers: { get: () => 'Bearer token' } } as any;
      const result = verifyJWTMiddleware(request);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Error al verificar token de autorización');
      expect(result.status).toBe(500);
    });
  });

  describe('checkUserRole', () => {
    it('returns true when user has required role', () => {
      const user = { userId: '1', email: 'test@test.com', rol: 'admin' };
      const result = checkUserRole(user, ['admin', 'moderator']);
      expect(result).toBe(true);
    });

    it('returns false when user does not have required role', () => {
      const user = { userId: '1', email: 'test@test.com', rol: 'usuario' };
      const result = checkUserRole(user, ['admin', 'moderator']);
      expect(result).toBe(false);
    });
  });

  describe('requireAdmin', () => {
    it('returns true for admin user', () => {
      const user = { userId: '1', email: 'test@test.com', rol: 'admin' };
      const result = requireAdmin(user);
      expect(result).toBe(true);
    });

    it('returns false for non-admin user', () => {
      const user = { userId: '1', email: 'test@test.com', rol: 'usuario' };
      const result = requireAdmin(user);
      expect(result).toBe(false);
    });
  });

  describe('canAccessResource', () => {
    it('returns true for admin accessing any resource', () => {
      const user = { userId: '1', email: 'test@test.com', rol: 'admin' };
      const result = canAccessResource(user, '2');
      expect(result).toBe(true);
    });

    it('returns true for user accessing own resource', () => {
      const user = { userId: '1', email: 'test@test.com', rol: 'usuario' };
      const result = canAccessResource(user, '1');
      expect(result).toBe(true);
    });

    it('returns false for user accessing other user resource', () => {
      const user = { userId: '1', email: 'test@test.com', rol: 'usuario' };
      const result = canAccessResource(user, '2');
      expect(result).toBe(false);
    });
  });
});
