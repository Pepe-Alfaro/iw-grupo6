import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { User, Lock, CreditCard, ChevronLeft, Eye, EyeOff } from 'lucide-react'
import { Navbar } from '../../components/layout/Navbar'
import { BottomNav } from '../../components/layout/BottomNav'
import { Button } from '../../components/ui/Button'
import { useToast } from '../../components/ui/Toast'
import { useAuthStore } from '../../store/authStore'
import { usersApi } from '../../api/usersApi'

function Section({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-card border border-ink-200 shadow-card">
      <div className="flex items-center gap-2.5 px-6 py-4 border-b border-ink-200">
        <span className="text-brand">{icon}</span>
        <h2 className="text-[15px] font-bold text-ink-900">{title}</h2>
      </div>
      <div className="px-6 py-5">{children}</div>
    </div>
  )
}

function Field({
  label,
  value,
  onChange,
  disabled = false,
  hint,
  type = 'text',
  suffix,
}: {
  label: string
  value: string
  onChange?: (v: string) => void
  disabled?: boolean
  hint?: string
  type?: string
  suffix?: React.ReactNode
}) {
  return (
    <div>
      <label className="block text-[13px] font-semibold text-ink-900 mb-1.5">{label}</label>
      <div className="relative">
        <input
          type={type}
          value={value}
          disabled={disabled}
          onChange={(e) => onChange?.(e.target.value)}
          className={`w-full h-11 border rounded-lg px-4 text-[14px] outline-none transition-colors ${
            disabled
              ? 'border-ink-200 text-ink-400 bg-ink-50 cursor-not-allowed'
              : 'border-ink-200 text-ink-900 bg-white focus:border-brand'
          } ${suffix ? 'pr-10' : ''}`}
        />
        {suffix && <div className="absolute right-3 top-1/2 -translate-y-1/2">{suffix}</div>}
      </div>
      {hint && <p className="text-[11px] text-ink-400 mt-1">{hint}</p>}
    </div>
  )
}

export default function Settings() {
  const navigate = useNavigate()
  const toast = useToast()
  const currentUser = useAuthStore((s) => s.user)
  const setStoreUser = useAuthStore((s) => s.setUser)

  // Datos personales
  const [fullName, setFullName] = useState(currentUser?.full_name ?? '')
  const [savingProfile, setSavingProfile] = useState(false)

  // Contraseña
  const [currentPwd, setCurrentPwd] = useState('')
  const [newPwd, setNewPwd] = useState('')
  const [confirmPwd, setConfirmPwd] = useState('')
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [savingPwd, setSavingPwd] = useState(false)

  async function handleSaveProfile() {
    const name = fullName.trim()
    if (!name) return
    setSavingProfile(true)
    try {
      const { data } = await usersApi.updateMe({ full_name: name })
      setStoreUser(data)
      toast({ kind: 'success', title: 'Datos actualizados' })
    } catch {
      toast({ kind: 'error', title: 'Error al guardar los datos' })
    } finally {
      setSavingProfile(false)
    }
  }

  async function handleChangePassword() {
    if (newPwd !== confirmPwd) {
      toast({ kind: 'error', title: 'Las contraseñas no coinciden' })
      return
    }
    if (newPwd.length < 8) {
      toast({ kind: 'error', title: 'La nueva contraseña debe tener al menos 8 caracteres' })
      return
    }
    setSavingPwd(true)
    try {
      await usersApi.changePassword(currentPwd, newPwd)
      toast({ kind: 'success', title: 'Contraseña actualizada' })
      setCurrentPwd('')
      setNewPwd('')
      setConfirmPwd('')
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      toast({ kind: 'error', title: msg ?? 'Error al cambiar la contraseña' })
    } finally {
      setSavingPwd(false)
    }
  }

  const pwdValid = currentPwd.length > 0 && newPwd.length >= 8 && confirmPwd.length > 0

  return (
    <div className="min-h-screen flex flex-col bg-ink-50">
      <div className="hidden md:block"><Navbar /></div>
      <div className="md:hidden"><Navbar mobile /></div>

      <main className="flex-1 max-w-[720px] mx-auto w-full px-4 md:px-8 py-8">
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => navigate(-1)}
            className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-ink-100 transition-colors"
          >
            <ChevronLeft size={20} strokeWidth={1.5} className="text-ink-600" />
          </button>
          <h1 className="text-[22px] font-bold text-ink-900">Ajustes</h1>
        </div>

        <div className="space-y-5">
          {/* Datos personales */}
          <Section icon={<User size={17} strokeWidth={1.5} />} title="Datos personales">
            <div className="space-y-4">
              <Field
                label="Nombre completo"
                value={fullName}
                onChange={setFullName}
              />
              <Field
                label="Nombre de usuario"
                value={currentUser?.username ?? ''}
                disabled
                hint="El nombre de usuario no se puede cambiar"
              />
              <Field
                label="Correo electrónico"
                value={currentUser?.email ?? ''}
                disabled
                hint="Para cambiar el email contacta con soporte"
              />
            </div>
            <div className="mt-5">
              <Button
                loading={savingProfile}
                disabled={!fullName.trim() || fullName.trim() === currentUser?.full_name}
                onClick={handleSaveProfile}
              >
                Guardar cambios
              </Button>
            </div>
          </Section>

          {/* Cambiar contraseña */}
          <Section icon={<Lock size={17} strokeWidth={1.5} />} title="Contraseña">
            <div className="space-y-4">
              <Field
                label="Contraseña actual"
                type={showCurrent ? 'text' : 'password'}
                value={currentPwd}
                onChange={setCurrentPwd}
                suffix={
                  <button type="button" onClick={() => setShowCurrent((v) => !v)} className="text-ink-400 hover:text-ink-600">
                    {showCurrent ? <EyeOff size={16} strokeWidth={1.5} /> : <Eye size={16} strokeWidth={1.5} />}
                  </button>
                }
              />
              <Field
                label="Nueva contraseña"
                type={showNew ? 'text' : 'password'}
                value={newPwd}
                onChange={setNewPwd}
                hint="Mínimo 8 caracteres"
                suffix={
                  <button type="button" onClick={() => setShowNew((v) => !v)} className="text-ink-400 hover:text-ink-600">
                    {showNew ? <EyeOff size={16} strokeWidth={1.5} /> : <Eye size={16} strokeWidth={1.5} />}
                  </button>
                }
              />
              <Field
                label="Confirmar nueva contraseña"
                type="password"
                value={confirmPwd}
                onChange={setConfirmPwd}
              />
            </div>
            <div className="mt-5">
              <Button
                loading={savingPwd}
                disabled={!pwdValid}
                onClick={handleChangePassword}
              >
                Cambiar contraseña
              </Button>
            </div>
          </Section>

          {/* Método de pago */}
          <Section icon={<CreditCard size={17} strokeWidth={1.5} />} title="Método de pago">
            <div className="flex items-center gap-4 p-4 rounded-lg border border-ink-200 bg-ink-50 mb-4">
              <div className="w-10 h-7 rounded bg-ink-200 flex items-center justify-center flex-none">
                <CreditCard size={16} strokeWidth={1.5} className="text-ink-600" />
              </div>
              <div className="flex-1">
                <p className="text-[13px] font-semibold text-ink-900">Visa ····4242</p>
                <p className="text-[11px] text-ink-400">Caduca 08/28</p>
              </div>
              <span className="text-[11px] font-semibold text-brand bg-brand-tint px-2 py-0.5 rounded-full">Principal</span>
            </div>
            <Button
              kind="outline"
              disabled
              title="Próximamente disponible"
            >
              Añadir método de pago
            </Button>
            <p className="text-[11px] text-ink-400 mt-2">La integración con pasarela de pago está en desarrollo</p>
          </Section>
        </div>
      </main>

      <div className="md:hidden"><BottomNav /></div>
    </div>
  )
}
