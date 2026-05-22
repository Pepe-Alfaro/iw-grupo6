import client from './client'
import type { User, Order } from '../types'

export const usersApi = {
  me: (token?: string) =>
    client.get<User>('/users/me', token ? { headers: { Authorization: `Bearer ${token}` } } : undefined),

  get: (id: number) => client.get<User>(`/users/${id}`),

  updateMe: (data: Partial<Pick<User, 'full_name' | 'avatar_url'>>) =>
    client.patch<User>('/users/me', data),

  changePassword: (current_password: string, new_password: string) =>
    client.patch('/users/me/password', { current_password, new_password }),

  myTransactions: () =>
    client.get<(Order & { role: 'buyer' | 'seller'; product: { id: number; title: string } | null })[]>('/users/me/transactions'),

  notifications: () =>
    client.get<{ id: number; title: string; body: string | null; read: boolean; created_at: string }[]>('/users/me/notifications'),

  markNotificationsRead: () =>
    client.patch<{ updated: number }>('/users/me/notifications/read'),

  deleteAccount: () => client.delete('/users/me'),
}
