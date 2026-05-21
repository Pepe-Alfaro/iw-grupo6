import client from './client'

export interface WishlistItemWithProduct {
  id: number
  user_id: number
  product_id: number | null
  search_query: string | null
  notify: boolean
  created_at: string
  product: {
    id: number
    title: string
    price: string
    condition: string
    sale_type: string
    status: string
    main_image_url: string | null
  } | null
}

export const wishlistApi = {
  list: () => client.get<WishlistItemWithProduct[]>('/wishlist'),

  add: (productId: number) =>
    client.post<{ id: number }>('/wishlist', { product_id: productId }),

  remove: (itemId: number) => client.delete(`/wishlist/${itemId}`),

  toggleNotify: (itemId: number) =>
    client.patch<{ notify: boolean }>(`/wishlist/${itemId}/notify`),
}
