import { renderHook } from '@testing-library/react'
import { usePermissions, usePermission, useRole, Permission, ROLE_PERMISSIONS } from '@/hooks/use-permissions'
import { useAuth } from '@/contexts/auth-context'

// Mock the auth context
jest.mock('@/contexts/auth-context')
const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>

describe('usePermissions Hook', () => {
  const mockAdminUser = {
    id: '1',
    email: 'admin@test.com',
    rol: 'admin' as const,
    email_verified: true,
    created_at: '2024-01-01T00:00:00Z'
  }

  const mockModeratorUser = {
    id: '2',
    email: 'moderator@test.com',
    rol: 'moderador' as const,
    email_verified: true,
    created_at: '2024-01-01T00:00:00Z'
  }

  const mockRegularUser = {
    id: '3',
    email: 'user@test.com',
    rol: 'usuario' as const,
    email_verified: true,
    created_at: '2024-01-01T00:00:00Z'
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('hasPermission', () => {
    it('should return true for admin user with any permission', () => {
      mockUseAuth.mockReturnValue({
        user: mockAdminUser,
        token: 'token',
        login: jest.fn(),
        logout: jest.fn(),
        refreshUser: jest.fn(),
        refreshToken: jest.fn(),
        isLoading: false,
        error: null,
        clearError: jest.fn()
      })

      const { result } = renderHook(() => usePermissions())
      
      expect(result.current.hasPermission(Permission.USER_CREATE)).toBe(true)
      expect(result.current.hasPermission(Permission.ADMIN_DASHBOARD)).toBe(true)
      expect(result.current.hasPermission(Permission.USER_DELETE)).toBe(true)
    })

    it('should return correct permissions for moderator user', () => {
      mockUseAuth.mockReturnValue({
        user: mockModeratorUser,
        token: 'token',
        login: jest.fn(),
        logout: jest.fn(),
        refreshUser: jest.fn(),
        refreshToken: jest.fn(),
        isLoading: false,
        error: null,
        clearError: jest.fn()
      })

      const { result } = renderHook(() => usePermissions())
      
      expect(result.current.hasPermission(Permission.USER_READ)).toBe(true)
      expect(result.current.hasPermission(Permission.USER_READ_ALL)).toBe(true)
      expect(result.current.hasPermission(Permission.USER_CREATE)).toBe(false)
      expect(result.current.hasPermission(Permission.ADMIN_DASHBOARD)).toBe(false)
    })

    it('should return correct permissions for regular user', () => {
      mockUseAuth.mockReturnValue({
        user: mockRegularUser,
        token: 'token',
        login: jest.fn(),
        logout: jest.fn(),
        refreshUser: jest.fn(),
        refreshToken: jest.fn(),
        isLoading: false,
        error: null,
        clearError: jest.fn()
      })

      const { result } = renderHook(() => usePermissions())
      
      expect(result.current.hasPermission(Permission.PROFILE_READ)).toBe(true)
      expect(result.current.hasPermission(Permission.PROFILE_UPDATE)).toBe(true)
      expect(result.current.hasPermission(Permission.USER_READ)).toBe(false)
      expect(result.current.hasPermission(Permission.ADMIN_DASHBOARD)).toBe(false)
    })

    it('should return false when user is null', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        token: null,
        login: jest.fn(),
        logout: jest.fn(),
        refreshUser: jest.fn(),
        refreshToken: jest.fn(),
        isLoading: false,
        error: null,
        clearError: jest.fn()
      })

      const { result } = renderHook(() => usePermissions())
      
      expect(result.current.hasPermission(Permission.PROFILE_READ)).toBe(false)
    })
  })

  describe('hasAnyPermission', () => {
    it('should return true if user has at least one permission', () => {
      mockUseAuth.mockReturnValue({
        user: mockRegularUser,
        token: 'token',
        login: jest.fn(),
        logout: jest.fn(),
        refreshUser: jest.fn(),
        refreshToken: jest.fn(),
        isLoading: false,
        error: null,
        clearError: jest.fn()
      })

      const { result } = renderHook(() => usePermissions())
      
      expect(result.current.hasAnyPermission([
        Permission.USER_CREATE, 
        Permission.PROFILE_READ
      ])).toBe(true)
    })

    it('should return false if user has none of the permissions', () => {
      mockUseAuth.mockReturnValue({
        user: mockRegularUser,
        token: 'token',
        login: jest.fn(),
        logout: jest.fn(),
        refreshUser: jest.fn(),
        refreshToken: jest.fn(),
        isLoading: false,
        error: null,
        clearError: jest.fn()
      })

      const { result } = renderHook(() => usePermissions())
      
      expect(result.current.hasAnyPermission([
        Permission.USER_CREATE, 
        Permission.ADMIN_DASHBOARD
      ])).toBe(false)
    })
  })

  describe('hasAllPermissions', () => {
    it('should return true if user has all permissions', () => {
      mockUseAuth.mockReturnValue({
        user: mockAdminUser,
        token: 'token',
        login: jest.fn(),
        logout: jest.fn(),
        refreshUser: jest.fn(),
        refreshToken: jest.fn(),
        isLoading: false,
        error: null,
        clearError: jest.fn()
      })

      const { result } = renderHook(() => usePermissions())
      
      expect(result.current.hasAllPermissions([
        Permission.USER_CREATE, 
        Permission.ADMIN_DASHBOARD
      ])).toBe(true)
    })

    it('should return false if user is missing any permission', () => {
      mockUseAuth.mockReturnValue({
        user: mockRegularUser,
        token: 'token',
        login: jest.fn(),
        logout: jest.fn(),
        refreshUser: jest.fn(),
        refreshToken: jest.fn(),
        isLoading: false,
        error: null,
        clearError: jest.fn()
      })

      const { result } = renderHook(() => usePermissions())
      
      expect(result.current.hasAllPermissions([
        Permission.PROFILE_READ, 
        Permission.USER_CREATE
      ])).toBe(false)
    })
  })

  describe('role checking functions', () => {
    it('should correctly identify admin users', () => {
      mockUseAuth.mockReturnValue({
        user: mockAdminUser,
        token: 'token',
        login: jest.fn(),
        logout: jest.fn(),
        refreshUser: jest.fn(),
        refreshToken: jest.fn(),
        isLoading: false,
        error: null,
        clearError: jest.fn()
      })

      const { result } = renderHook(() => usePermissions())
      
      expect(result.current.isAdmin()).toBe(true)
      expect(result.current.isModeratorOrAdmin()).toBe(true)
    })

    it('should correctly identify moderator users', () => {
      mockUseAuth.mockReturnValue({
        user: mockModeratorUser,
        token: 'token',
        login: jest.fn(),
        logout: jest.fn(),
        refreshUser: jest.fn(),
        refreshToken: jest.fn(),
        isLoading: false,
        error: null,
        clearError: jest.fn()
      })

      const { result } = renderHook(() => usePermissions())
      
      expect(result.current.isAdmin()).toBe(false)
      expect(result.current.isModeratorOrAdmin()).toBe(true)
    })

    it('should correctly identify regular users', () => {
      mockUseAuth.mockReturnValue({
        user: mockRegularUser,
        token: 'token',
        login: jest.fn(),
        logout: jest.fn(),
        refreshUser: jest.fn(),
        refreshToken: jest.fn(),
        isLoading: false,
        error: null,
        clearError: jest.fn()
      })

      const { result } = renderHook(() => usePermissions())
      
      expect(result.current.isAdmin()).toBe(false)
      expect(result.current.isModeratorOrAdmin()).toBe(false)
    })
  })

  describe('canAccessResource', () => {
    it('should allow admin to access any resource', () => {
      mockUseAuth.mockReturnValue({
        user: mockAdminUser,
        token: 'token',
        login: jest.fn(),
        logout: jest.fn(),
        refreshUser: jest.fn(),
        refreshToken: jest.fn(),
        isLoading: false,
        error: null,
        clearError: jest.fn()
      })

      const { result } = renderHook(() => usePermissions())
      
      expect(result.current.canAccessResource('other-user-id')).toBe(true)
    })

    it('should allow user to access their own resources', () => {
      mockUseAuth.mockReturnValue({
        user: mockRegularUser,
        token: 'token',
        login: jest.fn(),
        logout: jest.fn(),
        refreshUser: jest.fn(),
        refreshToken: jest.fn(),
        isLoading: false,
        error: null,
        clearError: jest.fn()
      })

      const { result } = renderHook(() => usePermissions())
      
      expect(result.current.canAccessResource('3')).toBe(true)
      expect(result.current.canAccessResource('other-user-id')).toBe(false)
    })
  })

  describe('getUserPermissions', () => {
    it('should return correct permissions for admin', () => {
      mockUseAuth.mockReturnValue({
        user: mockAdminUser,
        token: 'token',
        login: jest.fn(),
        logout: jest.fn(),
        refreshUser: jest.fn(),
        refreshToken: jest.fn(),
        isLoading: false,
        error: null,
        clearError: jest.fn()
      })

      const { result } = renderHook(() => usePermissions())
      
      expect(result.current.getUserPermissions()).toEqual(ROLE_PERMISSIONS.admin)
    })

    it('should return empty array for null user', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        token: null,
        login: jest.fn(),
        logout: jest.fn(),
        refreshUser: jest.fn(),
        refreshToken: jest.fn(),
        isLoading: false,
        error: null,
        clearError: jest.fn()
      })

      const { result } = renderHook(() => usePermissions())
      
      expect(result.current.getUserPermissions()).toEqual([])
    })
  })
})

describe('usePermission Hook', () => {
  it('should return correct permission status', () => {
    mockUseAuth.mockReturnValue({
      user: {
        id: '1',
        email: 'admin@test.com',
        rol: 'admin' as const,
        email_verified: true,
        created_at: '2024-01-01T00:00:00Z'
      },
      token: 'token',
      login: jest.fn(),
      logout: jest.fn(),
      refreshUser: jest.fn(),
      refreshToken: jest.fn(),
      isLoading: false,
      error: null,
      clearError: jest.fn()
    })

    const { result } = renderHook(() => usePermission(Permission.USER_CREATE))
    
    expect(result.current).toBe(true)
  })
})

describe('useRole Hook', () => {
  it('should return correct role status', () => {
    mockUseAuth.mockReturnValue({
      user: {
        id: '1',
        email: 'admin@test.com',
        rol: 'admin' as const,
        email_verified: true,
        created_at: '2024-01-01T00:00:00Z'
      },
      token: 'token',
      login: jest.fn(),
      logout: jest.fn(),
      refreshUser: jest.fn(),
      refreshToken: jest.fn(),
      isLoading: false,
      error: null,
      clearError: jest.fn()
    })

    const { result } = renderHook(() => useRole('admin'))
    
    expect(result.current).toBe(true)
  })
})
