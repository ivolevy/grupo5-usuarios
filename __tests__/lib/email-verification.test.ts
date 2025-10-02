import { generateVerificationCode, getCodeExpiration, isCodeExpired, storeVerificationCode, verifyCode } from '@/lib/email-verification'

jest.mock('@/lib/logger', () => ({ logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() } }))

jest.mock('@/lib/supabase-client', () => ({
  prisma: {
    usuarios: {
      findFirst: jest.fn(),
      updateByEmail: jest.fn(),
    }
  }
}))

describe('email-verification', () => {
  const { prisma } = require('@/lib/supabase-client')

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('generateVerificationCode returns 6 digits', () => {
    const code = generateVerificationCode()
    expect(code).toMatch(/^\d{6}$/)
  })

  it('expiration is in the future and isCodeExpired works', () => {
    const exp = getCodeExpiration()
    expect(exp.getTime()).toBeGreaterThan(Date.now())
    expect(isCodeExpired(new Date(Date.now() - 1000))).toBe(true)
  })

  it('storeVerificationCode returns false for non-registered email', async () => {
    prisma.usuarios.findFirst.mockResolvedValueOnce(null)
    const res = await storeVerificationCode('no@exists.com')
    expect(res).toBe(false)
  })

  it('storeVerificationCode updates existing user and returns code', async () => {
    prisma.usuarios.findFirst.mockResolvedValueOnce({ id: '1', email: 'u@a.com' })
    prisma.usuarios.updateByEmail.mockResolvedValueOnce({})
    const res = await storeVerificationCode('u@a.com')
    expect(typeof res).toBe('string')
    expect((res as string).length).toBe(6)
  })

  it('verifyCode handles invalid email', async () => {
    prisma.usuarios.findFirst.mockResolvedValueOnce(null)
    const res = await verifyCode('x@y.com', '000000')
    expect(res.isValid).toBe(false)
  })

  it('verifyCode handles incorrect code', async () => {
    prisma.usuarios.findFirst.mockResolvedValueOnce({ password_reset_token: '111111', password_reset_expires: new Date(Date.now() + 60000).toISOString() })
    const res = await verifyCode('x@y.com', '000000')
    expect(res.isValid).toBe(false)
    expect(res.message).toMatch(/incorrecto/i)
  })

  it('verifyCode handles expired code', async () => {
    prisma.usuarios.findFirst.mockResolvedValueOnce({ password_reset_token: '111111', password_reset_expires: new Date(Date.now() - 60000).toISOString() })
    const res = await verifyCode('x@y.com', '111111')
    expect(res.isValid).toBe(false)
    expect(res.message).toMatch(/expirado/i)
  })

  it('verifyCode success returns reset token and updates user', async () => {
    prisma.usuarios.findFirst.mockResolvedValueOnce({ password_reset_token: '111111', password_reset_expires: new Date(Date.now() + 60000).toISOString() })
    prisma.usuarios.updateByEmail.mockResolvedValueOnce({})
    const res = await verifyCode('x@y.com', '111111')
    expect(res.isValid).toBe(true)
    expect(typeof res.token).toBe('string')
  })
})


