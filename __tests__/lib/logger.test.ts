import { logger } from '@/lib/logger'

describe('logger', () => {
  it('logs info/warn/error and stores recent logs', () => {
    const spy = jest.spyOn(console, 'log').mockImplementation(() => {})
    logger.info('info msg', { data: { a: 1 } })
    logger.warn('warn msg')
    logger.error('error msg')
    const recent = logger.getRecentLogs(2)
    expect(recent.length).toBeGreaterThan(0)
    spy.mockRestore()
  })
})


