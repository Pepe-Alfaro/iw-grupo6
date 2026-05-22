import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Star, Package, ShoppingBag, AlertCircle, Edit3, CreditCard } from 'lucide-react'
import { Navbar } from '../../components/layout/Navbar'
import { BottomNav } from '../../components/layout/BottomNav'
import { ProductCard, SkeletonCard } from '../../components/ProductCard'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { useToast } from '../../components/ui/Toast'
import { ReviewModal } from '../../components/ReviewModal'
import { EditProfileModal } from '../../components/EditProfileModal'
import { useProducts } from '../../hooks/useProducts'
import { usersApi } from '../../api/usersApi'
import { ordersApi } from '../../api/ordersApi'
import { reviewsApi } from '../../api/reviewsApi'
import { useAuthStore } from '../../store/authStore'
import { fmtPrice, fmtDate } from '../../utils/format'
import type { User, Order, Review } from '../../types'

// ─── Stars display ────────────────────────────────────────────────────────────
function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          size={14}
          strokeWidth={1.5}
          className={i < Math.round(rating) ? 'fill-amber500 stroke-amber500' : 'stroke-ink-300 fill-transparent'}
        />
      ))}
    </div>
  )
}

// ─── Order status badge ───────────────────────────────────────────────────────
function OrderBadge({ status }: { status: string }) {
  if (status === 'paid') return <Badge tone="successSoft">Completado</Badge>
  if (status === 'cancelled') return <Badge tone="dangerSoft">Cancelado</Badge>
  return <Badge tone="amberSoft">Pendiente</Badge>
}

// ─── Tab bar ──────────────────────────────────────────────────────────────────
function Tabs({ tabs, active, onChange }: { tabs: string[]; active: number; onChange: (i: number) => void }) {
  return (
    <div className="flex border-b border-ink-200 gap-0 mb-6">
      {tabs.map((t, i) => (
        <button
          key={t}
          onClick={() => onChange(i)}
          className={`px-5 py-3 text-[14px] font-medium border-b-2 -mb-px transition-colors
            ${active === i ? 'border-brand text-brand' : 'border-transparent text-ink-600 hover:text-ink-900'}`}
        >
          {t}
        </button>
      ))}
    </div>
  )
}

// ─── Review card ──────────────────────────────────────────────────────────────
function ReviewCard({ review }: { review: Review }) {
  return (
    <div className="bg-white rounded-card border border-ink-200 p-4">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-full bg-brand text-white text-[14px] font-bold flex items-center justify-center flex-none">
          {review.reviewer?.full_name?.[0]?.toUpperCase() ?? '?'}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[13px] font-semibold text-ink-900">
              @{review.reviewer?.username ?? 'Usuario'}
            </span>
            <StarRating rating={review.rating} />
            <span className="text-[11px] text-ink-400 ml-auto">{fmtDate(review.created_at)}</span>
          </div>
          {review.comment && (
            <p className="text-[13px] text-ink-600 mt-1.5 leading-relaxed">{review.comment}</p>
          )}
          {review.product && (
            <p className="text-[11px] text-ink-400 mt-2">Producto: {review.product.title}</p>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function Profile() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const toast = useToast()
  const currentUser = useAuthStore((s) => s.user)

  const profileId = (id === 'me' || !id) ? currentUser?.id : Number(id)
  const isOwn = currentUser?.id === profileId

  type Tx = Order & { role: 'buyer' | 'seller'; product?: { id: number; title: string } | null }

  const [user, setUser] = useState<User | null>(null)
  const [userLoading, setUserLoading] = useState(true)
  const [transactions, setTransactions] = useState<Tx[]>([])
  const [reviews, setReviews] = useState<Review[]>([])
  const [reviewsLoading, setReviewsLoading] = useState(false)
  const [tab, setTab] = useState(0)
  const [reviewTarget, setReviewTarget] = useState<Tx | null>(null)
  const [payingId, setPayingId] = useState<number | null>(null)
  const [editOpen, setEditOpen] = useState(false)
  const setStoreUser = useAuthStore((s) => s.setUser)

  const { data: listingsData, loading: listingsLoading } = useProducts(
    profileId ? { seller_id: profileId, size: 20 } : {}
  )

  const tabs = isOwn ? ['Mis anuncios', 'Transacciones', 'Valoraciones'] : ['Anuncios', 'Valoraciones']
  const reviewsTabIdx = isOwn ? 2 : 1

  useEffect(() => {
    if (!profileId) return
    setUserLoading(true)
    usersApi.get(profileId)
      .then((r) => setUser(r.data))
      .catch(() => setUser(null))
      .finally(() => setUserLoading(false))
  }, [profileId])

  useEffect(() => {
    if (!isOwn) return
    usersApi.myTransactions().then((r) => setTransactions(r.data)).catch(() => null)
  }, [isOwn])

  useEffect(() => {
    if (tab !== reviewsTabIdx || !profileId) return
    setReviewsLoading(true)
    reviewsApi.getUserReviews(profileId)
      .then((r) => setReviews(r.data))
      .catch(() => null)
      .finally(() => setReviewsLoading(false))
  }, [tab, reviewsTabIdx, profileId])

  async function handlePay(orderId: number) {
    setPayingId(orderId)
    try {
      await ordersApi.pay(orderId)
      setTransactions((prev) =>
        prev.map((tx) => tx.id === orderId ? { ...tx, status: 'paid' as const } : tx)
      )
      toast({ kind: 'success', title: 'Pago confirmado', body: 'El pedido ha sido marcado como completado.' })
    } catch {
      toast({ kind: 'error', title: 'Error al procesar el pago' })
    } finally {
      setPayingId(null)
    }
  }

  if (!profileId) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <AlertCircle size={48} strokeWidth={1} className="text-ink-400" />
        <p className="text-ink-600">Inicia sesión para ver tu perfil</p>
        <Button kind="outlineBrand" onClick={() => navigate('/auth')}>Iniciar sesión</Button>
      </div>
    )
  }

  if (userLoading) return (
    <div className="min-h-screen flex flex-col bg-ink-50">
      <div className="hidden md:block"><Navbar /></div>
      <div className="md:hidden"><Navbar mobile /></div>
      <main className="flex-1 max-w-[1280px] mx-auto w-full px-4 md:px-8 py-8">
        <div className="skeleton h-40 rounded-card mb-6" />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      </main>
    </div>
  )

  if (!user) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4">
      <AlertCircle size={48} strokeWidth={1} className="text-ink-400" />
      <p className="text-xl font-semibold text-ink-900">Usuario no encontrado</p>
      <Button kind="outlineBrand" onClick={() => navigate(-1)}>Volver</Button>
    </div>
  )

  return (
    <div className="min-h-screen flex flex-col bg-ink-50">
      <div className="hidden md:block"><Navbar /></div>
      <div className="md:hidden"><Navbar mobile /></div>

      <main className="flex-1 max-w-[1280px] mx-auto w-full px-4 md:px-8 py-8">
        {/* Profile header */}
        <div className="bg-white rounded-card border border-ink-200 p-6 mb-6 shadow-card">
          <div className="flex items-start gap-5">
            <div className="w-20 h-20 rounded-full bg-brand text-white text-[28px] font-bold flex items-center justify-center flex-none">
              {user.full_name[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-[22px] font-bold text-ink-900">{user.full_name}</h1>
                {user.role === 'moderator' && <Badge tone="brand">Moderador</Badge>}
              </div>
              <p className="text-[14px] text-ink-600 mt-0.5">@{user.username}</p>
              <div className="flex items-center gap-3 mt-2 flex-wrap">
                <div className="flex items-center gap-1.5">
                  <StarRating rating={user.avg_rating} />
                  <span className="text-[13px] font-semibold text-ink-900">{user.avg_rating.toFixed(1)}</span>
                  <span className="text-[12px] text-ink-400">({user.total_reviews} valoraciones)</span>
                </div>
                <span className="text-ink-200">·</span>
                <div className="flex items-center gap-1 text-[12px] text-ink-600">
                  <Package size={12} strokeWidth={1.5} />
                  {listingsData?.total ?? 0} anuncios
                </div>
                <span className="text-ink-200">·</span>
                <span className="text-[12px] text-ink-400">Miembro desde {fmtDate(user.created_at)}</span>
              </div>
            </div>
            {isOwn && (
              <Button kind="outline" size="sm" icon={<Edit3 size={13} strokeWidth={1.5} />} onClick={() => setEditOpen(true)}>
                Editar
              </Button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <Tabs tabs={tabs} active={tab} onChange={setTab} />

        {/* Tab: listings */}
        {tab === 0 && (
          <>
            {listingsLoading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
              </div>
            ) : listingsData?.items.length === 0 ? (
              <div className="text-center py-20">
                <div className="text-5xl mb-4">📭</div>
                <p className="text-xl font-semibold text-ink-900">Sin anuncios activos</p>
                {isOwn && (
                  <Button className="mt-6" onClick={() => navigate('/publish')}>
                    Publicar primer anuncio
                  </Button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {listingsData?.items.map((p) => (
                  <ProductCard key={p.id} product={p} wished={false} />
                ))}
              </div>
            )}
          </>
        )}

        {/* Tab: transactions (own profile only) */}
        {tab === 1 && isOwn && (
          <div className="space-y-3">
            {transactions.length === 0 ? (
              <div className="text-center py-20">
                <div className="text-5xl mb-4">🛍</div>
                <p className="text-xl font-semibold text-ink-900">Sin transacciones</p>
                <p className="text-ink-600 text-sm mt-1">Tus compras y ventas aparecerán aquí</p>
              </div>
            ) : (
              transactions.map((tx) => {
                const canReview = tx.status === 'paid' && (
                  tx.role === 'buyer' ? !tx.buyer_reviewed : !tx.seller_reviewed
                )
                const canPay = tx.role === 'buyer' && tx.status === 'pending'
                return (
                  <div
                    key={tx.id}
                    className="bg-white rounded-card border border-ink-200 px-5 py-4 flex items-center gap-4 hover:border-brand transition-colors"
                  >
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center flex-none cursor-pointer
                        ${tx.role === 'seller' ? 'bg-brand-tint text-brand' : 'bg-amber-50 text-amber-600'}`}
                      onClick={() => navigate(`/products/${tx.product_id}`)}
                    >
                      {tx.role === 'seller' ? <Package size={16} strokeWidth={1.5} /> : <ShoppingBag size={16} strokeWidth={1.5} />}
                    </div>
                    <div className="flex-1 min-w-0 cursor-pointer" onClick={() => navigate(`/products/${tx.product_id}`)}>
                      <p className="text-[14px] font-semibold text-ink-900 truncate">
                        {tx.product?.title ?? `Producto #${tx.product_id}`}
                      </p>
                      <p className="text-[12px] text-ink-400 mt-0.5">
                        {tx.role === 'seller' ? 'Venta' : 'Compra'} · {fmtDate(tx.created_at)}
                      </p>
                    </div>
                    <div className="text-right flex-none flex flex-col items-end gap-1.5">
                      <p className="text-[15px] font-bold text-ink-900">{fmtPrice(tx.amount)}</p>
                      <OrderBadge status={tx.status} />
                      {canPay && (
                        <Button
                          kind="primary"
                          size="sm"
                          icon={<CreditCard size={12} strokeWidth={1.5} />}
                          loading={payingId === tx.id}
                          onClick={() => handlePay(tx.id)}
                        >
                          Pagar
                        </Button>
                      )}
                      {canReview && (
                        <Button
                          kind="outlineBrand"
                          size="sm"
                          icon={<Star size={12} strokeWidth={1.5} />}
                          onClick={() => setReviewTarget(tx)}
                        >
                          Valorar
                        </Button>
                      )}
                    </div>
                  </div>
                )
              })
            )}
          </div>
        )}

        {/* Tab: reviews */}
        {tab === reviewsTabIdx && (
          <div className="space-y-3">
            {reviewsLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="skeleton h-20 rounded-card" />
              ))
            ) : reviews.length === 0 ? (
              <div className="text-center py-20">
                <div className="text-5xl mb-4">⭐</div>
                <p className="text-xl font-semibold text-ink-900">Sin valoraciones aún</p>
                <p className="text-ink-600 text-sm mt-1">Las valoraciones de otros usuarios aparecerán aquí</p>
              </div>
            ) : (
              reviews.map((r) => <ReviewCard key={r.id} review={r} />)
            )}
          </div>
        )}
      </main>

      <div className="md:hidden"><BottomNav /></div>

      {isOwn && user && (
        <EditProfileModal
          open={editOpen}
          onClose={() => setEditOpen(false)}
          user={user}
          onSuccess={(updated) => {
            setUser(updated)
            setStoreUser(updated)
          }}
        />
      )}

      {reviewTarget && (
        <ReviewModal
          open={!!reviewTarget}
          onClose={() => setReviewTarget(null)}
          order={reviewTarget}
          alreadyReviewed={reviewTarget.role === 'buyer' ? reviewTarget.buyer_reviewed : reviewTarget.seller_reviewed}
          onSuccess={() => {
            setTransactions((prev) =>
              prev.map((tx) =>
                tx.id === reviewTarget.id
                  ? {
                      ...tx,
                      buyer_reviewed: tx.role === 'buyer' ? true : tx.buyer_reviewed,
                      seller_reviewed: tx.role === 'seller' ? true : tx.seller_reviewed,
                    }
                  : tx
              )
            )
          }}
        />
      )}
    </div>
  )
}
