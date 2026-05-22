import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { Modal } from './ui/Modal'
import { Button } from './ui/Button'
import { useToast } from './ui/Toast'
import { usersApi } from '../api/usersApi'
import type { User } from '../types'

interface Props {
  open: boolean
  onClose: () => void
  user: User
  onSuccess: (updated: User) => void
}

export function EditProfileModal({ open, onClose, user, onSuccess }: Props) {
  const toast = useToast()
  const [fullName, setFullName] = useState(user.full_name)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (open) setFullName(user.full_name)
  }, [open, user.full_name])

  async function handleSubmit() {
    const name = fullName.trim()
    if (!name) return
    setLoading(true)
    try {
      const { data } = await usersApi.updateMe({ full_name: name })
      toast({ kind: 'success', title: 'Perfil actualizado' })
      onSuccess(data)
      onClose()
    } catch {
      toast({ kind: 'error', title: 'Error al actualizar el perfil' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} width={440}>
      <div className="p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-[18px] font-bold text-ink-900">Editar perfil</h2>
          <button onClick={onClose} className="text-ink-400 hover:text-ink-900 focus-ring rounded">
            <X size={18} strokeWidth={1.5} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-[13px] font-semibold text-ink-900 mb-1.5">Nombre completo</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              maxLength={80}
              className="w-full h-11 border border-ink-200 rounded-lg px-4 text-[14px] text-ink-900 outline-none focus:border-brand transition-colors"
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            />
          </div>

          <div>
            <label className="block text-[13px] font-semibold text-ink-900 mb-1.5">Nombre de usuario</label>
            <input
              type="text"
              value={user.username}
              disabled
              className="w-full h-11 border border-ink-200 rounded-lg px-4 text-[14px] text-ink-400 bg-ink-50 cursor-not-allowed"
            />
            <p className="text-[11px] text-ink-400 mt-1">El nombre de usuario no se puede cambiar</p>
          </div>
        </div>

        <div className="mt-5 space-y-2">
          <Button className="w-full" size="lg" loading={loading} disabled={!fullName.trim()} onClick={handleSubmit}>
            Guardar cambios
          </Button>
          <button
            onClick={onClose}
            className="w-full h-9 text-[13px] font-semibold text-ink-600 hover:text-ink-900 transition-colors"
          >
            Cancelar
          </button>
        </div>
      </div>
    </Modal>
  )
}
