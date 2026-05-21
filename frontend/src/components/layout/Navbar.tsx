import { Heart, MessageCircle, Bell, Plus, ChevronDown, Search } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { Button } from '../ui/Button'

interface NavbarProps {
  mobile?: boolean
}

export function Navbar({ mobile = false }: NavbarProps) {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)

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
          {user && (
            <button
              onClick={() => navigate('/profile/me')}
              className="ml-2 inline-flex items-center gap-1.5 pl-1 pr-2 h-10 rounded-full hover:bg-ink-50"
            >
              <span className="w-8 h-8 rounded-full bg-brand text-white text-[13px] font-semibold flex items-center justify-center">
                {user.full_name[0].toUpperCase()}
              </span>
              <ChevronDown size={14} className="text-ink-600" strokeWidth={1.5} />
            </button>
          )}
        </div>
      </div>
    </header>
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
