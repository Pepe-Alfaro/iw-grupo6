import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertTriangle, List, CheckCircle, XCircle, Trash2, Flag } from 'lucide-react'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { useToast } from '../../components/ui/Toast'
import { useAuthStore } from '../../store/authStore'
import { fmtPrice, fmtDate } from '../../utils/format'
import { moderationApi } from '../../api/moderationApi'
import type { PriceAlert, ModerationProduct, ProductReport } from '../../api/moderationApi'

type AlertItem = PriceAlert
type ProductRow = ModerationProduct
type ReportItem = ProductReport

type View = 'alerts' | 'products' | 'reports'

const STATUS_TONE: Record<string, 'amber' | 'success' | 'danger' | 'neutral' | 'amberSoft'> = {
  active: 'success',
  pending_review: 'amberSoft',
  sold: 'neutral',
  removed: 'danger',
}

export default function Moderation() {
  const navigate = useNavigate()
  const toast = useToast()
  const { user, logout } = useAuthStore((s) => ({ user: s.user, logout: s.logout }))
  const [view, setView] = useState<View>('alerts')
  const [alerts, setAlerts] = useState<AlertItem[]>([])
  const [products, setProducts] = useState<ProductRow[]>([])
  const [reports, setReports] = useState<ReportItem[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setLoading(true)
    if (view === 'alerts') {
      moderationApi.listAlerts()
        .then((r) => setAlerts(r.data))
        .catch(() => null)
        .finally(() => setLoading(false))
    } else if (view === 'products') {
      moderationApi.listProducts()
        .then((r) => setProducts(r.data))
        .catch(() => null)
        .finally(() => setLoading(false))
    } else {
      moderationApi.listReports()
        .then((r) => setReports(r.data))
        .catch(() => null)
        .finally(() => setLoading(false))
    }
  }, [view])

  async function resolveAlert(id: number, resolution: 'approved' | 'rejected') {
    try {
      await moderationApi.resolveAlert(id, resolution)
      setAlerts((prev) => prev.filter((a) => a.id !== id))
      toast({ kind: 'success', title: resolution === 'approved' ? 'Anuncio aprobado' : 'Anuncio rechazado' })
    } catch {
      toast({ kind: 'error', title: 'Error al procesar la alerta' })
    }
  }

  async function deleteProduct(id: number) {
    try {
      await moderationApi.deleteProduct(id)
      setProducts((prev) => prev.map((p) => p.id === id ? { ...p, status: 'removed' } : p))
      toast({ kind: 'success', title: 'Producto eliminado' })
    } catch {
      toast({ kind: 'error', title: 'Error al eliminar' })
    }
  }

  async function dismissReport(id: number) {
    try {
      await moderationApi.reviewReport(id)
      setReports((prev) => prev.filter((r) => r.id !== id))
      toast({ kind: 'success', title: 'Denuncia marcada como revisada' })
    } catch {
      toast({ kind: 'error', title: 'Error al procesar la denuncia' })
    }
  }

  const NAV = [
    { id: 'alerts' as View, label: 'Alertas de precio', icon: AlertTriangle, count: alerts.length },
    { id: 'reports' as View, label: 'Denuncias', icon: Flag, count: reports.length },
    { id: 'products' as View, label: 'Todos los anuncios', icon: List, count: null },
  ]

  return (
    <div className="flex h-screen bg-white overflow-hidden">
      {/* Dark sidebar */}
      <nav className="w-60 bg-ink-900 text-white flex flex-col flex-none">
        <div className="px-6 py-5 border-b border-white/10">
          <button onClick={() => navigate('/')} className="text-[20px] font-extrabold text-brand">
            ReMarket
          </button>
          <p className="text-[11px] text-white/40 mt-0.5">Panel de moderación</p>
        </div>
        <div className="flex-1 px-3 py-4 space-y-1">
          {NAV.map((item) => {
            const Icon = item.icon
            const active = view === item.id
            return (
              <button
                key={item.id}
                onClick={() => setView(item.id)}
                className={`w-full text-left px-4 py-2.5 rounded-lg text-[14px] font-medium flex items-center gap-2.5 transition
                  ${active ? 'bg-brand text-white' : 'text-white/70 hover:text-white hover:bg-white/10'}`}
              >
                <Icon size={15} strokeWidth={1.5} />
                <span className="flex-1">{item.label}</span>
                {item.count !== null && item.count > 0 && (
                  <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded-full ${active ? 'bg-white/20' : 'bg-danger text-white'}`}>
                    {item.count}
                  </span>
                )}
              </button>
            )
          })}
        </div>
        <div className="px-3 pb-5 border-t border-white/10 pt-3">
          {user && (
            <div className="px-4 py-2 mb-2">
              <p className="text-[12px] text-white font-medium">{user.full_name}</p>
              <p className="text-[11px] text-white/40">@{user.username}</p>
            </div>
          )}
          <button
            onClick={() => { logout(); navigate('/') }}
            className="w-full text-left px-4 py-2.5 rounded-lg text-[13px] font-medium text-white/50 hover:text-white hover:bg-white/10 transition"
          >
            Cerrar sesión
          </button>
        </div>
      </nav>

      {/* Main area */}
      <main className="flex-1 overflow-auto bg-ink-50">
        <div className="max-w-[1080px] mx-auto p-8">
          {/* ── Alerts view ── */}
          {view === 'alerts' && (
            <>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h1 className="text-2xl font-bold text-ink-900">Alertas de precio</h1>
                  <p className="text-[13px] text-ink-600 mt-0.5">
                    Anuncios cuyo precio supera significativamente la mediana de la categoría
                  </p>
                </div>
              </div>

              {loading ? (
                <div className="space-y-3">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="skeleton h-28 rounded-card" />
                  ))}
                </div>
              ) : alerts.length === 0 ? (
                <div className="text-center py-20">
                  <CheckCircle size={56} strokeWidth={1} className="mx-auto text-success mb-4" />
                  <p className="text-xl font-semibold text-ink-900">Sin alertas pendientes</p>
                  <p className="text-ink-600 text-sm mt-1">Todo está en orden</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {alerts.map((alert) => {
                    const p = alert.product
                    return (
                      <div key={alert.id} className="bg-white rounded-card border border-ink-200 p-5 flex gap-4 shadow-card">
                        {p?.main_image_url ? (
                          <img src={p.main_image_url} alt="" className="w-20 h-20 rounded-lg object-cover flex-none" />
                        ) : (
                          <div className="w-20 h-20 rounded-lg bg-ink-100 flex items-center justify-center text-3xl flex-none">📦</div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start gap-3 flex-wrap">
                            <div className="flex-1 min-w-0">
                              <p
                                className="font-semibold text-ink-900 truncate cursor-pointer hover:text-brand"
                                onClick={() => navigate(`/products/${p?.id}`)}
                              >
                                {p?.title ?? `Producto #${alert.product_id}`}
                              </p>
                              <p className="text-[12px] text-ink-600 mt-0.5">
                                @{p?.seller_username ?? '—'} · {p?.categories.join(', ')}
                              </p>
                            </div>
                            <div className="text-right flex-none">
                              <p className="text-[20px] font-bold text-ink-900">{p ? fmtPrice(p.price) : '—'}</p>
                              <Badge tone="amberSoft">+{alert.deviation_pct}% vs mediana</Badge>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 mt-3">
                            <Button
                              kind="success"
                              size="sm"
                              icon={<CheckCircle size={13} strokeWidth={2} />}
                              onClick={() => resolveAlert(alert.id, 'approved')}
                            >
                              Aprobar
                            </Button>
                            <Button
                              kind="danger"
                              size="sm"
                              icon={<XCircle size={13} strokeWidth={2} />}
                              onClick={() => resolveAlert(alert.id, 'rejected')}
                            >
                              Rechazar
                            </Button>
                            <span className="text-[11px] text-ink-400 ml-2">{fmtDate(alert.created_at)}</span>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </>
          )}

          {/* ── Reports view ── */}
          {view === 'reports' && (
            <>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h1 className="text-2xl font-bold text-ink-900">Denuncias de usuarios</h1>
                  <p className="text-[13px] text-ink-600 mt-0.5">Denuncias pendientes de revisar</p>
                </div>
              </div>

              {loading ? (
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="skeleton h-24 rounded-card" />
                  ))}
                </div>
              ) : reports.length === 0 ? (
                <div className="text-center py-20">
                  <CheckCircle size={56} strokeWidth={1} className="mx-auto text-success mb-4" />
                  <p className="text-xl font-semibold text-ink-900">Sin denuncias pendientes</p>
                  <p className="text-ink-600 text-sm mt-1">Todo está en orden</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {reports.map((r) => (
                    <div key={r.id} className="bg-white rounded-card border border-ink-200 p-5 shadow-card">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <Flag size={13} strokeWidth={1.5} className="text-danger flex-none" />
                            <button
                              className="font-semibold text-ink-900 hover:text-brand truncate text-left text-[14px]"
                              onClick={() => navigate(`/products/${r.product_id}`)}
                            >
                              {r.product_title ?? `Producto #${r.product_id}`}
                            </button>
                          </div>
                          <p className="text-[13px] text-ink-600">
                            <span className="font-medium text-ink-900">{r.reason}</span>
                            {r.comment && <span className="text-ink-400"> — {r.comment}</span>}
                          </p>
                          <p className="text-[12px] text-ink-400 mt-1">
                            Denunciado por @{r.reporter_username ?? '—'} · {fmtDate(r.created_at)}
                          </p>
                        </div>
                        <div className="flex gap-2 flex-none">
                          <Button
                            kind="outlineBrand"
                            size="sm"
                            onClick={() => navigate(`/products/${r.product_id}`)}
                          >
                            Ver anuncio
                          </Button>
                          <Button
                            kind="ghost"
                            size="sm"
                            icon={<CheckCircle size={13} strokeWidth={2} />}
                            onClick={() => dismissReport(r.id)}
                          >
                            Revisado
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* ── Products view ── */}
          {view === 'products' && (
            <>
              <div className="mb-6">
                <h1 className="text-2xl font-bold text-ink-900">Todos los anuncios</h1>
                <p className="text-[13px] text-ink-600 mt-0.5">{products.length} anuncios en total</p>
              </div>

              {loading ? (
                <div className="skeleton h-96 rounded-card" />
              ) : (
                <div className="bg-white rounded-card border border-ink-200 overflow-hidden shadow-card">
                  <table className="w-full text-[13px]">
                    <thead>
                      <tr className="border-b border-ink-200 bg-ink-50">
                        <th className="text-left px-5 py-3 font-semibold text-ink-600">Producto</th>
                        <th className="text-left px-4 py-3 font-semibold text-ink-600">Vendedor</th>
                        <th className="text-left px-4 py-3 font-semibold text-ink-600">Precio</th>
                        <th className="text-left px-4 py-3 font-semibold text-ink-600">Estado</th>
                        <th className="text-left px-4 py-3 font-semibold text-ink-600">Fecha</th>
                        <th className="px-4 py-3" />
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-ink-100">
                      {products.map((p) => (
                        <tr key={p.id} className="hover:bg-ink-50 transition-colors">
                          <td className="px-5 py-3">
                            <button
                              className="text-ink-900 font-medium hover:text-brand text-left max-w-[260px] truncate block"
                              onClick={() => navigate(`/products/${p.id}`)}
                            >
                              {p.title}
                            </button>
                          </td>
                          <td className="px-4 py-3 text-ink-600">@{p.seller_username ?? '—'}</td>
                          <td className="px-4 py-3 font-semibold text-ink-900">{fmtPrice(p.price)}</td>
                          <td className="px-4 py-3">
                            <Badge tone={STATUS_TONE[p.status] ?? 'neutral'} className="capitalize">
                              {p.status === 'pending_review' ? 'Revisión' : p.status}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-ink-400">{fmtDate(p.created_at)}</td>
                          <td className="px-4 py-3">
                            {p.status !== 'removed' && (
                              <button
                                onClick={() => deleteProduct(p.id)}
                                className="w-7 h-7 flex items-center justify-center rounded-lg text-ink-400 hover:text-danger hover:bg-rose-50 transition"
                              >
                                <Trash2 size={14} strokeWidth={1.5} />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  )
}
