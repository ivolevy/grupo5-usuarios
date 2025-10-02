import { render, screen } from '@testing-library/react'
import { 
  PermissionGate, 
  RequirePermission, 
  RequireRole, 
  RequireAdmin, 
  RequireUserManagement,
  RequireAdminDashboard 
} from '@/components/auth/permission-gate'
import { Permission } from '@/hooks/use-permissions'
import { usePermissions } from '@/hooks/use-permissions'

// Mock the permissions hook
jest.mock('@/hooks/use-permissions')
const mockUsePermissions = usePermissions as jest.MockedFunction<typeof usePermissions>

// Mock the AccessDenied component
jest.mock('@/components/ui/access-denied', () => ({
  AccessDenied: () => <div data-testid="access-denied">Access Denied</div>
}))

describe('PermissionGate Component', () => {
  const mockPermissionsHook = {
    hasPermission: jest.fn(),
    hasAnyPermission: jest.fn(),
    hasAllPermissions: jest.fn(),
    hasRole: jest.fn(),
    hasAnyRole: jest.fn(),
    isAuthenticated: true,
    user: { id: '1', email: 'test@test.com', rol: 'usuario' as const },
    isAdmin: jest.fn(),
    isModeratorOrAdmin: jest.fn(),
    canAccessResource: jest.fn(),
    canManageUsers: jest.fn(),
    canCreateUsers: jest.fn(),
    canUpdateUsers: jest.fn(),
    canDeleteUsers: jest.fn(),
    canAccessAdminDashboard: jest.fn(),
    getUserPermissions: jest.fn(),
    token: 'test-token',
  }

  beforeEach(() => {
    jest.clearAllMocks()
    mockUsePermissions.mockReturnValue(mockPermissionsHook)
  })

  describe('Authentication Checks', () => {
    it('should render children when user is authenticated and has no specific requirements', () => {
      render(
        <PermissionGate>
          <div data-testid="protected-content">Protected Content</div>
        </PermissionGate>
      )

      expect(screen.getByTestId('protected-content')).toBeInTheDocument()
    })

    it('should show access denied when user is not authenticated', () => {
      mockUsePermissions.mockReturnValue({
        ...mockPermissionsHook,
        isAuthenticated: false,
      })

      render(
        <PermissionGate>
          <div data-testid="protected-content">Protected Content</div>
        </PermissionGate>
      )

      expect(screen.getByTestId('access-denied')).toBeInTheDocument()
      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument()
    })

    it('should show fallback when user is not authenticated and showAccessDenied is false', () => {
      mockUsePermissions.mockReturnValue({
        ...mockPermissionsHook,
        isAuthenticated: false,
      })

      render(
        <PermissionGate 
          showAccessDenied={false}
          fallback={<div data-testid="fallback">Please login</div>}
        >
          <div data-testid="protected-content">Protected Content</div>
        </PermissionGate>
      )

      expect(screen.getByTestId('fallback')).toBeInTheDocument()
      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument()
      expect(screen.queryByTestId('access-denied')).not.toBeInTheDocument()
    })
  })

  describe('Single Permission Checks', () => {
    it('should render children when user has required permission', () => {
      mockPermissionsHook.hasPermission.mockReturnValue(true)

      render(
        <PermissionGate permission={Permission.USER_CREATE}>
          <div data-testid="protected-content">Create User</div>
        </PermissionGate>
      )

      expect(screen.getByTestId('protected-content')).toBeInTheDocument()
      expect(mockPermissionsHook.hasPermission).toHaveBeenCalledWith(Permission.USER_CREATE)
    })

    it('should show access denied when user lacks required permission', () => {
      mockPermissionsHook.hasPermission.mockReturnValue(false)

      render(
        <PermissionGate permission={Permission.USER_CREATE}>
          <div data-testid="protected-content">Create User</div>
        </PermissionGate>
      )

      expect(screen.getByTestId('access-denied')).toBeInTheDocument()
      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument()
    })
  })

  describe('Multiple Permissions Checks', () => {
    it('should render children when user has any required permission (OR logic)', () => {
      mockPermissionsHook.hasAnyPermission.mockReturnValue(true)

      const permissions = [Permission.USER_CREATE, Permission.USER_UPDATE]
      
      render(
        <PermissionGate permissions={permissions} requireAll={false}>
          <div data-testid="protected-content">User Management</div>
        </PermissionGate>
      )

      expect(screen.getByTestId('protected-content')).toBeInTheDocument()
      expect(mockPermissionsHook.hasAnyPermission).toHaveBeenCalledWith(permissions)
    })

    it('should render children when user has all required permissions (AND logic)', () => {
      mockPermissionsHook.hasAllPermissions.mockReturnValue(true)

      const permissions = [Permission.USER_CREATE, Permission.USER_UPDATE]
      
      render(
        <PermissionGate permissions={permissions} requireAll={true}>
          <div data-testid="protected-content">Full User Management</div>
        </PermissionGate>
      )

      expect(screen.getByTestId('protected-content')).toBeInTheDocument()
      expect(mockPermissionsHook.hasAllPermissions).toHaveBeenCalledWith(permissions)
    })

    it('should show access denied when user lacks required permissions', () => {
      mockPermissionsHook.hasAnyPermission.mockReturnValue(false)

      const permissions = [Permission.USER_CREATE, Permission.USER_UPDATE]
      
      render(
        <PermissionGate permissions={permissions}>
          <div data-testid="protected-content">User Management</div>
        </PermissionGate>
      )

      expect(screen.getByTestId('access-denied')).toBeInTheDocument()
      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument()
    })
  })

  describe('Role Checks', () => {
    it('should render children when user has required role', () => {
      mockPermissionsHook.hasRole.mockReturnValue(true)

      render(
        <PermissionGate role="admin">
          <div data-testid="protected-content">Admin Content</div>
        </PermissionGate>
      )

      expect(screen.getByTestId('protected-content')).toBeInTheDocument()
      expect(mockPermissionsHook.hasRole).toHaveBeenCalledWith('admin')
    })

    it('should show access denied when user lacks required role', () => {
      mockPermissionsHook.hasRole.mockReturnValue(false)

      render(
        <PermissionGate role="admin">
          <div data-testid="protected-content">Admin Content</div>
        </PermissionGate>
      )

      expect(screen.getByTestId('access-denied')).toBeInTheDocument()
      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument()
    })

    it('should handle multiple roles with OR logic', () => {
      mockPermissionsHook.hasAnyRole.mockReturnValue(true)

      const roles = ['admin', 'moderador']
      
      render(
        <PermissionGate roles={roles} requireAnyRole={true}>
          <div data-testid="protected-content">Staff Content</div>
        </PermissionGate>
      )

      expect(screen.getByTestId('protected-content')).toBeInTheDocument()
      expect(mockPermissionsHook.hasAnyRole).toHaveBeenCalledWith(roles)
    })

    it('should handle multiple roles with AND logic', () => {
      mockPermissionsHook.hasRole.mockReturnValue(true)

      const roles = ['admin', 'moderador']
      
      render(
        <PermissionGate roles={roles} requireAnyRole={false}>
          <div data-testid="protected-content">Super Admin Content</div>
        </PermissionGate>
      )

      expect(screen.getByTestId('protected-content')).toBeInTheDocument()
      expect(mockPermissionsHook.hasRole).toHaveBeenCalledTimes(2)
    })
  })
})

describe('RequirePermission Component', () => {
  const baseHook = {
    hasPermission: jest.fn(),
    hasAnyPermission: jest.fn(),
    hasAllPermissions: jest.fn(),
    hasRole: jest.fn(),
    hasAnyRole: jest.fn(),
    isAuthenticated: true,
    user: { id: '1', email: 'test@test.com', rol: 'usuario' as const },
    isAdmin: jest.fn(),
    isModeratorOrAdmin: jest.fn(),
    canAccessResource: jest.fn(),
    canManageUsers: jest.fn(),
    canCreateUsers: jest.fn(),
    canUpdateUsers: jest.fn(),
    canDeleteUsers: jest.fn(),
    canAccessAdminDashboard: jest.fn(),
    getUserPermissions: jest.fn(),
    token: 'test-token',
  }

  beforeEach(() => {
    jest.clearAllMocks()
    mockUsePermissions.mockReturnValue({
      ...baseHook,
      hasPermission: jest.fn().mockReturnValue(true),
    } as any)
  })

  it('should render children when user has permission', () => {
    render(
      <RequirePermission permission={Permission.USER_CREATE}>
        <div data-testid="protected-content">Create User</div>
      </RequirePermission>
    )

    expect(screen.getByTestId('protected-content')).toBeInTheDocument()
  })

  it('should show fallback when user lacks permission', () => {
    mockUsePermissions.mockReturnValue({
      ...baseHook,
      hasPermission: jest.fn().mockReturnValue(false),
    } as any)

    render(
      <RequirePermission 
        permission={Permission.USER_CREATE}
        fallback={<div data-testid="fallback">No permission</div>}
      >
        <div data-testid="protected-content">Create User</div>
      </RequirePermission>
    )

    expect(screen.getByTestId('fallback')).toBeInTheDocument()
    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument()
  })
})

describe('RequireRole Component', () => {
  const baseHook = {
    hasPermission: jest.fn(),
    hasAnyPermission: jest.fn(),
    hasAllPermissions: jest.fn(),
    hasRole: jest.fn(),
    hasAnyRole: jest.fn(),
    isAuthenticated: true,
    user: { id: '1', email: 'test@test.com', rol: 'usuario' as const },
    isAdmin: jest.fn(),
    isModeratorOrAdmin: jest.fn(),
    canAccessResource: jest.fn(),
    canManageUsers: jest.fn(),
    canCreateUsers: jest.fn(),
    canUpdateUsers: jest.fn(),
    canDeleteUsers: jest.fn(),
    canAccessAdminDashboard: jest.fn(),
    getUserPermissions: jest.fn(),
    token: 'test-token',
  }

  beforeEach(() => {
    jest.clearAllMocks()
    mockUsePermissions.mockReturnValue({
      ...baseHook,
      hasRole: jest.fn().mockReturnValue(true),
    } as any)
  })

  it('should render children when user has role', () => {
    render(
      <RequireRole role="admin">
        <div data-testid="protected-content">Admin Content</div>
      </RequireRole>
    )

    expect(screen.getByTestId('protected-content')).toBeInTheDocument()
  })

  it('should show fallback when user lacks role', () => {
    mockUsePermissions.mockReturnValue({
      ...baseHook,
      hasRole: jest.fn().mockReturnValue(false),
    } as any)

    render(
      <RequireRole 
        role="admin"
        fallback={<div data-testid="fallback">Not admin</div>}
      >
        <div data-testid="protected-content">Admin Content</div>
      </RequireRole>
    )

    expect(screen.getByTestId('fallback')).toBeInTheDocument()
    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument()
  })
})

describe('RequireAdmin Component', () => {
  const baseHook = {
    hasPermission: jest.fn(),
    hasAnyPermission: jest.fn(),
    hasAllPermissions: jest.fn(),
    hasRole: jest.fn(),
    hasAnyRole: jest.fn(),
    isAuthenticated: true,
    user: { id: '1', email: 'test@test.com', rol: 'usuario' as const },
    isAdmin: jest.fn(),
    isModeratorOrAdmin: jest.fn(),
    canAccessResource: jest.fn(),
    canManageUsers: jest.fn(),
    canCreateUsers: jest.fn(),
    canUpdateUsers: jest.fn(),
    canDeleteUsers: jest.fn(),
    canAccessAdminDashboard: jest.fn(),
    getUserPermissions: jest.fn(),
    token: 'test-token',
  }

  beforeEach(() => {
    jest.clearAllMocks()
    mockUsePermissions.mockReturnValue({
      ...baseHook,
      hasRole: jest.fn().mockReturnValue(true),
    } as any)
  })

  it('should render children when user is admin', () => {
    render(
      <RequireAdmin>
        <div data-testid="protected-content">Admin Only</div>
      </RequireAdmin>
    )

    expect(screen.getByTestId('protected-content')).toBeInTheDocument()
  })
})

describe('RequireUserManagement Component', () => {
  const baseHook = {
    hasPermission: jest.fn(),
    hasAnyPermission: jest.fn(),
    hasAllPermissions: jest.fn(),
    hasRole: jest.fn(),
    hasAnyRole: jest.fn(),
    isAuthenticated: true,
    user: { id: '1', email: 'test@test.com', rol: 'usuario' as const },
    isAdmin: jest.fn(),
    isModeratorOrAdmin: jest.fn(),
    canAccessResource: jest.fn(),
    canManageUsers: jest.fn(),
    canCreateUsers: jest.fn(),
    canUpdateUsers: jest.fn(),
    canDeleteUsers: jest.fn(),
    canAccessAdminDashboard: jest.fn(),
    getUserPermissions: jest.fn(),
    token: 'test-token',
  }

  beforeEach(() => {
    jest.clearAllMocks()
    const hookMock = {
      ...baseHook,
      hasAnyPermission: jest.fn().mockReturnValue(true),
    } as any
    mockUsePermissions.mockReturnValue(hookMock)
    ;(global as any).__currentPermissionsHook = hookMock
  })

  it('should render children when user can manage users', () => {
    render(
      <RequireUserManagement>
        <div data-testid="protected-content">User Management</div>
      </RequireUserManagement>
    )

    expect(screen.getByTestId('protected-content')).toBeInTheDocument()
    expect((global as any).__currentPermissionsHook.hasAnyPermission).toHaveBeenCalledWith([
      Permission.USER_READ_ALL, 
      Permission.ADMIN_DASHBOARD
    ])
  })
})

describe('RequireAdminDashboard Component', () => {
  const baseHook = {
    hasPermission: jest.fn(),
    hasAnyPermission: jest.fn(),
    hasAllPermissions: jest.fn(),
    hasRole: jest.fn(),
    hasAnyRole: jest.fn(),
    isAuthenticated: true,
    user: { id: '1', email: 'test@test.com', rol: 'usuario' as const },
    isAdmin: jest.fn(),
    isModeratorOrAdmin: jest.fn(),
    canAccessResource: jest.fn(),
    canManageUsers: jest.fn(),
    canCreateUsers: jest.fn(),
    canUpdateUsers: jest.fn(),
    canDeleteUsers: jest.fn(),
    canAccessAdminDashboard: jest.fn(),
    getUserPermissions: jest.fn(),
    token: 'test-token',
  }

  beforeEach(() => {
    jest.clearAllMocks()
    const hookMock = {
      ...baseHook,
      hasPermission: jest.fn().mockReturnValue(true),
    } as any
    mockUsePermissions.mockReturnValue(hookMock)
    ;(global as any).__currentPermissionsHook = hookMock
  })

  it('should render children when user can access admin dashboard', () => {
    render(
      <RequireAdminDashboard>
        <div data-testid="protected-content">Admin Dashboard</div>
      </RequireAdminDashboard>
    )

    expect(screen.getByTestId('protected-content')).toBeInTheDocument()
    expect((global as any).__currentPermissionsHook.hasPermission).toHaveBeenCalledWith(Permission.ADMIN_DASHBOARD)
  })
})
