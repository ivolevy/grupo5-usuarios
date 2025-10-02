import { TokenManager } from '@/lib/token-manager'
import jwt from 'jsonwebtoken'

jest.mock('jsonwebtoken')

describe('TokenManager', () => {
  const mockedJwt = jwt as unknown as {
    sign: jest.Mock
    verify: jest.Mock
    decode: jest.Mock
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('generateAccessToken signs payload', () => {
    mockedJwt.sign.mockReturnValue('access.token')
    const token = TokenManager.generateAccessToken({
      userId: 'u1',
      email: 'a@b.com',
      rol: 'usuario',
      email_verified: true,
      created_at: 'now'
    } as any)
    expect(token).toBe('access.token')
    expect(mockedJwt.sign).toHaveBeenCalled()
  })

  it('verifyAccessToken returns payload when valid and not blacklisted', () => {
    const payload = { userId: 'u1' }
    mockedJwt.verify.mockReturnValue(payload)
    const result = TokenManager.verifyAccessToken('good')
    expect(result).toEqual(payload)
  })

  it('verifyAccessToken returns null when jwt.verify throws', () => {
    mockedJwt.verify.mockImplementation(() => { throw new Error('bad') })
    const result = TokenManager.verifyAccessToken('bad')
    expect(result).toBeNull()
  })

  it('blacklistToken makes token blacklisted and verifyAccessToken returns null', () => {
    mockedJwt.decode.mockReturnValue({ exp: Math.floor(Date.now() / 1000) + 3600 })
    TokenManager.blacklistToken('t1', 'u1', 'logout')
    mockedJwt.verify.mockReturnValue({ userId: 'u1' })
    const result = TokenManager.verifyAccessToken('t1')
    expect(result).toBeNull()
  })

  it('generate/verify refresh token success path', () => {
    mockedJwt.sign.mockReturnValue('refresh.token')
    mockedJwt.verify.mockReturnValue({ userId: 'u1', deviceInfo: JSON.stringify({ agent: 'x' }) })
    const rt = TokenManager.generateRefreshToken('u1', { agent: 'x' })
    expect(rt).toBe('refresh.token')
    const verified = TokenManager.verifyRefreshToken(rt)
    expect(verified).toEqual({ userId: 'u1', deviceInfo: { agent: 'x' } })
  })

  it('verifyRefreshToken returns null when not stored', () => {
    mockedJwt.verify.mockReturnValue({ userId: 'u2' })
    const result = TokenManager.verifyRefreshToken('not-stored')
    expect(result).toBeNull()
  })
})
