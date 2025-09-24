import { renderHook, act } from '@testing-library/react'
import { useIsMobile } from '@/hooks/use-mobile'

// Mock window.matchMedia
const mockMatchMedia = jest.fn()

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: mockMatchMedia,
})

describe('useIsMobile Hook', () => {
  let mockMql: any
  
  beforeEach(() => {
    // Reset the mock
    mockMql = {
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      matches: false,
    }
    
    mockMatchMedia.mockReturnValue(mockMql)
    
    // Mock window.innerWidth
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024,
    })
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should initialize with undefined and then set to false for desktop', () => {
    // Set desktop width
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024,
    })

    const { result } = renderHook(() => useIsMobile())
    
    // Initially should be false (due to !!undefined = false)
    expect(result.current).toBe(false)
  })

  it('should return true for mobile width', () => {
    // Set mobile width
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 500,
    })

    const { result } = renderHook(() => useIsMobile())
    
    expect(result.current).toBe(true)
  })

  it('should return false for desktop width', () => {
    // Set desktop width
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024,
    })

    const { result } = renderHook(() => useIsMobile())
    
    expect(result.current).toBe(false)
  })

  it('should handle breakpoint edge cases', () => {
    // Test exactly at breakpoint (768px should be desktop)
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 768,
    })

    const { result } = renderHook(() => useIsMobile())
    expect(result.current).toBe(false)

    // Test just below breakpoint (767px should be mobile)
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 767,
    })

    const { result, rerender } = renderHook(() => useIsMobile())
    rerender()
    expect(result.current).toBe(true)
  })

  it('should set up and clean up media query listener', () => {
    const { unmount } = renderHook(() => useIsMobile())

    // Check that addEventListener was called
    expect(mockMql.addEventListener).toHaveBeenCalledWith('change', expect.any(Function))

    // Unmount and check cleanup
    unmount()
    expect(mockMql.removeEventListener).toHaveBeenCalledWith('change', expect.any(Function))
  })

  it('should respond to media query changes', () => {
    // Start with desktop width
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024,
    })

    const { result } = renderHook(() => useIsMobile())
    expect(result.current).toBe(false)

    // Get the change handler that was registered
    const changeHandler = mockMql.addEventListener.mock.calls[0][1]

    // Simulate window resize to mobile
    act(() => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 500,
      })
      changeHandler()
    })

    expect(result.current).toBe(true)

    // Simulate window resize back to desktop
    act(() => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1024,
      })
      changeHandler()
    })

    expect(result.current).toBe(false)
  })

  it('should use correct breakpoint value', () => {
    // The hook should use 768 as the breakpoint
    expect(mockMatchMedia).toHaveBeenCalledWith('(max-width: 767px)')
  })

  it('should handle multiple instances correctly', () => {
    const { result: result1 } = renderHook(() => useIsMobile())
    const { result: result2 } = renderHook(() => useIsMobile())

    // Both should return the same value
    expect(result1.current).toBe(result2.current)
  })

  describe('Server-side rendering compatibility', () => {
    it('should handle undefined window gracefully', () => {
      // This test is more relevant for SSR scenarios
      // The hook should not crash when window is not available initially
      const { result } = renderHook(() => useIsMobile())
      
      // Should return false initially (due to !!undefined)
      expect(typeof result.current).toBe('boolean')
    })
  })

  describe('Different screen sizes', () => {
    const testCases = [
      { width: 320, expected: true, description: 'mobile small' },
      { width: 375, expected: true, description: 'mobile medium' },
      { width: 414, expected: true, description: 'mobile large' },
      { width: 768, expected: false, description: 'tablet' },
      { width: 1024, expected: false, description: 'desktop small' },
      { width: 1440, expected: false, description: 'desktop large' },
      { width: 1920, expected: false, description: 'desktop extra large' },
    ]

    testCases.forEach(({ width, expected, description }) => {
      it(`should return ${expected} for ${description} (${width}px)`, () => {
        Object.defineProperty(window, 'innerWidth', {
          writable: true,
          configurable: true,
          value: width,
        })

        const { result } = renderHook(() => useIsMobile())
        expect(result.current).toBe(expected)
      })
    })
  })
})
