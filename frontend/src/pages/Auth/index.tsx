import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Mail, Lock, Eye, EyeOff, User } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { useToast } from '../../components/ui/Toast'
import { authApi } from '../../api/authApi'
import { usersApi } from '../../api/usersApi'
import { useAuthStore } from '../../store/authStore'

export default function Auth() {
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [loading, setLoading] = useState(false)
  const [showPwd, setShowPwd] = useState(false)
  const [fieldError, setFieldError] = useState('')
  const navigate = useNavigate()
  const toast = useToast()
  const login = useAuthStore((s) => s.login)

  const [form, setForm] = useState({ email: '', password: '', username: '', full_name: '' })
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setFieldError('')
    try {
      let token: string
      if (mode === 'login') {
        const { data } = await authApi.login({ email: form.email, password: form.password })
        token = data.access_token
      } else {
        const { data } = await authApi.register(form)
        token = data.access_token
      }
      // Fetch real user profile with the fresh token
      const { data: user } = await usersApi.me(token)
      login(token, user)
      toast({ kind: 'success', title: mode === 'login' ? '¡Bienvenido de nuevo!' : '¡Cuenta creada!' })
      navigate('/')
    } catch (err: unknown) {
      const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      setFieldError(detail ?? 'Ha ocurrido un error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-ink-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-card shadow-modal w-full max-w-[440px] p-8">
        <div className="text-center mb-8">
          <div className="text-3xl font-extrabold text-brand mb-2">ReMarket</div>
          <h1 className="text-2xl font-bold text-ink-900">
            {mode === 'login' ? 'Bienvenido de nuevo' : 'Crear cuenta'}
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'register' && (
            <>
              <Input
                label="Nombre completo"
                placeholder="Tu nombre"
                icon={<User size={16} strokeWidth={1.5} />}
                value={form.full_name}
                onChange={set('full_name')}
                required
              />
              <Input
                label="Username"
                placeholder="tu_usuario"
                icon={<User size={16} strokeWidth={1.5} />}
                value={form.username}
                onChange={set('username')}
                required
              />
            </>
          )}
          <Input
            label="Email"
            type="email"
            placeholder="tu@email.com"
            icon={<Mail size={16} strokeWidth={1.5} />}
            value={form.email}
            onChange={set('email')}
            error={mode === 'login' ? fieldError : undefined}
            required
          />
          <Input
            label="Contraseña"
            type={showPwd ? 'text' : 'password'}
            placeholder="••••••••"
            icon={<Lock size={16} strokeWidth={1.5} />}
            iconRight={
              <button type="button" onClick={() => setShowPwd((v) => !v)} tabIndex={-1}>
                {showPwd
                  ? <EyeOff size={16} strokeWidth={1.5} />
                  : <Eye size={16} strokeWidth={1.5} />}
              </button>
            }
            value={form.password}
            onChange={set('password')}
            error={mode === 'register' ? fieldError : undefined}
            required
          />

          <Button type="submit" className="w-full" size="lg" loading={loading}>
            {mode === 'login' ? 'Iniciar sesión' : 'Crear cuenta'}
          </Button>
        </form>

        <p className="text-center text-[13px] text-ink-600 mt-6">
          {mode === 'login' ? (
            <>
              ¿No tienes cuenta?{' '}
              <button onClick={() => { setMode('register'); setFieldError('') }} className="text-brand font-medium hover:underline">
                Regístrate
              </button>
            </>
          ) : (
            <>
              ¿Ya tienes cuenta?{' '}
              <button onClick={() => { setMode('login'); setFieldError('') }} className="text-brand font-medium hover:underline">
                Inicia sesión
              </button>
            </>
          )}
        </p>
      </div>
    </div>
  )
}
