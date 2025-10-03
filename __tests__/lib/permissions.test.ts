import { Permission, hasPermission, hasAnyPermission, hasAllPermissions, canAccessUser } from '@/lib/permissions'

describe('permissions library', () => {
  describe('hasPermission', () => {
    it('admin should have ADMIN_DASHBOARD', () => {
      expect(hasPermission('admin', Permission.ADMIN_DASHBOARD)).toBe(true)
    })

    it('usuario should not have USER_DELETE', () => {
      expect(hasPermission('usuario', Permission.USER_DELETE)).toBe(false)
    })
  })

  describe('hasAnyPermission', () => {
    it('returns true if any permission matches', () => {
      expect(
        hasAnyPermission('interno', [Permission.USER_CREATE, Permission.USER_READ_ALL])
      ).toBe(true)
    })

    it('returns false if none matches', () => {
      expect(
        hasAnyPermission('usuario', [Permission.USER_CREATE, Permission.ADMIN_DASHBOARD])
      ).toBe(false)
    })
  })

  describe('hasAllPermissions', () => {
    it('returns true if all permissions match', () => {
      expect(
        hasAllPermissions('admin', [Permission.USER_CREATE, Permission.ADMIN_DASHBOARD])
      ).toBe(true)
    })

    it('returns false if at least one permission is missing', () => {
      expect(
        hasAllPermissions('interno', [Permission.USER_READ_ALL, Permission.ADMIN_DASHBOARD])
      ).toBe(false)
    })
  })

  describe('canAccessUser', () => {
    it('admin (user:read_all) can access any user', () => {
      expect(canAccessUser('admin', '1', '2')).toBe(true)
    })

    it('usuario can access only own profile', () => {
      expect(canAccessUser('usuario', '10', '10')).toBe(true)
      expect(canAccessUser('usuario', '10', '11')).toBe(false)
    })
  })
})


