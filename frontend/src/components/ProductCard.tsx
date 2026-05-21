import { Heart, MapPin, Clock } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Badge } from './ui/Badge'
import { fmtPrice, conditionLabel } from '../utils/format'
import type { Product } from '../types'

interface ProductCardProps {
  product: Product
  wished?: boolean
  onToggleWish?: (id: number) => void
}

export function ProductCard({ product, wished = false, onToggleWish }: ProductCardProps) {
  const navigate = useNavigate()
  const isAuction = product.sale_type === 'auction'

  return (
    <div
      onClick={() => navigate(`/products/${product.id}`)}
      className="group relative bg-white rounded-card border border-ink-200 hover:shadow-card hover:-translate-y-0.5 transition-all cursor-pointer"
    >
      {/* Image */}
      <div className="relative">
        <div className="w-full rounded-t-card bg-ink-100 overflow-hidden" style={{ aspectRatio: '1/1' }}>
          {(() => {
            const mainImg = product.images?.find((i) => i.is_main) ?? product.images?.[0]
            return mainImg ? (
              <img
                src={mainImg.url}
                alt={product.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-brand-tint to-ink-100 flex items-center justify-center text-4xl">
                📦
              </div>
            )
          })()}
        </div>
        {/* Overlays */}
        <div className="absolute top-2 left-2 right-2 flex items-start justify-between">
          <div className="flex flex-col gap-1.5 items-start">
            {isAuction && (
              <Badge tone="amber" icon={<Clock size={10} strokeWidth={1.5} />}>
                SUBASTA
              </Badge>
            )}
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation()
              onToggleWish?.(product.id)
            }}
            className={`w-8 h-8 rounded-full bg-white/95 backdrop-blur shadow-sm flex items-center justify-center transition ${wished ? 'text-brand' : 'text-ink-600 hover:text-brand'}`}
          >
            <Heart
              size={16}
              strokeWidth={1.75}
              className={wished ? 'fill-brand stroke-brand' : ''}
            />
          </button>
        </div>
      </div>

      {/* Info */}
      <div className="p-3 space-y-1.5">
        <div className="text-[13.5px] font-semibold text-ink-900 leading-tight line-clamp-2 min-h-[2.6em]">
          {product.title}
        </div>
        <div className="flex items-baseline gap-2">
          <span className={`font-bold text-[18px] ${isAuction ? 'text-amber500' : 'text-brand-dark'}`}>
            {fmtPrice(product.price)}
          </span>
          {isAuction && (
            <span className="text-[10.5px] uppercase tracking-wide text-amber500 font-semibold">
              puja actual
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5 flex-wrap text-[11.5px] text-ink-600">
          <span className="inline-flex items-center gap-0.5">
            <MapPin size={10} strokeWidth={1.5} /> España
          </span>
          <span className="px-1.5 py-px rounded-full bg-ink-100 text-ink-900 font-medium">
            {conditionLabel(product.condition)}
          </span>
        </div>
      </div>
    </div>
  )
}

export function SkeletonCard() {
  return (
    <div className="bg-white rounded-card border border-ink-200 overflow-hidden">
      <div className="skeleton" style={{ aspectRatio: '1/1' }} />
      <div className="p-3 space-y-2">
        <div className="skeleton h-3 w-4/5 rounded" />
        <div className="skeleton h-3 w-2/5 rounded" />
        <div className="skeleton h-4 w-1/3 rounded" />
      </div>
    </div>
  )
}
