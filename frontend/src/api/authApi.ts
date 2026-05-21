import client from './client'
import type { TokenResponse } from '../types'

export const authApi = {
  register: (data: {
    email: string
    username: string
    password: string
    full_name: string
  }) => client.post<TokenResponse>('/auth/register', data),

  login: (data: { email: string; password: string }) =>
    client.post<TokenResponse>('/auth/login', data),
}
