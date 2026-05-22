import { Heart, MessageCircle, Bell, Plus, ChevronDown, Search, User, ShoppingBag, Settings, LogOut, Shield } from 'lucide-react'
import { useRef, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { Button } from '../ui/Button'

interface NavbarProps {
  mobile?: boolean
}

export function Navbar({ mobile = false }: NavbarProps) {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function handleLogout() {
    logout()
    setMenuOpen(false)
    navigate('/')
  }

  if (mobile) {
    return (
      <header className="sticky top-0 z-30 bg-white border-b border-ink-200">
        <div className="flex items-center gap-2 px-4 h-14">
          <button
            onClick={() => navigate('/')}
            className="font-extrabold text-brand text-[20px] tracking-tight"
          >
            ReMarket
          </button>
          <div className="flex-1 relative ml-2">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" strokeWidth={1.5} />
            <input
              placeholder="Buscar en ReMarket…"
              onFocus={() => navigate('/search')}
              className="w-full h-9 bg-ink-50 rounded-full pl-9 pr-3 text-[13px] outline-none border border-transparent focus:border-brand focus:bg-white"
            />
          </div>
          <button
            className="w-9 h-9 rounded-full flex items-center justify-center text-ink-900 hover:bg-ink-50"
            onClick={() => navigate('/wishlist')}
          >
            <Heart size={20} strokeWidth={1.5} />
          </button>
        </div>
      </header>
    )
  }

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-ink-200">
      <div className="flex items-center gap-6 px-6 h-16 max-w-[1280px] mx-auto">
        <button
          onClick={() => navigate('/')}
          className="font-extrabold text-brand text-[22px] tracking-tight flex-none"
        >
          ReMarket
        </button>

        <nav className="flex items-center gap-1">
          {['Ropa', 'Electrónica', 'Hogar', 'Deportes', 'Libros'].map((cat) => (
            <button
              key={cat}
              onClick={() => navigate(`/search?category=${cat.toLowerCase()}`)}
              className="px-3 h-9 inline-flex items-center text-[13px] text-ink-900 hover:text-brand-dark rounded-md hover:bg-ink-50 font-medium"
            >
              {cat}
            </button>
          ))}
          <button className="px-3 h-9 inline-flex items-center gap-1 text-[13px] text-ink-600 hover:text-brand-dark rounded-md hover:bg-ink-50 font-medium">
            Más <ChevronDown size={14} strokeWidth={1.5} />
          </button>
        </nav>

        <div className="flex-1 max-w-[560px] mx-2">
          <div className="relative">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-400" strokeWidth={1.5} />
            <input
              placeholder="Buscar en ReMarket…"
              onFocus={() => navigate('/search')}
              className="w-full h-11 bg-ink-50 rounded-full pl-11 pr-4 text-[14px] outline-none border border-transparent focus:border-brand focus:bg-white transition"
            />
          </div>
        </div>

        <div className="flex items-center gap-1">
          <IconBtn icon={<Heart size={20} strokeWidth={1.5} />} onClick={() => navigate('/wishlist')} />
          <IconBtn icon={<MessageCircle size={20} strokeWidth={1.5} />} onClick={() => navigate('/messages')} />
          <IconBtn icon={<Bell size={20} strokeWidth={1.5} />} />
          <div className="ml-2">
            <Button icon={<Plus size={16} strokeWidth={1.5} />} onClick={() => navigate('/publish')}>
              Publicar
            </Button>
          </div>
          {!user && (
            <button
              onClick={() => navigate('/auth')}
              className="ml-2 h-9 px-4 rounded-full border border-ink-200 text-[13px] font-medium text-ink-900 hover:bg-ink-50 transition-colors"
            >
              Iniciar sesión
            </button>
          )}
          {user && (
            <div className="relative ml-2" ref={menuRef}>
              <button
                onClick={() => setMenuOpen((v) => !v)}
                className="inline-flex items-center gap-1.5 pl-1 pr-2 h-10 rounded-full hover:bg-ink-50"
              >
                <span className="w-8 h-8 rounded-full bg-brand text-white text-[13px] font-semibold flex items-center justify-center">
                  {user.full_name[0].toUpperCase()}
                </span>
                <ChevronDown
                  size={14}
                  className={`text-ink-600 transition-transform duration-200 ${menuOpen ? 'rotate-180' : ''}`}
                  strokeWidth={1.5}
                />
              </button>

              {menuOpen && (
                <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-card shadow-modal border border-ink-200 py-1 z-50 fade-in">
                  <div className="px-3 py-2 border-b border-ink-200">
                    <p className="text-[13px] font-semibold text-ink-900 truncate">{user.full_name}</p>
                    <p className="text-[11px] text-ink-600 truncate">{user.email}</p>
                  </div>

                  <DropdownItem
                    icon={<User size={15} strokeWidth={1.5} />}
                    label="Mi cuenta"
                    onClick={() => { navigate('/profile/me'); setMenuOpen(false) }}
                  />
                  <DropdownItem
                    icon={<ShoppingBag size={15} strokeWidth={1.5} />}
                    label="Mis pedidos"
                    onClick={() => { navigate('/profile/me?tab=orders'); setMenuOpen(false) }}
                  />
                  <DropdownItem
                    icon={<Heart size={15} strokeWidth={1.5} />}
                    label="Mi wishlist"
                    onClick={() => { navigate('/wishlist'); setMenuOpen(false) }}
                  />
                  <DropdownItem
                    icon={<Settings size={15} strokeWidth={1.5} />}
                    label="Ajustes"
                    onClick={() => { navigate('/profile/me?tab=settings'); setMenuOpen(false) }}
                  />
                  {user.role === 'moderator' && (
                    <DropdownItem
                      icon={<Shield size={15} strokeWidth={1.5} />}
                      label="Panel moderador"
                      onClick={() => { navigate('/moderation'); setMenuOpen(false) }}
                    />
                  )}
                  <div className="border-t border-ink-200 mt-1 pt-1">
                    <DropdownItem
                      icon={<LogOut size={15} strokeWidth={1.5} />}
                      label="Cerrar sesión"
                      danger
                      onClick={handleLogout}
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

function DropdownItem({
  icon,
  label,
  onClick,
  danger = false,
}: {
  icon: React.ReactNode
  label: string
  onClick: () => void
  danger?: boolean
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-2.5 px-3 py-2 text-[13px] font-medium transition-colors ${
        danger
          ? 'text-danger hover:bg-red-50'
          : 'text-ink-900 hover:bg-ink-50'
      }`}
    >
      <span className={danger ? 'text-danger' : 'text-ink-600'}>{icon}</span>
      {label}
    </button>
  )
}

function IconBtn({ icon, onClick }: { icon: React.ReactNode; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-10 h-10 rounded-full flex items-center justify-center text-ink-900 hover:bg-ink-50"
    >
      {icon}
    </button>
  )
}
