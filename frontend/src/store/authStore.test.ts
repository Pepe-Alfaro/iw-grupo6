import { describe, it, expect, beforeEach } from 'vitest'
import { useAuthStore } from './authStore'

describe('authStore', () => {
  beforeEach(() => {
    useAuthStore.setState({ token: null, user: null })
  })

  it('starts with no session', () => {
    const { token, user } = useAuthStore.getState()
    expect(token).toBeNull()
    expect(user).toBeNull()
  })

  it('login stores token and user', () => {
    const fakeUser = {
      id: 1, email: 'a@b.com', username: 'user1', full_name: 'User One',
      avatar_url: null, role: 'client' as const, avg_rating: 0,
      total_reviews: 0, is_active: true, created_at: '2026-01-01T00:00:00',
    }
    useAuthStore.getState().login('tok123', fakeUser)
    const { token, user } = useAuthStore.getState()
    expect(token).toBe('tok123')
    expect(user?.username).toBe('user1')
  })

  it('logout clears session', () => {
    const fakeUser = {
      id: 1, email: 'a@b.com', username: 'user1', full_name: 'User One',
      avatar_url: null, role: 'client' as const, avg_rating: 0,
      total_reviews: 0, is_active: true, created_at: '2026-01-01T00:00:00',
    }
    useAuthStore.getState().login('tok123', fakeUser)
    useAuthStore.getState().logout()
    const { token, user } = useAuthStore.getState()
    expect(token).toBeNull()
    expect(user).toBeNull()
  })
})
