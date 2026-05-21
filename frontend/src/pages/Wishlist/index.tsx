import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Heart, Trash2, Bell, BellOff } from 'lucide-react'
import { Navbar } from '../../components/layout/Navbar'
import { BottomNav } from '../../components/layout/BottomNav'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { wishlistApi } from '../../api/wishlistApi'
import type { WishlistItemWithProduct } from '../../api/wishlistApi'
import { fmtPrice, conditionLabel } from '../../utils/format'

function WishCard({ item, onRemove, onToggleNotify }: {
  item: WishlistItemWithProduct
  onRemove: (id: number) => void
  onToggleNotify: (id: number) => void
}) {
  const navigate = useNavigate()
  const p = item.product

  if (!p) return null

  return (
    <div className="bg-white rounded-card border border-ink-200 overflow-hidden shadow-card group">
      <div
        className="aspect-square bg-ink-100 cursor-pointer overflow-hidden"
        onClick={() => navigate(`/products/${p.id}`)}
      >
        {p.main_image_url ? (
          <img src={p.main_image_url} alt={p.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-brand-tint to-ink-100 flex items-center justify-center text-4xl">
            📦
          </div>
        )}
      </div>
      <div className="p-3">
        <p
          className="text-[13px] font-semibold text-ink-900 line-clamp-2 cursor-pointer hover:text-brand"
          onClick={() => navigate(`/products/${p.id}`)}
        >
          {p.title}
        </p>
        <div className="flex items-center justify-between mt-2">
          <span className={`text-[16px] font-bold ${p.sale_type === 'auction' ? 'text-amber500' : 'text-brand-dark'}`}>
            {fmtPrice(p.price)}
          </span>
          <Badge tone="neutral">{conditionLabel(p.condition)}</Badge>
        </div>
        {p.status !== 'active' && (
          <Badge tone="dangerSoft" className="mt-2">
            {p.status === 'sold' ? 'Vendido' : 'No disponible'}
          </Badge>
        )}
        <div className="flex gap-1.5 mt-3">
          <button
            onClick={() => onToggleNotify(item.id)}
            title={item.notify ? 'Desactivar alerta' : 'Activar alerta'}
            className={`flex-1 flex items-center justify-center gap-1.5 h-8 rounded-lg border text-[12px] font-medium transition-colors
              ${item.notify
                ? 'border-brand text-brand bg-brand-tint'
                : 'border-ink-200 text-ink-600 hover:border-brand'}`}
          >
            {item.notify ? <Bell size={13} strokeWidth={1.5} /> : <BellOff size={13} strokeWidth={1.5} />}
            {item.notify ? 'Alerta activa' : 'Sin alerta'}
          </button>
          <button
            onClick={() => onRemove(item.id)}
            className="w-8 h-8 flex items-center justify-center rounded-lg border border-ink-200 text-ink-400 hover:text-danger hover:border-danger transition-colors"
          >
            <Trash2 size={14} strokeWidth={1.5} />
          </button>
        </div>
      </div>
    </div>
  )
}

export default function Wishlist() {
  const navigate = useNavigate()
  const [items, setItems] = useState<WishlistItemWithProduct[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    wishlistApi.list()
      .then((r) => setItems(r.data))
      .catch(() => null)
      .finally(() => setLoading(false))
  }, [])

  async function handleRemove(id: number) {
    await wishlistApi.remove(id).catch(() => null)
    setItems((prev) => prev.filter((i) => i.id !== id))
  }

  async function handleToggleNotify(id: number) {
    const { data } = await wishlistApi.toggleNotify(id)
    setItems((prev) => prev.map((i) => i.id === id ? { ...i, notify: data.notify } : i))
  }

  const productItems = items.filter((i) => i.product_id !== null)

  return (
    <div className="min-h-screen flex flex-col bg-ink-50">
      <div className="hidden md:block"><Navbar /></div>
      <div className="md:hidden"><Navbar mobile /></div>

      <main className="flex-1 max-w-[1280px] mx-auto w-full px-4 md:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-ink-900">Mi Wishlist</h1>
          {!loading && productItems.length > 0 && (
            <span className="text-[13px] text-ink-600">{productItems.length} artículo{productItems.length !== 1 ? 's' : ''}</span>
          )}
        </div>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="skeleton rounded-card" style={{ aspectRatio: '1/1.3' }} />
            ))}
          </div>
        ) : productItems.length === 0 ? (
          <div className="text-center py-24">
            <Heart size={56} strokeWidth={1} className="mx-auto text-ink-300 mb-4" />
            <p className="text-xl font-semibold text-ink-900 mb-1">Tu wishlist está vacía</p>
            <p className="text-ink-600 text-sm mb-6">
              Guarda los artículos que te gustan para encontrarlos fácilmente
            </p>
            <Button kind="outlineBrand" onClick={() => navigate('/search')}>
              Explorar productos
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {productItems.map((item) => (
              <WishCard
                key={item.id}
                item={item}
                onRemove={handleRemove}
                onToggleNotify={handleToggleNotify}
              />
            ))}
          </div>
        )}
      </main>

      <div className="md:hidden"><BottomNav /></div>
    </div>
  )
}
