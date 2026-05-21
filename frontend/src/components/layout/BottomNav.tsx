import { Home, Search, Plus, MessageCircle, User } from 'lucide-react'
import { useNavigate, useLocation } from 'react-router-dom'

const ITEMS = [
  { id: 'home', path: '/', icon: Home, label: 'Inicio' },
  { id: 'search', path: '/search', icon: Search, label: 'Buscar' },
  { id: 'publish', path: '/publish', icon: Plus, label: 'Publicar', big: true },
  { id: 'messages', path: '/messages', icon: MessageCircle, label: 'Mensajes' },
  { id: 'profile', path: '/profile/me', icon: User, label: 'Perfil' },
]

export function BottomNav() {
  const navigate = useNavigate()
  const { pathname } = useLocation()

  return (
    <nav className="sticky bottom-0 z-30 bg-white border-t border-ink-200 px-1 pt-1 pb-2">
      <div className="flex items-center justify-around">
        {ITEMS.map(({ id, path, icon: Icon, label, big }) => {
          const active = pathname === path || (path !== '/' && pathname.startsWith(path))
          if (big) {
            return (
              <button key={id} onClick={() => navigate(path)} className="-mt-5">
                <span className="w-12 h-12 rounded-full bg-brand text-white shadow-md flex items-center justify-center">
                  <Icon size={22} strokeWidth={2} />
                </span>
                <div className="text-[10px] mt-0.5 text-ink-600 font-medium text-center">{label}</div>
              </button>
            )
          }
          return (
            <button
              key={id}
              onClick={() => navigate(path)}
              className={`flex flex-col items-center w-16 py-1 ${active ? 'text-brand' : 'text-ink-600'}`}
            >
              <Icon size={20} strokeWidth={active ? 2 : 1.5} />
              <span className="text-[10px] font-medium mt-0.5">{label}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
