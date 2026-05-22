import { useState } from 'react'
import { X } from 'lucide-react'
import { Modal } from './ui/Modal'
import { Button } from './ui/Button'
import { useToast } from './ui/Toast'
import { productsApi } from '../api/productsApi'

const REASONS = [
  'Precio engañoso o fraudulento',
  'Producto prohibido o ilegal',
  'Descripción falsa o engañosa',
  'Spam o anuncio duplicado',
  'Otro',
]

interface Props {
  open: boolean
  onClose: () => void
  productId: number
}

export function ReportModal({ open, onClose, productId }: Props) {
  const toast = useToast()
  const [reason, setReason] = useState('')
  const [comment, setComment] = useState('')
  const [loading, setLoading] = useState(false)

  function handleClose() {
    setReason('')
    setComment('')
    onClose()
  }

  async function handleSubmit() {
    if (!reason) return
    setLoading(true)
    try {
      await productsApi.report(productId, reason, comment.trim() || undefined)
      toast({ kind: 'success', title: 'Reporte enviado', body: 'El equipo de moderación lo revisará.' })
      handleClose()
    } catch {
      toast({ kind: 'error', title: 'Error al enviar el reporte' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal open={open} onClose={handleClose} width={440}>
      <div className="p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-[18px] font-bold text-ink-900">Reportar anuncio</h2>
          <button onClick={handleClose} className="text-ink-400 hover:text-ink-900 focus-ring rounded">
            <X size={18} strokeWidth={1.5} />
          </button>
        </div>

        <p className="text-[13px] text-ink-600 mb-4">
          ¿Por qué quieres reportar este anuncio? El equipo de moderación revisará tu reporte.
        </p>

        <div className="space-y-2 mb-4">
          {REASONS.map((r) => (
            <label key={r} className="flex items-center gap-3 cursor-pointer group">
              <input
                type="radio"
                name="reason"
                value={r}
                checked={reason === r}
                onChange={() => setReason(r)}
                className="accent-brand w-4 h-4 flex-none"
              />
              <span className={`text-[13px] transition-colors ${reason === r ? 'text-ink-900 font-medium' : 'text-ink-600 group-hover:text-ink-900'}`}>
                {r}
              </span>
            </label>
          ))}
        </div>

        <div className="mb-5">
          <label className="block text-[13px] font-semibold text-ink-900 mb-1.5">
            Detalles adicionales <span className="text-ink-400 font-normal">(opcional)</span>
          </label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            maxLength={500}
            rows={3}
            placeholder="Describe el problema con más detalle…"
            className="w-full border border-ink-200 rounded-lg px-4 py-2.5 text-[13px] text-ink-900 outline-none focus:border-brand transition-colors resize-none"
          />
        </div>

        <div className="space-y-2">
          <Button
            kind="danger"
            className="w-full"
            size="lg"
            loading={loading}
            disabled={!reason}
            onClick={handleSubmit}
          >
            Enviar reporte
          </Button>
          <button
            onClick={handleClose}
            className="w-full h-9 text-[13px] font-semibold text-ink-600 hover:text-ink-900 transition-colors"
          >
            Cancelar
          </button>
        </div>
      </div>
    </Modal>
  )
}
