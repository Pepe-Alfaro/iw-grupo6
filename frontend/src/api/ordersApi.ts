import client from './client'
import type { Order } from '../types'

export const ordersApi = {
  create: (productId: number) => client.post<Order>('/orders', { product_id: productId }),
  get: (id: number) => client.get<Order>(`/orders/${id}`),
}
