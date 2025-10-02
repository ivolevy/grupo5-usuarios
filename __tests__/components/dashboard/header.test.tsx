import { render, screen } from '@testing-library/react'
import { DashboardHeader } from '@/components/dashboard/header'

jest.mock('@/contexts/auth-context', () => ({ useAuth: () => ({ user: { email: 'a@b.com' } }) }))

describe('DashboardHeader', () => {
  it('renders title', () => {
    render(<DashboardHeader />)
    expect(screen.getByText('SkyTrack')).toBeInTheDocument()
  })
})


