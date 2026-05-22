import { useNavigate } from 'react-router-dom'
import { Search, Shirt, Smartphone, Sofa, Trophy, BookOpen, Puzzle, Sparkles, Car } from 'lucide-react'
import { Navbar } from '../../components/layout/Navbar'
import { BottomNav } from '../../components/layout/BottomNav'
import { ProductCard, SkeletonCard } from '../../components/ProductCard'
import { useProducts } from '../../hooks/useProducts'
import { useAuthStore } from '../../store/authStore'
import type { LucideIcon } from 'lucide-react'

const CATEGORIES: { id: string; label: string; Icon: LucideIcon }[] = [
  { id: 'ropa', label: 'Ropa', Icon: Shirt },
  { id: 'electrónica', label: 'Electrónica', Icon: Smartphone },
  { id: 'hogar', label: 'Hogar', Icon: Sofa },
  { id: 'deportes', label: 'Deportes', Icon: Trophy },
  { id: 'libros', label: 'Libros', Icon: BookOpen },
  { id: 'juguetes', label: 'Juguetes', Icon: Puzzle },
  { id: 'belleza', label: 'Belleza', Icon: Sparkles },
  { id: 'motor', label: 'Motor', Icon: Car },
]

function ProductGrid({ title, link, filters }: { title: string; link?: string; filters: object }) {
  const navigate = useNavigate()
  const { data, loading } = useProducts(filters)
  const wishlist = useAuthStore((s) => s.user)

  return (
    <section className="max-w-[1280px] mx-auto px-4 md:px-8 py-8">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-xl font-bold text-ink-900">{title}</h2>
        {link && (
          <button onClick={() => navigate(link)} className="text-[13px] text-brand font-medium hover:underline">
            Ver todos
          </button>
        )}
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {loading
          ? Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)
          : data?.items.length === 0
          ? <p className="col-span-full text-ink-600 text-sm py-8 text-center">No hay productos todavía</p>
          : data?.items.map((p) => (
              <ProductCard
                key={p.id}
                product={p}
                wished={false}
                onToggleWish={() => !wishlist && navigate('/auth')}
              />
            ))}
      </div>
    </section>
  )
}

export default function Home() {
  const navigate = useNavigate()

  function handleSearch(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const q = new FormData(e.currentTarget).get('q') as string
    if (q.trim()) navigate(`/search?q=${encodeURIComponent(q)}`)
  }

  return (
    <div className="min-h-screen flex flex-col bg-ink-50">
      <div className="hidden md:block"><Navbar /></div>
      <div className="md:hidden"><Navbar mobile /></div>

      <main className="flex-1">
        {/* Hero */}
        <section className="bg-gradient-to-br from-brand to-brand-dark py-16 px-4">
          <div className="max-w-2xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-3">
              Compra y vende lo que ya no usas
            </h1>
            <p className="text-[18px] text-white/80 mb-8">
              El mercado de segunda mano más humano de España
            </p>
            <form onSubmit={handleSearch} className="flex bg-white rounded-full shadow-lg overflow-hidden max-w-xl mx-auto">
              <Search size={20} className="absolute ml-5 mt-4 text-ink-400 pointer-events-none hidden md:block" strokeWidth={1.5} />
              <input
                name="q"
                className="flex-1 h-14 px-6 md:pl-12 text-ink-900 text-[15px] outline-none"
                placeholder="Buscar en ReMarket…"
              />
              <button type="submit" className="h-14 px-8 bg-brand-dark text-white font-semibold hover:brightness-95 transition">
                Buscar
              </button>
            </form>

            {/* Category chips */}
            <div className="flex gap-2 mt-6 overflow-x-auto scrollbar-hide justify-center flex-wrap">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => navigate(`/search?category=${cat.id}`)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white/20 hover:bg-white/30 text-white text-[13px] font-medium transition flex-none"
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>
        </section>

        <ProductGrid
          title="Últimas publicaciones"
          link="/search"
          filters={{ size: 8 }}
        />

        <ProductGrid
          title="Subastas activas"
          link="/search?sale_type=auction"
          filters={{ sale_type: 'auction', size: 4 }}
        />

        {/* Featured categories */}
        <section className="max-w-[1280px] mx-auto px-4 md:px-8 py-8">
          <h2 className="text-xl font-bold text-ink-900 mb-5">Categorías destacadas</h2>
          <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => navigate(`/search?category=${cat.id}`)}
                className="flex-none flex flex-col items-center justify-center gap-2 w-28 h-24 rounded-card bg-brand-tint hover:bg-brand-tint2 transition border border-brand/10"
              >
                <cat.Icon size={24} className="text-brand" strokeWidth={1.5} />
                <span className="text-[12px] font-semibold text-brand-dark">{cat.label}</span>
              </button>
            ))}
          </div>
        </section>
      </main>

      {/* Footer (desktop) */}
      <footer className="hidden md:block border-t border-ink-200 bg-white py-8 px-8 text-center text-[12px] text-ink-600">
        © 2026 ReMarket S.L. · Madrid, España · Hecho con cuidado para revender mejor.
      </footer>

      <div className="md:hidden"><BottomNav /></div>
    </div>
  )
}
