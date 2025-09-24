import { render, screen, waitFor, act } from '@testing-library/react'
import { AuthProvider, useAuth } from '@/contexts/auth-context'
import { ReactNode } from 'react'

// Mock Next.js router
const mockPush = jest.fn()
const mockRouter = {
  push: mockPush,
  replace: jest.fn(),
  prefetch: jest.fn(),
  back: jest.fn(),
  forward: jest.fn(),
  refresh: jest.fn(),
}

jest.mock('next/navigation', () => ({
  useRouter: () => mockRouter,
}))

// Test component to access auth context
const TestComponent = () => {
  const { user, token, login, logout, isLoading, error, clearError } = useAuth()
  
  return (
    <div>
      <div data-testid="user">{user ? JSON.stringify(user) : 'null'}</div>
      <div data-testid="token">{token || 'null'}</div>
      <div data-testid="loading">{isLoading.toString()}</div>
      <div data-testid="error">{error || 'null'}</div>
      <button onClick={() => login('test@example.com', 'password')}>Login</button>
      <button onClick={logout}>Logout</button>
      <button onClick={clearError}>Clear Error</button>
    </div>
  )
}

const renderWithAuthProvider = (children: ReactNode) => {
  return render(
    <AuthProvider>
      {children}
    </AuthProvider>
  )
}

describe('AuthContext', () => {
  const mockUser = {
    id: '1',
    email: 'test@example.com',
    rol: 'usuario' as const,
    email_verified: true,
    created_at: '2024-01-01T00:00:00Z'
  }

  beforeEach(() => {
    jest.clearAllMocks()
    // Clear localStorage
    localStorage.clear()
    // Clear cookies
    Object.defineProperty(document, 'cookie', {
      writable: true,
      value: '',
    })
    // Reset fetch mock
    global.fetch = jest.fn()
  })

  describe('Initial State', () => {
    it('should initialize with null user and token when no stored data', async () => {
      // Mock fetch to return unauthorized
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 401,
        json: async () => ({ success: false })
      })

      renderWithAuthProvider(<TestComponent />)

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('false')
      })

      expect(screen.getByTestId('user')).toHaveTextContent('null')
      expect(screen.getByTestId('token')).toHaveTextContent('null')
    })

    it('should validate existing token on initialization', async () => {
      // Set up localStorage with existing data
      localStorage.setItem('authToken', 'existing-token')
      localStorage.setItem('user', JSON.stringify(mockUser))

      // Mock successful token validation
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ 
          success: true,
          data: { user: mockUser }
        })
      })

      renderWithAuthProvider(<TestComponent />)

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('false')
      })

      expect(screen.getByTestId('user')).toHaveTextContent(JSON.stringify(mockUser))
      expect(screen.getByTestId('token')).toHaveTextContent('existing-token')
    })

    it('should clear invalid token on initialization', async () => {
      // Set up localStorage with existing data
      localStorage.setItem('authToken', 'invalid-token')
      localStorage.setItem('user', JSON.stringify(mockUser))

      // Mock failed token validation
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 401,
        json: async () => ({ success: false })
      })

      renderWithAuthProvider(<TestComponent />)

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('false')
      })

      expect(screen.getByTestId('user')).toHaveTextContent('null')
      expect(screen.getByTestId('token')).toHaveTextContent('null')
      expect(localStorage.getItem('authToken')).toBeNull()
      expect(localStorage.getItem('user')).toBeNull()
    })
  })

  describe('Login', () => {
    it('should login successfully with valid credentials', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            user: mockUser,
            token: 'new-token'
          }
        })
      })

      renderWithAuthProvider(<TestComponent />)

      // Wait for initial loading to complete
      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('false')
      })

      // Trigger login
      act(() => {
        screen.getByText('Login').click()
      })

      await waitFor(() => {
        expect(screen.getByTestId('user')).toHaveTextContent(JSON.stringify(mockUser))
        expect(screen.getByTestId('token')).toHaveTextContent('new-token')
      })

      expect(localStorage.getItem('authToken')).toBe('new-token')
      expect(localStorage.getItem('user')).toBe(JSON.stringify(mockUser))
    })

    it('should handle login failure', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        json: async () => ({
          success: false,
          message: 'Invalid credentials'
        })
      })

      renderWithAuthProvider(<TestComponent />)

      // Wait for initial loading to complete
      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('false')
      })

      // Trigger login
      act(() => {
        screen.getByText('Login').click()
      })

      await waitFor(() => {
        expect(screen.getByTestId('error')).toHaveTextContent('Invalid credentials')
      })

      expect(screen.getByTestId('user')).toHaveTextContent('null')
      expect(screen.getByTestId('token')).toHaveTextContent('null')
    })

    it('should handle network errors during login', async () => {
      global.fetch = jest.fn().mockRejectedValue(new Error('Network error'))

      renderWithAuthProvider(<TestComponent />)

      // Wait for initial loading to complete
      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('false')
      })

      // Trigger login
      act(() => {
        screen.getByText('Login').click()
      })

      await waitFor(() => {
        expect(screen.getByTestId('error')).toHaveTextContent('Error de conexión: Network error')
      })
    })
  })

  describe('Logout', () => {
    it('should logout and clear all data', async () => {
      // Set up initial logged in state
      localStorage.setItem('authToken', 'test-token')
      localStorage.setItem('user', JSON.stringify(mockUser))

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ 
          success: true,
          data: { user: mockUser }
        })
      })

      // Mock window.location
      delete (window as any).location
      window.location = { href: '' } as any

      renderWithAuthProvider(<TestComponent />)

      // Wait for initialization
      await waitFor(() => {
        expect(screen.getByTestId('user')).toHaveTextContent(JSON.stringify(mockUser))
      })

      // Trigger logout
      act(() => {
        screen.getByText('Logout').click()
      })

      expect(screen.getByTestId('user')).toHaveTextContent('null')
      expect(screen.getByTestId('token')).toHaveTextContent('null')
      expect(localStorage.getItem('authToken')).toBeNull()
      expect(localStorage.getItem('user')).toBeNull()
      expect(window.location.href).toBe('/')
    })
  })

  describe('Error Handling', () => {
    it('should clear error when clearError is called', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        json: async () => ({
          success: false,
          message: 'Test error'
        })
      })

      renderWithAuthProvider(<TestComponent />)

      // Wait for initial loading
      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('false')
      })

      // Trigger login to create an error
      act(() => {
        screen.getByText('Login').click()
      })

      await waitFor(() => {
        expect(screen.getByTestId('error')).toHaveTextContent('Test error')
      })

      // Clear error
      act(() => {
        screen.getByText('Clear Error').click()
      })

      expect(screen.getByTestId('error')).toHaveTextContent('null')
    })
  })

  describe('Hook Usage', () => {
    it('should throw error when used outside AuthProvider', () => {
      // Suppress console.error for this test
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()

      expect(() => {
        render(<TestComponent />)
      }).toThrow('useAuth must be used within an AuthProvider')

      consoleSpy.mockRestore()
    })
  })
})
