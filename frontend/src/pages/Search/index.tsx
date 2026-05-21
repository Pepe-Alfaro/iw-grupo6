import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { SlidersHorizontal, X, ChevronDown, ChevronUp } from 'lucide-react'
import { Navbar } from '../../components/layout/Navbar'
import { BottomNav } from '../../components/layout/BottomNav'
import { ProductCard, SkeletonCard } from '../../components/ProductCard'
import { Button } from '../../components/ui/Button'
import { useProducts } from '../../hooks/useProducts'

const CATEGORIES = ['ropa', 'electrónica', 'hogar', 'deportes', 'libros', 'juguetes', 'belleza', 'motor']
const CONDITIONS = [
  { value: 'new', label: 'Nuevo' },
  { value: 'like_new', label: 'Como nuevo' },
  { value: 'good', label: 'Buen estado' },
  { value: 'used', label: 'Usado' },
]

function FilterGroup({ label, children, defaultOpen = true }: { label: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="border-b border-ink-200 pb-4 mb-4">
      <button onClick={() => setOpen((v) => !v)} className="flex items-center justify-between w-full text-[14px] font-semibold text-ink-900 mb-3">
        {label}
        {open ? <ChevronUp size={16} strokeWidth={1.5} /> : <ChevronDown size={16} strokeWidth={1.5} />}
      </button>
      {open && children}
    </div>
  )
}

export default function Search() {
  const [params, setParams] = useSearchParams()
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)

  // Sync filters from URL
  const [filters, setFilters] = useState({
    q: params.get('q') ?? '',
    category: params.get('category') ?? '',
    condition: params.get('condition') ?? '',
    sale_type: params.get('sale_type') ?? '',
    min_price: params.get('min_price') ? Number(params.get('min_price')) : undefined,
    max_price: params.get('max_price') ? Number(params.get('max_price')) : undefined,
    page: 1,
    size: 24,
  })

  useEffect(() => {
    const next = {
      q: params.get('q') ?? '',
      category: params.get('category') ?? '',
      condition: params.get('condition') ?? '',
      sale_type: params.get('sale_type') ?? '',
      min_price: params.get('min_price') ? Number(params.get('min_price')) : undefined,
      max_price: params.get('max_price') ? Number(params.get('max_price')) : undefined,
      page: Number(params.get('page') ?? '1'),
      size: 24,
    }
    setFilters(next)
  }, [params])

  const apiFilters = Object.fromEntries(
    Object.entries(filters).filter(([, v]) => v !== '' && v !== undefined)
  )
  const { data, loading } = useProducts(apiFilters)

  function applyFilters(updated: typeof filters) {
    setFilters(updated)
    const p = new URLSearchParams()
    if (updated.q) p.set('q', updated.q)
    if (updated.category) p.set('category', updated.category)
    if (updated.condition) p.set('condition', updated.condition)
    if (updated.sale_type) p.set('sale_type', updated.sale_type)
    if (updated.min_price) p.set('min_price', String(updated.min_price))
    if (updated.max_price) p.set('max_price', String(updated.max_price))
    p.set('page', '1')
    setParams(p)
    setMobileFiltersOpen(false)
  }

  function clear() {
    applyFilters({ q: '', category: '', condition: '', sale_type: '', min_price: undefined, max_price: undefined, page: 1, size: 24 })
  }

  const hasFilters = !!(filters.category || filters.condition || filters.sale_type || filters.min_price || filters.max_price)

  const FilterPanel = () => (
    <div className="space-y-0">
      <div className="flex items-center justify-between mb-5">
        <span className="text-[15px] font-bold text-ink-900">Filtros</span>
        {hasFilters && (
          <button onClick={clear} className="text-[12px] text-brand font-medium hover:underline">
            Limpiar todo
          </button>
        )}
      </div>

      <FilterGroup label="Categoría">
        <div className="space-y-2">
          {CATEGORIES.map((cat) => (
            <label key={cat} className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="category"
                checked={filters.category === cat}
                onChange={() => applyFilters({ ...filters, category: cat })}
                className="accent-brand"
              />
              <span className="text-[13px] text-ink-900 capitalize">{cat}</span>
            </label>
          ))}
          {filters.category && (
            <button onClick={() => applyFilters({ ...filters, category: '' })} className="text-[12px] text-brand flex items-center gap-1 mt-1">
              <X size={12} /> Quitar categoría
            </button>
          )}
        </div>
      </FilterGroup>

      <FilterGroup label="Estado">
        <div className="space-y-2">
          {CONDITIONS.map((c) => (
            <label key={c.value} className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="condition"
                checked={filters.condition === c.value}
                onChange={() => applyFilters({ ...filters, condition: c.value })}
                className="accent-brand"
              />
              <span className="text-[13px] text-ink-900">{c.label}</span>
            </label>
          ))}
          {filters.condition && (
            <button onClick={() => applyFilters({ ...filters, condition: '' })} className="text-[12px] text-brand flex items-center gap-1 mt-1">
              <X size={12} /> Quitar estado
            </button>
          )}
        </div>
      </FilterGroup>

      <FilterGroup label="Tipo de venta">
        {[
          { value: '', label: 'Todos' },
          { value: 'fixed', label: 'Precio fijo' },
          { value: 'auction', label: 'Subasta' },
        ].map((opt) => (
          <label key={opt.value} className="flex items-center gap-2 cursor-pointer mb-2">
            <input
              type="radio"
              name="sale_type"
              checked={filters.sale_type === opt.value}
              onChange={() => applyFilters({ ...filters, sale_type: opt.value })}
              className="accent-brand"
            />
            <span className="text-[13px] text-ink-900">{opt.label}</span>
          </label>
        ))}
      </FilterGroup>

      <FilterGroup label="Precio (€)" defaultOpen={false}>
        <div className="flex gap-2">
          <input
            type="number"
            placeholder="Mín"
            value={filters.min_price ?? ''}
            onChange={(e) => setFilters((f) => ({ ...f, min_price: e.target.value ? Number(e.target.value) : undefined }))}
            onBlur={() => applyFilters(filters)}
            className="w-full h-9 border border-ink-200 rounded-lg px-3 text-[13px] outline-none focus:border-brand"
          />
          <input
            type="number"
            placeholder="Máx"
            value={filters.max_price ?? ''}
            onChange={(e) => setFilters((f) => ({ ...f, max_price: e.target.value ? Number(e.target.value) : undefined }))}
            onBlur={() => applyFilters(filters)}
            className="w-full h-9 border border-ink-200 rounded-lg px-3 text-[13px] outline-none focus:border-brand"
          />
        </div>
      </FilterGroup>
    </div>
  )

  const total = data?.total ?? 0
  const pages = data?.pages ?? 1

  return (
    <div className="min-h-screen flex flex-col bg-ink-50">
      <div className="hidden md:block"><Navbar /></div>
      <div className="md:hidden"><Navbar mobile /></div>

      <main className="flex-1 max-w-[1280px] mx-auto w-full px-4 md:px-8 py-6">
        {/* Breadcrumb + count */}
        <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
          <div>
            <p className="text-[13px] text-ink-600">
              {loading ? 'Buscando…' : `${total} resultado${total !== 1 ? 's' : ''}${filters.q ? ` para "${filters.q}"` : ''}`}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* Mobile filter button */}
            <Button kind="outline" size="sm" icon={<SlidersHorizontal size={14} strokeWidth={1.5} />} onClick={() => setMobileFiltersOpen(true)} className="md:hidden">
              Filtrar {hasFilters && `(activos)`}
            </Button>
            <select
              className="h-9 border border-ink-200 rounded-lg px-3 text-[13px] text-ink-900 outline-none focus:border-brand bg-white"
              onChange={(e) => {
                const sort = e.target.value
                if (sort === 'auction') applyFilters({ ...filters, sale_type: 'auction' })
              }}
            >
              <option value="recent">Más recientes</option>
              <option value="price_asc">Precio: menor a mayor</option>
              <option value="price_desc">Precio: mayor a menor</option>
              <option value="auction">Subastas: menos tiempo</option>
            </select>
          </div>
        </div>

        <div className="flex gap-6">
          {/* Desktop sidebar */}
          <aside className="hidden md:block w-[260px] flex-none bg-white rounded-card border border-ink-200 p-5 self-start sticky top-20">
            <FilterPanel />
          </aside>

          {/* Grid */}
          <div className="flex-1">
            {loading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {Array.from({ length: 12 }).map((_, i) => <SkeletonCard key={i} />)}
              </div>
            ) : data?.items.length === 0 ? (
              <div className="text-center py-20">
                <div className="text-5xl mb-4">🔍</div>
                <p className="text-xl font-semibold text-ink-900 mb-1">Sin resultados</p>
                <p className="text-ink-600 text-sm mb-6">
                  {filters.q ? `No encontramos nada para "${filters.q}"` : 'No hay productos con estos filtros'}
                </p>
                <Button kind="outlineBrand" onClick={clear}>Limpiar filtros</Button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {data?.items.map((p) => (
                    <ProductCard key={p.id} product={p} wished={false} />
                  ))}
                </div>

                {/* Pagination */}
                {pages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-8">
                    <Button kind="outline" size="sm" disabled={filters.page <= 1} onClick={() => applyFilters({ ...filters, page: filters.page - 1 })}>
                      Anterior
                    </Button>
                    <span className="text-[13px] text-ink-600 px-3">
                      {filters.page} / {pages}
                    </span>
                    <Button kind="outline" size="sm" disabled={filters.page >= pages} onClick={() => applyFilters({ ...filters, page: filters.page + 1 })}>
                      Siguiente
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </main>

      {/* Mobile filter sheet */}
      {mobileFiltersOpen && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileFiltersOpen(false)} />
          <div className="relative bg-white rounded-t-2xl p-5 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <span className="font-bold text-ink-900">Filtros</span>
              <button onClick={() => setMobileFiltersOpen(false)}><X size={20} strokeWidth={1.5} /></button>
            </div>
            <FilterPanel />
            <Button className="w-full mt-4" onClick={() => setMobileFiltersOpen(false)}>Aplicar filtros</Button>
          </div>
        </div>
      )}

      <div className="md:hidden"><BottomNav /></div>
    </div>
  )
}
