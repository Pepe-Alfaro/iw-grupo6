import { createContext, useCallback, useContext, useState, type ReactNode } from 'react'
import { CheckCircle, AlertCircle, Info } from 'lucide-react'

type ToastKind = 'success' | 'error' | 'info'

interface ToastItem {
  id: string
  kind: ToastKind
  title: string
  body?: string
  duration?: number
}

type PushToast = (toast: Omit<ToastItem, 'id'>) => void

const ToastContext = createContext<PushToast | null>(null)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([])

  const push = useCallback<PushToast>((toast) => {
    const id = Math.random().toString(36).slice(2)
    setItems((its) => [...its, { id, ...toast }])
    setTimeout(
      () => setItems((its) => its.filter((t) => t.id !== id)),
      toast.duration ?? 4000
    )
  }, [])

  const BORDER: Record<ToastKind, string> = {
    success: 'border-l-success',
    error: 'border-l-danger',
    info: 'border-l-brand',
  }

  const Icon = ({ kind }: { kind: ToastKind }) => {
    if (kind === 'success') return <CheckCircle size={18} className="text-success mt-0.5 flex-none" strokeWidth={1.5} />
    if (kind === 'error') return <AlertCircle size={18} className="text-danger mt-0.5 flex-none" strokeWidth={1.5} />
    return <Info size={18} className="text-brand mt-0.5 flex-none" strokeWidth={1.5} />
  }

  return (
    <ToastContext.Provider value={push}>
      {children}
      <div className="fixed top-5 right-5 z-[120] flex flex-col gap-2 pointer-events-none">
        {items.map((t) => (
          <div
            key={t.id}
            className={`toast-in pointer-events-auto bg-white shadow-card border border-ink-200 ${BORDER[t.kind]} border-l-4 rounded-card pl-3 pr-4 py-3 min-w-[280px] max-w-[360px] flex items-start gap-2.5`}
          >
            <Icon kind={t.kind} />
            <div className="flex-1">
              <div className="text-[13px] font-semibold text-ink-900">{t.title}</div>
              {t.body && <div className="text-[12px] text-ink-600 mt-0.5">{t.body}</div>}
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast(): PushToast {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used inside ToastProvider')
  return ctx
}
