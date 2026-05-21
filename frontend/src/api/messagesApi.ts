import client from './client'
import type { Message } from '../types'

export interface ConversationWithMeta {
  id: number
  participant_a_id: number
  participant_b_id: number
  product_id: number | null
  created_at: string
  other_user?: {
    id: number
    username: string
    full_name: string
    avatar_url: string | null
  }
  last_message?: Message | null
  unread_count?: number
  product_title?: string | null
}

export const messagesApi = {
  listConversations: () => client.get<ConversationWithMeta[]>('/conversations'),

  createConversation: (otherUserId: number, productId?: number) =>
    client.post<{ id: number }>('/conversations', {
      other_user_id: otherUserId,
      product_id: productId ?? null,
    }),

  listMessages: (convId: number) =>
    client.get<Message[]>(`/conversations/${convId}/messages`),

  sendMessage: (convId: number, content: string) =>
    client.post<Message>(`/conversations/${convId}/messages`, { content }),

  markRead: (convId: number) =>
    client.patch(`/conversations/${convId}/messages/read`),
}
