import { reducer } from '@/hooks/use-toast'

describe('use-toast reducer', () => {
  it('ADD_TOAST adds toast and respects limit', () => {
    const state = { toasts: [] as any[] }
    const next = reducer(state, { type: 'ADD_TOAST', toast: { id: '1', title: 'a' } as any })
    expect(next.toasts.length).toBe(1)
  })

  it('UPDATE_TOAST updates by id', () => {
    const state = { toasts: [{ id: '1', title: 'a' }] as any[] }
    const next = reducer(state, { type: 'UPDATE_TOAST', toast: { id: '1', title: 'b' } as any })
    expect(next.toasts[0].title).toBe('b')
  })

  it('DISMISS_TOAST sets open=false', () => {
    const state = { toasts: [{ id: '1', title: 'a', open: true }, { id: '2', open: true }] as any[] }
    const next = reducer(state, { type: 'DISMISS_TOAST', toastId: '1' })
    expect(next.toasts.find(t => t.id === '1')?.open).toBe(false)
    expect(next.toasts.find(t => t.id === '2')?.open).toBe(true)
  })

  it('REMOVE_TOAST removes single toast', () => {
    const state = { toasts: [{ id: '1' }, { id: '2' }] as any[] }
    const next = reducer(state, { type: 'REMOVE_TOAST', toastId: '1' })
    expect(next.toasts.map(t => t.id)).toEqual(['2'])
  })

  it('REMOVE_TOAST with undefined clears all', () => {
    const state = { toasts: [{ id: '1' }, { id: '2' }] as any[] }
    const next = reducer(state, { type: 'REMOVE_TOAST', toastId: undefined })
    expect(next.toasts.length).toBe(0)
  })
})


