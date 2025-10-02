import { rateLimit, rateLimiter } from '@/lib/rate-limiter'

describe('rate-limiter', () => {
  it('rateLimit enforces window and counts attempts', () => {
    const id = 'ip-1'
    const res1 = rateLimit(id, 2, 1000)
    expect(res1.success).toBe(true)
    const res2 = rateLimit(id, 2, 1000)
    expect(res2.success).toBe(true)
    const res3 = rateLimit(id, 2, 1000)
    expect(res3.success).toBe(false)
  })

  it('rateLimiter applies per-action limits', async () => {
    const id = 'user-1'
    const a1 = await rateLimiter.checkLimit(id, 'forgot_password')
    expect(a1.allowed).toBe(true)
    // Simular que se consumen 5 intentos
    for (let i = 0; i < 4; i++) await rateLimiter.checkLimit(id, 'forgot_password')
    const a6 = await rateLimiter.checkLimit(id, 'forgot_password')
    expect(a6.allowed).toBe(false)
  })
})


