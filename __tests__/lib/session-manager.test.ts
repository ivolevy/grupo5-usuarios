// Polyfill crypto.randomUUID for Jest environment if missing
(global as any).crypto = (global as any).crypto || {}
;(global as any).crypto.randomUUID = (global as any).crypto.randomUUID || (() => 'uuid-test')
import { SessionManager } from '@/lib/session-manager'
import { TokenManager } from '@/lib/token-manager'

jest.mock('@/lib/token-manager', () => ({
  TokenManager: {
    generateAccessToken: jest.fn(() => 'access.token'),
    generateRefreshToken: jest.fn(() => 'refresh.token'),
    blacklistToken: jest.fn(),
    revokeRefreshToken: jest.fn(),
    revokeAllUserTokens: jest.fn(),
  }
}))

jest.mock('@/lib/audit', () => ({
  AuditLogger: {
    logUserAction: jest.fn(),
  },
  AuditAction: {
    LOGIN_SUCCESS: 'LOGIN_SUCCESS',
    LOGOUT: 'LOGOUT',
  }
}))

describe('SessionManager', () => {
  it('create/validate/invalidate session flow', async () => {
    const { sessionId, accessToken, refreshToken } = await SessionManager.createSession(
      'u1',
      { userAgent: 'UA', ip: '1.1.1.1' },
      '1.1.1.1',
      'UA'
    )

    expect(sessionId).toBeDefined()
    expect(accessToken).toBe('access.token')
    expect(refreshToken).toBe('refresh.token')

    const s = SessionManager.validateSession(sessionId)
    expect(s?.isActive).toBe(true)

    const updated = SessionManager.updateSessionActivity(sessionId)
    expect(updated).toBe(true)

    const ok = await SessionManager.invalidateSession(sessionId, 'u1', 'logout', '1.1.1.1')
    expect(ok).toBe(true)
  })

  it('invalidateAllUserSessions revokes all', async () => {
    const s1 = await SessionManager.createSession('u2', { ip: '2.2.2.2' }, '2.2.2.2')
    const s2 = await SessionManager.createSession('u2', { ip: '2.2.2.2' }, '2.2.2.2')
    expect(s1.sessionId).toBeDefined()
    expect(s2.sessionId).toBeDefined()

    const count = await SessionManager.invalidateAllUserSessions('u2', 'security')
    expect(count).toBeGreaterThanOrEqual(1)
  })

  it('getSessionStats returns numbers', () => {
    const stats = SessionManager.getSessionStats()
    expect(typeof stats.totalSessions).toBe('number')
  })
})


