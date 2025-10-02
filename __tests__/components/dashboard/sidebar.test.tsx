import { render, screen, fireEvent } from '@testing-library/react'
import { Sidebar } from '@/components/dashboard/sidebar'

jest.mock('next/navigation', () => ({ usePathname: () => '/' }))
jest.mock('next/link', () => ({ __esModule: true, default: ({ href, children, ...props }: any) => <a href={href} {...props}>{children}</a> }))
jest.mock('@/contexts/auth-context', () => ({ useAuth: () => ({ user: { email: 'a@b.com', rol: 'admin' }, logout: jest.fn() }) }))
jest.mock('@/hooks/use-permissions', () => ({
  Permission: { ADMIN_DASHBOARD: 'admin:dashboard' },
  usePermissions: () => ({ hasPermission: () => true })
}))

describe('Sidebar', () => {
  it('renders navigation items and handles logout click', () => {
    render(<Sidebar />)
    expect(screen.getByText('Inicio')).toBeInTheDocument()
    expect(screen.getByText('Dashboard')).toBeInTheDocument()
    expect(screen.getByText('Usuarios')).toBeInTheDocument()
    const button = screen.getByText('Cerrar Sesión')
    fireEvent.click(button)
  })
})


