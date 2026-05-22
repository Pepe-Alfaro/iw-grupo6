import { useState, useEffect } from 'react'
import { X, ChevronLeft, KeyRound, Trash2 } from 'lucide-react'
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
  onDelete?: () => void
}

type View = 'profile' | 'password' | 'delete'

export function EditProfileModal({ open, onClose, user, onSuccess, onDelete }: Props) {
  const toast = useToast()
  const [view, setView] = useState<View>('profile')
  const [loading, setLoading] = useState(false)

  // profile fields
  const [fullName, setFullName] = useState(user.full_name)

  // password fields
  const [currentPwd, setCurrentPwd] = useState('')
  const [newPwd, setNewPwd] = useState('')
  const [confirmPwd, setConfirmPwd] = useState('')

  useEffect(() => {
    if (open) {
      setView('profile')
      setFullName(user.full_name)
      setCurrentPwd('')
      setNewPwd('')
      setConfirmPwd('')
    }
  }, [open, user.full_name])

  async function handleSaveProfile() {
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

  async function handleChangePassword() {
    if (newPwd !== confirmPwd) {
      toast({ kind: 'error', title: 'Las contraseñas no coinciden' })
      return
    }
    if (newPwd.length < 6) {
      toast({ kind: 'error', title: 'La nueva contraseña debe tener al menos 6 caracteres' })
      return
    }
    setLoading(true)
    try {
      await usersApi.changePassword(currentPwd, newPwd)
      toast({ kind: 'success', title: 'Contraseña actualizada' })
      onClose()
    } catch {
      toast({ kind: 'error', title: 'Contraseña actual incorrecta' })
    } finally {
      setLoading(false)
    }
  }

  async function handleDeleteAccount() {
    setLoading(true)
    try {
      await usersApi.deleteAccount()
      toast({ kind: 'success', title: 'Cuenta eliminada' })
      onClose()
      onDelete?.()
    } catch {
      toast({ kind: 'error', title: 'Error al eliminar la cuenta' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} width={440}>
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            {view !== 'profile' && (
              <button onClick={() => setView('profile')} className="text-ink-400 hover:text-ink-900 focus-ring rounded">
                <ChevronLeft size={18} strokeWidth={1.5} />
              </button>
            )}
            <h2 className="text-[18px] font-bold text-ink-900">
              {view === 'profile' && 'Editar perfil'}
              {view === 'password' && 'Cambiar contraseña'}
              {view === 'delete' && 'Eliminar cuenta'}
            </h2>
          </div>
          <button onClick={onClose} className="text-ink-400 hover:text-ink-900 focus-ring rounded">
            <X size={18} strokeWidth={1.5} />
          </button>
        </div>

        {/* ── Profile view ── */}
        {view === 'profile' && (
          <>
            <div className="space-y-4">
              <div>
                <label className="block text-[13px] font-semibold text-ink-900 mb-1.5">Nombre completo</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  maxLength={80}
                  className="w-full h-11 border border-ink-200 rounded-lg px-4 text-[14px] text-ink-900 outline-none focus:border-brand transition-colors"
                  onKeyDown={(e) => e.key === 'Enter' && handleSaveProfile()}
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
              <Button className="w-full" size="lg" loading={loading} disabled={!fullName.trim()} onClick={handleSaveProfile}>
                Guardar cambios
              </Button>
              <button
                onClick={() => setView('password')}
                className="w-full h-9 flex items-center justify-center gap-2 text-[13px] font-semibold text-ink-600 hover:text-ink-900 transition-colors"
              >
                <KeyRound size={14} strokeWidth={1.5} />
                Cambiar contraseña
              </button>
            </div>

            <div className="mt-4 pt-4 border-t border-ink-200">
              <button
                onClick={() => setView('delete')}
                className="w-full h-9 flex items-center justify-center gap-2 text-[13px] font-semibold text-danger hover:bg-rose-50 rounded-lg transition-colors"
              >
                <Trash2 size={14} strokeWidth={1.5} />
                Eliminar cuenta
              </button>
            </div>
          </>
        )}

        {/* ── Password view ── */}
        {view === 'password' && (
          <>
            <div className="space-y-3">
              <div>
                <label className="block text-[13px] font-semibold text-ink-900 mb-1.5">Contraseña actual</label>
                <input
                  type="password"
                  value={currentPwd}
                  onChange={(e) => setCurrentPwd(e.target.value)}
                  className="w-full h-11 border border-ink-200 rounded-lg px-4 text-[14px] text-ink-900 outline-none focus:border-brand transition-colors"
                />
              </div>
              <div>
                <label className="block text-[13px] font-semibold text-ink-900 mb-1.5">Nueva contraseña</label>
                <input
                  type="password"
                  value={newPwd}
                  onChange={(e) => setNewPwd(e.target.value)}
                  className="w-full h-11 border border-ink-200 rounded-lg px-4 text-[14px] text-ink-900 outline-none focus:border-brand transition-colors"
                />
              </div>
              <div>
                <label className="block text-[13px] font-semibold text-ink-900 mb-1.5">Confirmar nueva contraseña</label>
                <input
                  type="password"
                  value={confirmPwd}
                  onChange={(e) => setConfirmPwd(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleChangePassword()}
                  className={`w-full h-11 border rounded-lg px-4 text-[14px] text-ink-900 outline-none focus:border-brand transition-colors
                    ${confirmPwd && confirmPwd !== newPwd ? 'border-danger' : 'border-ink-200'}`}
                />
                {confirmPwd && confirmPwd !== newPwd && (
                  <p className="text-[11px] text-danger mt-1">Las contraseñas no coinciden</p>
                )}
              </div>
            </div>

            <div className="mt-5 space-y-2">
              <Button
                className="w-full"
                size="lg"
                loading={loading}
                disabled={!currentPwd || !newPwd || newPwd !== confirmPwd}
                onClick={handleChangePassword}
              >
                Actualizar contraseña
              </Button>
              <button
                onClick={() => setView('profile')}
                className="w-full h-9 text-[13px] font-semibold text-ink-600 hover:text-ink-900 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </>
        )}

        {/* ── Delete view ── */}
        {view === 'delete' && (
          <>
            <div className="bg-rose-50 border border-rose-200 rounded-lg p-4 mb-5">
              <p className="text-[14px] font-semibold text-danger mb-1">Esta acción es irreversible</p>
              <p className="text-[13px] text-ink-600 leading-relaxed">
                Tu cuenta quedará anonimizada permanentemente. No podrás recuperar tu historial, anuncios ni mensajes.
              </p>
            </div>

            <div className="space-y-2">
              <Button
                kind="danger"
                className="w-full"
                size="lg"
                loading={loading}
                onClick={handleDeleteAccount}
              >
                Confirmar eliminación
              </Button>
              <button
                onClick={() => setView('profile')}
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
