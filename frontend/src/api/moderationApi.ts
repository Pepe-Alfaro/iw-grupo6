import client from './client'

export interface PriceAlert {
  id: number
  product_id: number
  deviation_pct: number
  created_at: string
  product: {
    id: number
    title: string
    price: string
    status: string
    main_image_url: string | null
    categories: string[]
    seller_username: string | null
  } | null
}

export interface ModerationProduct {
  id: number
  title: string
  price: string
  status: string
  sale_type: string
  created_at: string
  seller_username: string | null
}

export const moderationApi = {
  listAlerts: () => client.get<PriceAlert[]>('/moderation/alerts'),

  resolveAlert: (id: number, resolution: 'approved' | 'rejected') =>
    client.patch<{ id: number; resolution: string }>(`/moderation/alerts/${id}`, { resolution }),

  listProducts: () => client.get<ModerationProduct[]>('/moderation/products'),

  deleteProduct: (id: number) => client.delete(`/moderation/products/${id}`),
}
