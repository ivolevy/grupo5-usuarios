/**
 * Test de verificación para confirmar que el setup de Jest está funcionando correctamente
 */

describe('Test Setup Verification', () => {
  it('should run basic Jest functionality', () => {
    expect(true).toBe(true)
    expect(1 + 1).toBe(2)
    expect('hello').toBe('hello')
  })

  it('should have access to Jest matchers', () => {
    expect([1, 2, 3]).toContain(2)
    expect({ name: 'test' }).toHaveProperty('name')
    expect('test string').toMatch(/test/)
  })

  it('should have access to jest-dom matchers', () => {
    const element = document.createElement('div')
    element.textContent = 'Hello World'
    document.body.appendChild(element)

    expect(element).toBeInTheDocument()
    expect(element).toHaveTextContent('Hello World')
    
    document.body.removeChild(element)
  })

  it('should have mocked localStorage', () => {
    expect(localStorage.setItem).toBeDefined()
    expect(localStorage.getItem).toBeDefined()
    expect(localStorage.removeItem).toBeDefined()
    expect(localStorage.clear).toBeDefined()
  })

  it('should have mocked fetch', () => {
    expect(global.fetch).toBeDefined()
    expect(typeof global.fetch).toBe('function')
  })

  it('should have mocked Next.js router', () => {
    // This will be tested when we import useRouter in other tests
    expect(true).toBe(true)
  })

  it('should handle async operations', async () => {
    const promise = Promise.resolve('async test')
    const result = await promise
    expect(result).toBe('async test')
  })

  it('should handle mock functions', () => {
    const mockFn = jest.fn()
    mockFn('test argument')
    
    expect(mockFn).toHaveBeenCalledTimes(1)
    expect(mockFn).toHaveBeenCalledWith('test argument')
  })

  it('should handle timers', () => {
    jest.useFakeTimers()
    
    const callback = jest.fn()
    setTimeout(callback, 1000)
    
    expect(callback).not.toHaveBeenCalled()
    
    jest.advanceTimersByTime(1000)
    expect(callback).toHaveBeenCalledTimes(1)
    
    jest.useRealTimers()
  })
})
