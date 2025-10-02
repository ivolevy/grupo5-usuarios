import { createAuditEntry, auditMiddleware, AuditAction } from '@/lib/audit'

// Polyfill randomUUID
(global as any).crypto = (global as any).crypto || {}
;(global as any).crypto.randomUUID = (global as any).crypto.randomUUID || (() => 'uuid-audit')

describe('audit', () => {
  it('createAuditEntry returns entry', async () => {
    const spy = jest.spyOn(console, 'log').mockImplementation(() => {})
    const entry = await createAuditEntry('u1', AuditAction.CREATE, 'user', '1', '1.1.1.1', 'UA', { a: 1 }, { b: 2 })
    expect(entry?.userId).toBe('u1')
    spy.mockRestore()
  })

  it('auditMiddleware calls next', async () => {
    const mw = auditMiddleware(
      AuditAction.UPDATE,
      'user',
      () => 'u1',
      () => '1'
    )
    const next = jest.fn()
    await mw({ headers: { 'user-agent': 'UA' }, ip: '1.1.1.1' }, {}, next)
    expect(next).toHaveBeenCalled()
  })
})


