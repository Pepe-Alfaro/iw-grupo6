import { useState, useEffect } from 'react'
import { CheckCircle, X } from 'lucide-react'
import { Modal } from './ui/Modal'
import { Button } from './ui/Button'
import { useToast } from './ui/Toast'
import { reviewsApi } from '../api/reviewsApi'
import { fmtPrice } from '../utils/format'
import type { Order } from '../types'

interface ReviewModalProps {
  open: boolean
  onClose: () => void
  order: Order & { role: 'buyer' | 'seller'; product?: { id: number; title: string } | null }
  alreadyReviewed: boolean
  onSuccess: () => void
}

const LABELS = ['', 'Muy malo', 'Malo', 'Regular', 'Bueno', 'Excelente']

function StarPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hover, setHover] = useState(0)
  const active = hover || value
  return (
    <div className="flex flex-col items-center gap-2 py-4 bg-ink-50 rounded-card">
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((i) => (
          <button
            key={i}
            type="button"
            onMouseEnter={() => setHover(i)}
            onMouseLeave={() => setHover(0)}
            onClick={() => onChange(i)}
            className="p-0.5 transition-transform hover:scale-110"
          >
            <svg width="40" height="40" viewBox="0 0 24 24" strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round"
              fill={active >= i ? '#F5A623' : 'none'}
              stroke={active >= i ? '#F5A623' : '#D1D5DB'}
            >
              <path d="M11.5 2.6a.6.6 0 0 1 1 0l2.4 5.2 5.6.5a.6.6 0 0 1 .35 1.06l-4.27 3.72 1.27 5.5a.6.6 0 0 1-.9.64L12 16.4l-4.95 2.82a.6.6 0 0 1-.9-.64l1.27-5.5L3.15 9.36A.6.6 0 0 1 3.5 8.3l5.6-.5z" />
            </svg>
          </button>
        ))}
      </div>
      <span className="text-[12px] text-ink-600 h-4">{LABELS[active] || 'Pulsa una estrella'}</span>
    </div>
  )
}

export function ReviewModal({ open, onClose, order, alreadyReviewed, onSuccess }: ReviewModalProps) {
  const toast = useToast()
  const [stars, setStars] = useState(0)
  const [comment, setComment] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (open) { setStars(0); setComment('') }
  }, [open])

  async function handleSubmit() {
    if (!stars) return
    setLoading(true)
    try {
      await reviewsApi.create(order.id, stars, comment.trim() || undefined)
      toast({ kind: 'success', title: '¡Gracias por tu valoración!', body: 'Tu opinión ayuda a otros usuarios.' })
      onSuccess()
      onClose()
    } catch {
      toast({ kind: 'error', title: 'Error al enviar la valoración' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} width={480}>
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <h2 className="text-[18px] font-bold text-ink-900">Valora tu transacción</h2>
          <button onClick={onClose} className="text-ink-400 hover:text-ink-900 -mt-0.5 focus-ring rounded">
            <X size={18} strokeWidth={1.5} />
          </button>
        </div>

        {/* Product pill */}
        <div className="flex items-center gap-3 p-3 rounded-lg bg-ink-50 border border-ink-200 mb-5">
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-semibold text-ink-900 truncate">
              {order.product?.title ?? `Pedido #${order.id}`}
            </p>
            <p className="text-[11px] text-ink-400 mt-0.5">
              {order.role === 'buyer' ? 'Compra' : 'Venta'} · {fmtPrice(order.amount)}
            </p>
          </div>
        </div>

        {alreadyReviewed ? (
          <div className="bg-emerald-50 border border-emerald-200 rounded-card p-4 flex items-start gap-3">
            <CheckCircle size={20} strokeWidth={1.5} className="text-success flex-none mt-0.5" />
            <div>
              <p className="text-[14px] font-semibold text-ink-900">Ya valoraste esta transacción</p>
              <p className="text-[12px] text-ink-600 mt-1">Solo se puede valorar una vez por pedido.</p>
            </div>
          </div>
        ) : (
          <>
            <StarPicker value={stars} onChange={setStars} />

            <textarea
              placeholder="Escribe un comentario (opcional)"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              maxLength={500}
              rows={3}
              className="mt-4 w-full resize-y min-h-[80px] border border-ink-200 rounded-lg px-3 py-2.5 text-[14px] text-ink-900 placeholder:text-ink-400 outline-none focus:border-brand transition-colors"
            />
            <p className="text-[11px] text-ink-400 text-right mt-1">{comment.length}/500</p>

            <div className="mt-4 space-y-2">
              <Button className="w-full" size="lg" disabled={!stars} loading={loading} onClick={handleSubmit}>
                Enviar valoración
              </Button>
              <button
                onClick={onClose}
                className="w-full h-9 text-[13px] font-semibold text-ink-600 hover:text-ink-900 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </>
        )}
      </div>
    </Modal>
  )
}
