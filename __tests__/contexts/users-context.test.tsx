import React from 'react'
import { render, screen, waitFor, act } from '@testing-library/react'
import { UsersProvider, useUsers } from '@/contexts/users-context'

describe('UsersContext', () => {
  const mockUsers = [
    { id: '1', email: 'a@b.com', rol: 'usuario', email_verified: true, created_at: 'x', updated_at: 'x' },
    { id: '2', email: 'b@c.com', rol: 'admin', email_verified: true, created_at: 'x', updated_at: 'x' },
  ]

  function Consumer() {
    const { users, loading, error, refreshUsers, addUser, updateUser, deleteUser, getUserById, getUsersByRole, getAdminInternoUsers, getNormalUsers } = useUsers()
    return (
      <div>
        <div data-testid="loading">{String(loading)}</div>
        <div data-testid="error">{error ?? ''}</div>
        <div data-testid="count">{users.length}</div>
        <button onClick={() => refreshUsers()} data-testid="refresh" />
        <button onClick={() => addUser({ email: 'n@e.com', password: 'p' })} data-testid="add" />
        <button onClick={() => updateUser('1', { nombre_completo: 'Nuevo' })} data-testid="update" />
        <button onClick={() => deleteUser('1')} data-testid="delete" />
        <div data-testid="byid">{getUserById('1')?.email ?? ''}</div>
        <div data-testid="admins">{getUsersByRole('admin').length}</div>
        <div data-testid="am">{getAdminInternoUsers().length}</div>
        <div data-testid="normal">{getNormalUsers().length}</div>
      </div>
    )
  }

  beforeEach(() => {
    ;(global.fetch as jest.Mock).mockReset()
  })

  it('refreshUsers loads users on mount and via button', async () => {
    ;(global.fetch as jest.Mock)
      .mockResolvedValueOnce({ json: async () => ({ success: true, data: mockUsers }) })
      .mockResolvedValueOnce({ json: async () => ({ success: true, data: mockUsers }) })

    render(
      <UsersProvider>
        <Consumer />
      </UsersProvider>
    )

    await waitFor(() => expect(screen.getByTestId('count').textContent).toBe('2'))

    await act(async () => {
      screen.getByTestId('refresh').click()
    })

    await waitFor(() => expect(screen.getByTestId('count').textContent).toBe('2'))
  })

  it('addUser success triggers refresh', async () => {
    ;(global.fetch as jest.Mock)
      .mockResolvedValueOnce({ json: async () => ({ success: true, data: [] }) }) // initial mount
      .mockResolvedValueOnce({ json: async () => ({ success: true }) }) // addUser
      .mockResolvedValueOnce({ json: async () => ({ success: true, data: mockUsers }) }) // refresh after add

    render(
      <UsersProvider>
        <Consumer />
      </UsersProvider>
    )

    await waitFor(() => expect(screen.getByTestId('count').textContent).toBe('0'))

    await act(async () => {
      screen.getByTestId('add').click()
    })

    await waitFor(() => expect(screen.getByTestId('count').textContent).toBe('2'))
  })

  it('updateUser and deleteUser success trigger refresh', async () => {
    ;(global.fetch as jest.Mock)
      .mockResolvedValueOnce({ json: async () => ({ success: true, data: mockUsers }) }) // initial mount
      .mockResolvedValueOnce({ json: async () => ({ success: true }) }) // update
      .mockResolvedValueOnce({ json: async () => ({ success: true, data: mockUsers }) }) // refresh after update
      .mockResolvedValueOnce({ json: async () => ({ success: true }) }) // delete
      .mockResolvedValueOnce({ json: async () => ({ success: true, data: mockUsers.slice(1) }) }) // refresh after delete

    render(
      <UsersProvider>
        <Consumer />
      </UsersProvider>
    )

    await waitFor(() => expect(screen.getByTestId('count').textContent).toBe('2'))

    await act(async () => {
      screen.getByTestId('update').click()
    })
    await waitFor(() => expect(screen.getByTestId('count').textContent).toBe('2'))

    await act(async () => {
      screen.getByTestId('delete').click()
    })
    await waitFor(() => expect(screen.getByTestId('count').textContent).toBe('1'))
  })

  it('handles API error responses', async () => {
    ;(global.fetch as jest.Mock)
      .mockResolvedValueOnce({ json: async () => ({ success: false, message: 'Falló' }) }) // mount error

    render(
      <UsersProvider>
        <Consumer />
      </UsersProvider>
    )

    await waitFor(() => expect(screen.getByTestId('error').textContent).toContain('Falló'))
  })

  it('handles network errors', async () => {
    ;(global.fetch as jest.Mock)
      .mockRejectedValueOnce(new Error('Network down'))

    render(
      <UsersProvider>
        <Consumer />
      </UsersProvider>
    )

    await waitFor(() => expect(screen.getByTestId('error').textContent).toContain('Error de conexión'))
  })
})


