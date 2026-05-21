import client from './client'
import type { User, Order } from '../types'

export const usersApi = {
  me: (token?: string) =>
    client.get<User>('/users/me', token ? { headers: { Authorization: `Bearer ${token}` } } : undefined),

  get: (id: number) => client.get<User>(`/users/${id}`),

  updateMe: (data: Partial<Pick<User, 'full_name' | 'avatar_url'>>) =>
    client.patch<User>('/users/me', data),

  myTransactions: () =>
    client.get<(Order & { role: 'buyer' | 'seller'; product: { id: number; title: string } | null })[]>('/users/me/transactions'),
}
