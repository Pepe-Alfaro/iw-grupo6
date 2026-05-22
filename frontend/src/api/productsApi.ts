import client from './client'
import type { Paginated, Product } from '../types'

export interface ProductFilters {
  q?: string
  category?: string
  condition?: string
  sale_type?: string
  min_price?: number
  max_price?: number
  seller_id?: number
  sort_by?: string
  page?: number
  size?: number
}

export interface ProductCreateInput {
  title: string
  description: string
  condition: string
  sale_type: string
  price: number
  categories: string[]
  image_urls: string[]
  ends_at?: string
}

export const productsApi = {
  list: (filters: ProductFilters = {}) =>
    client.get<Paginated<Product>>('/products', { params: filters }),

  get: (id: number) => client.get<Product>(`/products/${id}`),

  create: (data: ProductCreateInput) => client.post<Product>('/products', data),

  update: (id: number, data: Partial<ProductCreateInput>) =>
    client.put<Product>(`/products/${id}`, data),

  delete: (id: number) => client.delete(`/products/${id}`),

  uploadImage: (file: File) => {
    const fd = new FormData()
    fd.append('file', file)
    return client.post<{ url: string }>('/products/upload-image', fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
}
