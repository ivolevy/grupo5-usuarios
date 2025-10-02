import { render, screen, fireEvent } from '@testing-library/react';
import { AddUserDialog } from '@/components/users/add-user-dialog';

// Mock del contexto
jest.mock('@/contexts/users-context', () => ({
  useUsers: () => ({
    addUser: jest.fn()
  })
}));

// Mock del hook useToast
jest.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: jest.fn()
  })
}));

describe('AddUserDialog', () => {
  it('renders without crashing', () => {
    render(<AddUserDialog />);
    expect(screen.getByText('Agregar Usuario')).toBeInTheDocument();
  });

  it('renders trigger button', () => {
    render(<AddUserDialog />);
    
    const trigger = screen.getByText('Agregar Usuario');
    expect(trigger).toBeInTheDocument();
  });
});
