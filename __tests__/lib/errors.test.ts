import { AppError, ValidationError, AuthenticationError, AuthorizationError, NotFoundError, ConflictError, RateLimitError, handleError, ErrorCode } from '@/lib/errors'

jest.mock('next/server', () => ({
  NextResponse: { json: (body: any, init: any) => ({ body, init }) }
}))

jest.mock('@/lib/logger', () => ({ logger: { warn: jest.fn(), error: jest.fn() } }))

describe('errors library', () => {
  it('AppError subclasses set codes and status', () => {
    expect(new ValidationError('x').statusCode).toBe(400)
    expect(new AuthenticationError().statusCode).toBe(401)
    expect(new AuthorizationError().statusCode).toBe(403)
    expect(new NotFoundError().statusCode).toBe(404)
    expect(new ConflictError('c').statusCode).toBe(409)
    expect(new RateLimitError().statusCode).toBe(429)
  })

  it('handleError for AppError returns structured response', () => {
    const err = new AppError(ErrorCode.NOT_FOUND, 'missing', 404, { a: 1 })
    const res = handleError(err, 'ctx') as any
    expect(res.init.status).toBe(404)
    expect(res.body.error.code).toBe(ErrorCode.NOT_FOUND)
  })

  it('handleError for unknown error returns 500', () => {
    const res = handleError(new Error('boom'), 'ctx') as any
    expect(res.init.status).toBe(500)
    expect(res.body.error.code).toBe(ErrorCode.INTERNAL_ERROR)
  })
})


