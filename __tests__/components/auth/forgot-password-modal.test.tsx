import React from 'react'
import { render, screen } from '@testing-library/react'
import ForgotPasswordModal from '@/components/auth/forgot-password-modal'

// Mock useToast hook
jest.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: jest.fn()
  })
}))

describe('ForgotPasswordModal', () => {
  it('should render without crashing', () => {
    render(<ForgotPasswordModal open={false} onOpenChange={jest.fn()} />)
    // Basic smoke test - component renders without errors
    expect(document.body).toBeInTheDocument()
  })
})
