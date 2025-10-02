import { render, screen, fireEvent } from '@testing-library/react';
import { UserActions } from '@/components/users/user-actions';

// Mock del contexto
jest.mock('@/contexts/users-context', () => ({
  useUsers: () => ({
    updateUser: jest.fn(),
    deleteUser: jest.fn()
  })
}));

// Mock de EditUserDialog
jest.mock('@/components/users/edit-user-dialog', () => ({
  EditUserDialog: ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => 
    isOpen ? <div data-testid="edit-dialog">Edit Dialog</div> : null
}));

const mockUser = {
  id: '1',
  email: 'test@test.com',
  rol: 'admin',
  email_verified: true,
  created_at: '2024-01-01T00:00:00Z'
};

describe('UserActions', () => {
  it('renders without crashing', () => {
    render(<UserActions user={mockUser} />);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('renders button for admin users', () => {
    render(<UserActions user={mockUser} />);
    
    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
  });
});
