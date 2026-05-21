export type UserRole = 'client' | 'moderator'

export interface User {
  id: number
  email: string
  username: string
  full_name: string
  avatar_url: string | null
  role: UserRole
  avg_rating: number
  total_reviews: number
  is_active: boolean
  created_at: string
}

export type ProductStatus = 'active' | 'sold' | 'removed' | 'pending_review'
export type SaleType = 'fixed' | 'auction'
export type ProductCondition = 'new' | 'like_new' | 'good' | 'used'

export interface Product {
  id: number
  title: string
  description: string
  condition: ProductCondition
  sale_type: SaleType
  price: string
  status: ProductStatus
  seller_id: number
  created_at: string
  updated_at: string
  images?: ProductImage[]
  categories?: string[]
  seller?: User
}

export interface ProductImage {
  id: number
  product_id: number
  url: string
  is_main: boolean
  sort_order: number
}

export interface Auction {
  id: number
  product_id: number
  current_bid: string
  current_bidder_id: number | null
  ends_at: string
  is_closed: boolean
}

export interface Bid {
  id: number
  auction_id: number
  bidder_id: number
  amount: string
  placed_at: string
}

export type OrderStatus = 'pending' | 'paid' | 'cancelled'

export interface Order {
  id: number
  product_id: number
  buyer_id: number
  seller_id: number
  amount: string
  status: OrderStatus
  created_at: string
  buyer_reviewed: boolean
  seller_reviewed: boolean
  product?: Product
}

export interface Conversation {
  id: number
  participant_a_id: number
  participant_b_id: number
  product_id: number | null
  created_at: string
  other_user?: User
  last_message?: Message
  unread_count?: number
}

export interface Message {
  id: number
  conversation_id: number
  sender_id: number
  content: string
  sent_at: string
  read: boolean
}

export interface WishlistItem {
  id: number
  user_id: number
  product_id: number | null
  search_query: string | null
  notify: boolean
  created_at: string
  product?: Product
}

export interface Review {
  id: number
  order_id: number
  reviewer_id: number
  reviewed_id: number
  rating: number
  comment: string | null
  created_at: string
  reviewer?: User
  product?: Product
}

export interface PriceAlert {
  id: number
  product_id: number
  deviation_pct: number
  resolved: boolean
  resolution: string | null
  resolved_by: number | null
  created_at: string
  product?: Product
}

export interface Paginated<T> {
  items: T[]
  total: number
  page: number
  size: number
  pages: number
}

export interface TokenResponse {
  access_token: string
  token_type: string
}
