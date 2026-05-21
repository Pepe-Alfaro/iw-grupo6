import type { ReactNode } from 'react'

interface ModalProps {
  open: boolean
  onClose: () => void
  children: ReactNode
  width?: number
}

export function Modal({ open, onClose, children, width = 500 }: ModalProps) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 fade-in">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-card shadow-modal w-full" style={{ maxWidth: width }}>
        {children}
      </div>
    </div>
  )
}
