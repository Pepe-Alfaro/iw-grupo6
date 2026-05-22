import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Heart, MessageCircle, Star, MapPin, AlertCircle, Info } from 'lucide-react'
import { Navbar } from '../../components/layout/Navbar'
import { BottomNav } from '../../components/layout/BottomNav'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { useToast } from '../../components/ui/Toast'
import { useProduct } from '../../hooks/useProduct'
import { auctionsApi } from '../../api/auctionsApi'
import { ordersApi } from '../../api/ordersApi'
import { wishlistApi } from '../../api/wishlistApi'
import { messagesApi } from '../../api/messagesApi'
import { useAuthStore } from '../../store/authStore'
import { fmtPrice, conditionLabel } from '../../utils/format'
import { ReportModal } from '../../components/ReportModal'
import type { Auction } from '../../types'

// ─── Auction countdown ──────────────────────────────────────────────────────
function useCountdown(endsAt: string) {
  const calc = () => Math.max(0, Math.floor((new Date(endsAt).getTime() - Date.now()) / 1000))
  const [secs, setSecs] = useState(calc)
  useEffect(() => {
    const id = setInterval(() => setSecs(calc), 1000)
    return () => clearInterval(id)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [endsAt])
  const d = Math.floor(secs / 86400)
  const h = Math.floor((secs % 86400) / 3600)
  const m = Math.floor((secs % 3600) / 60)
  const s = secs % 60
  return { d, h, m, s, expired: secs === 0 }
}

function AuctionTimer({ endsAt }: { endsAt: string }) {
  const { d, h, m, s, expired } = useCountdown(endsAt)
  if (expired) return <Badge tone="dangerSoft" className="text-sm px-3 py-1.5">Subasta finalizada</Badge>
  const boxes = [{ v: d, l: 'DÍAS' }, { v: h, l: 'HRS' }, { v: m, l: 'MIN' }, { v: s, l: 'SEG' }]
  return (
    <div className="flex gap-2">
      {boxes.map(({ v, l }) => (
        <div key={l} className="flex flex-col items-center bg-ink-900 rounded-lg px-3 py-2 min-w-[56px]">
          <span className="text-white text-3xl font-bold tabular-nums">{String(v).padStart(2, '0')}</span>
          <span className="text-ink-400 text-[10px] font-medium mt-0.5">{l}</span>
        </div>
      ))}
    </div>
  )
}

// ─── Seller card ────────────────────────────────────────────────────────────
function SellerCard({ seller, onMessage, canMessage }: { seller: NonNullable<import('../../types').Product['seller']>; onMessage: () => void; canMessage: boolean }) {
  return (
    <div className="border border-ink-200 rounded-card p-4">
      <div className="flex items-center gap-3">
        <span className="w-12 h-12 rounded-full bg-brand text-white text-[18px] font-bold flex items-center justify-center flex-none">
          {seller.full_name[0].toUpperCase()}
        </span>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-ink-900 text-[14px]">@{seller.username}</div>
          <div className="flex items-center gap-1 text-[12px] text-ink-600 mt-0.5">
            <Star size={11} className="fill-amber500 stroke-amber500" />
            <span>{seller.avg_rating.toFixed(1)}</span>
            <span className="text-ink-400">· {seller.total_reviews} valoraciones</span>
          </div>
        </div>
        {canMessage && (
          <Button kind="ghost" size="sm" icon={<MessageCircle size={14} strokeWidth={1.5} />} onClick={onMessage}>
            Mensaje
          </Button>
        )}
      </div>
    </div>
  )
}

// ─── Main component ──────────────────────────────────────────────────────────
export default function ProductDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const toast = useToast()
  const user = useAuthStore((s) => s.user)
  const { product, loading, error } = useProduct(Number(id))
  const [auction, setAuction] = useState<Auction | null>(null)
  const [bidAmount, setBidAmount] = useState('')
  const [bidLoading, setBidLoading] = useState(false)
  const [wished, setWished] = useState(false)
  const [wishItemId, setWishItemId] = useState<number | null>(null)
  const [activeImgId, setActiveImgId] = useState<number | null>(null)
  const [reportOpen, setReportOpen] = useState(false)

  useEffect(() => {
    if (product?.sale_type === 'auction') {
      auctionsApi.get(product.id).then((r) => setAuction(r.data)).catch(() => null)
    }
  }, [product])

  useEffect(() => {
    if (!user || !product) return
    wishlistApi.list().then((r) => {
      const found = r.data.find((item) => item.product_id === product.id)
      if (found) { setWished(true); setWishItemId(found.id) }
    }).catch(() => null)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, product?.id])

  if (loading) return (
    <div className="min-h-screen flex flex-col">
      <div className="hidden md:block"><Navbar /></div>
      <div className="md:hidden"><Navbar mobile /></div>
      <main className="flex-1 max-w-[1280px] mx-auto w-full px-4 md:px-8 py-8">
        <div className="grid md:grid-cols-[60%_40%] gap-8">
          <div className="skeleton rounded-card aspect-square" />
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => <div key={i} className="skeleton h-8 rounded-lg" />)}
          </div>
        </div>
      </main>
    </div>
  )

  if (error || !product) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 text-ink-600">
      <AlertCircle size={48} strokeWidth={1} />
      <p className="text-xl font-semibold">Producto no encontrado</p>
      <Button kind="outlineBrand" onClick={() => navigate(-1)}>Volver</Button>
    </div>
  )

  // product is non-null past the early return above; closures need an explicit const
  const prod = product
  const isSeller = user?.id === prod.seller_id
  const isAuction = prod.sale_type === 'auction'
  const mainImage = prod.images?.find((i) => i.is_main) ?? prod.images?.[0]
  const displayImage = activeImgId != null ? prod.images?.find((i) => i.id === activeImgId) : mainImage

  async function handleBid() {
    if (!user) { navigate('/auth'); return }
    const amount = parseFloat(bidAmount)
    if (!amount || amount <= parseFloat(auction?.current_bid ?? '0')) {
      toast({ kind: 'error', title: 'La puja debe superar la puja actual' })
      return
    }
    setBidLoading(true)
    try {
      const { data } = await auctionsApi.bid(prod.id, amount)
      setAuction((a) => a ? { ...a, current_bid: data.amount, current_bidder_id: user.id } : a)
      setBidAmount('')
      toast({ kind: 'success', title: '¡Puja realizada!', body: `Tu puja de ${fmtPrice(amount)} ha sido registrada.` })
    } catch (err: unknown) {
      const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      toast({ kind: 'error', title: detail ?? 'Error al pujar' })
    } finally {
      setBidLoading(false)
    }
  }

  async function handleBuyNow() {
    if (!user) { navigate('/auth'); return }
    try {
      const { data } = await ordersApi.create(prod.id)
      toast({ kind: 'success', title: '¡Compra completada!', body: `Pedido #${data.id} creado.` })
      navigate(`/profile/me`)
    } catch (err: unknown) {
      const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      toast({ kind: 'error', title: detail ?? 'Error al comprar' })
    }
  }

  async function handleMessage() {
    if (!user) { navigate('/auth'); return }
    if (!prod.seller_id) return
    try {
      const { data } = await messagesApi.createConversation(prod.seller_id, prod.id)
      navigate(`/messages?conv=${data.id}`)
    } catch {
      navigate('/messages')
    }
  }

  async function handleToggleWish() {
    if (!user) { navigate('/auth'); return }
    if (wished && wishItemId) {
      await wishlistApi.remove(wishItemId).catch(() => null)
      setWished(false)
      setWishItemId(null)
    } else {
      const { data } = await wishlistApi.add(prod.id)
      setWished(true)
      setWishItemId(data.id)
    }
  }

  const RightColumn = () => (
    <div className="space-y-5">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-[12px] text-ink-600">
        <button onClick={() => navigate('/')} className="hover:text-brand">Inicio</button>
        <span>/</span>
        {product.categories?.[0] && (
          <>
            <button onClick={() => navigate(`/search?category=${product.categories![0]}`)} className="hover:text-brand capitalize">
              {product.categories[0]}
            </button>
            <span>/</span>
          </>
        )}
        <span className="text-ink-900 truncate max-w-[160px]">{product.title}</span>
      </div>

      <div>
        <h1 className="text-[24px] font-bold text-ink-900 leading-tight">{product.title}</h1>
        <div className="flex items-center gap-2 mt-2 flex-wrap">
          <Badge tone="neutral">{conditionLabel(product.condition)}</Badge>
          {product.categories?.map((c) => (
            <Badge key={c} tone="brand" className="capitalize">{c}</Badge>
          ))}
        </div>
      </div>

      {isAuction ? (
        /* ── Auction block ── */
        <div className="space-y-4">
          <Badge tone="amber" className="text-[14px] px-4 py-2">EN SUBASTA</Badge>
          <div>
            <p className="text-[12px] text-ink-600 mb-1">Precio inicial</p>
            <p className="text-ink-400 line-through text-[15px]">{fmtPrice(product.price)}</p>
          </div>
          <div>
            <p className="text-[12px] text-ink-600 mb-1">Puja actual</p>
            <p className="text-[32px] font-bold text-amber500">
              {fmtPrice(auction?.current_bid ?? product.price)}
            </p>
          </div>
          {auction && <AuctionTimer endsAt={auction.ends_at} />}
          {auction && (
            <p className="text-[12px] text-ink-600">
              {auction.current_bidder_id ? `Último pujador activo` : 'Sin pujas todavía'}
            </p>
          )}
          {!auction?.is_closed && !isSeller && (
            <div className="space-y-2">
              <input
                type="number"
                placeholder={`Mín. ${fmtPrice(parseFloat(auction?.current_bid ?? product.price.toString()) + 1)}`}
                value={bidAmount}
                onChange={(e) => setBidAmount(e.target.value)}
                className="w-full h-11 border border-ink-200 rounded-lg px-4 text-[14px] outline-none focus:border-amber500"
              />
              <Button kind="amber" className="w-full" size="lg" loading={bidLoading} onClick={handleBid}>
                Pujar ahora
              </Button>
              <div className="flex items-start gap-1.5 text-[11px] text-ink-600">
                <Info size={12} strokeWidth={1.5} className="mt-0.5 flex-none" />
                Las pujas son vinculantes. Solo puja si estás dispuesto a comprar.
              </div>
            </div>
          )}
          {!auction?.is_closed && isSeller && (
            <p className="text-[13px] text-ink-400 text-center py-2">Este es tu anuncio</p>
          )}
        </div>
      ) : (
        /* ── Fixed price block ── */
        <div className="space-y-4">
          <div>
            <p className="text-[32px] font-bold text-brand-dark">{fmtPrice(product.price)}</p>
            <p className="text-[12px] text-ink-400">IVA incluido</p>
          </div>
          {isSeller ? (
            <div className="p-3 rounded-lg bg-ink-50 border border-ink-200 text-center text-[13px] text-ink-600">
              Este es tu anuncio
            </div>
          ) : (
            <Button className="w-full" size="xl" onClick={handleBuyNow}>
              Comprar ahora
            </Button>
          )}
          {!isSeller && (
            <Button kind="outlineBrand" className="w-full" size="lg" icon={<Heart size={16} strokeWidth={1.5} className={wished ? 'fill-brand stroke-brand' : ''} />} onClick={handleToggleWish}>
              {wished ? 'Guardado' : 'Añadir a Wishlist'}
            </Button>
          )}
        </div>
      )}

      <hr className="border-ink-200" />

      {product.seller && (
        <SellerCard seller={product.seller} onMessage={handleMessage} canMessage={!isSeller} />
      )}

      <hr className="border-ink-200" />

      {/* Description */}
      <div>
        <h3 className="text-[14px] font-semibold text-ink-900 mb-2">Descripción</h3>
        <p className="text-[14px] text-ink-600 leading-relaxed whitespace-pre-line">{product.description}</p>
      </div>

      <div className="flex items-center gap-1 text-[12px] text-ink-400">
        <MapPin size={11} strokeWidth={1.5} /> España
      </div>

      {!isSeller && (
        <button
          onClick={() => { if (!user) { navigate('/auth'); return }; setReportOpen(true) }}
          className="text-[12px] text-ink-400 hover:text-danger underline-offset-2 hover:underline"
        >
          Reportar anuncio
        </button>
      )}
    </div>
  )

  return (
    <div className="min-h-screen flex flex-col bg-ink-50">
      <div className="hidden md:block"><Navbar /></div>
      <div className="md:hidden"><Navbar mobile /></div>

      <main className="flex-1 max-w-[1280px] mx-auto w-full px-4 md:px-8 py-8">
        <div className="md:grid md:grid-cols-[60%_40%] md:gap-10">
          {/* Images */}
          <div className="mb-6 md:mb-0">
            <div className="rounded-card overflow-hidden bg-ink-100 aspect-square w-full">
              {displayImage ? (
                <img src={displayImage.url} alt={product.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-brand-tint to-ink-100 flex items-center justify-center text-6xl">
                  📦
                </div>
              )}
            </div>
            {product.images && product.images.length > 1 && (
              <div className="flex gap-2 mt-3">
                {product.images.map((img) => {
                  const isActive = activeImgId === img.id || (activeImgId == null && img.id === mainImage?.id)
                  return (
                    <div
                      key={img.id}
                      onClick={() => setActiveImgId(img.id)}
                      className={`w-16 h-16 rounded-lg overflow-hidden border-2 cursor-pointer transition-colors
                        ${isActive ? 'border-brand' : 'border-transparent hover:border-brand/40'}`}
                    >
                      <img src={img.url} alt="" className="w-full h-full object-cover" />
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Right col */}
          <div>
            <RightColumn />
          </div>
        </div>
      </main>

      {/* Mobile sticky bottom bar */}
      {!isSeller && (
        <div className="md:hidden sticky bottom-16 bg-white border-t border-ink-200 px-4 py-3 flex items-center gap-3">
          <span className={`text-xl font-bold ${isAuction ? 'text-amber500' : 'text-brand-dark'}`}>
            {fmtPrice(isAuction ? (auction?.current_bid ?? product.price) : product.price)}
          </span>
          <Button className="flex-1" size="lg" kind={isAuction ? 'amber' : 'primary'} onClick={isAuction ? handleBid : handleBuyNow}>
            {isAuction ? 'Pujar ahora' : 'Comprar ahora'}
          </Button>
        </div>
      )}

      <div className="md:hidden"><BottomNav /></div>

      <ReportModal
        open={reportOpen}
        onClose={() => setReportOpen(false)}
        productId={prod.id}
      />
    </div>
  )
}
