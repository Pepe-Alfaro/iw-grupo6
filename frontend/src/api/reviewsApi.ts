import client from './client'
import type { Review } from '../types'

export const reviewsApi = {
  create: (orderId: number, rating: number, comment?: string) =>
    client.post<Review>('/reviews', { order_id: orderId, rating, comment: comment || null }),

  getUserReviews: (userId: number) =>
    client.get<Review[]>(`/users/${userId}/reviews`),
}
