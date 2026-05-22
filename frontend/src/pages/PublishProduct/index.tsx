import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Check, ChevronRight, ImagePlus, Trash2, AlertCircle, Loader2 } from 'lucide-react'
import { Navbar } from '../../components/layout/Navbar'
import { BottomNav } from '../../components/layout/BottomNav'
import { Button } from '../../components/ui/Button'
import { useToast } from '../../components/ui/Toast'
import { productsApi } from '../../api/productsApi'
import { useAuthStore } from '../../store/authStore'
import { conditionLabel } from '../../utils/format'

const CATEGORIES = ['ropa', 'electrónica', 'hogar', 'deportes', 'libros', 'juguetes', 'belleza', 'motor']
const CONDITIONS = ['new', 'like_new', 'good', 'used'] as const
const AUCTION_DURATIONS = [
  { label: '1 día', hours: 24 },
  { label: '3 días', hours: 72 },
  { label: '7 días', hours: 168 },
  { label: '14 días', hours: 336 },
]

// ─── Step indicator ──────────────────────────────────────────────────────────
function StepDots({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center justify-center gap-3 mb-8">
      {Array.from({ length: total }).map((_, i) => {
        const done = i < current
        const active = i === current
        return (
          <div key={i} className="flex items-center gap-3">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-[13px] font-bold transition-colors
                ${done ? 'bg-brand text-white' : active ? 'bg-brand text-white ring-4 ring-brand/20' : 'bg-ink-200 text-ink-600'}`}
            >
              {done ? <Check size={14} strokeWidth={2.5} /> : i + 1}
            </div>
            {i < total - 1 && (
              <div className={`w-10 h-0.5 rounded-full ${done ? 'bg-brand' : 'bg-ink-200'}`} />
            )}
          </div>
        )
      })}
    </div>
  )
}

// ─── Segmented control ───────────────────────────────────────────────────────
function Segmented<T extends string>({
  options, value, onChange,
}: { options: { value: T; label: string }[]; value: T; onChange: (v: T) => void }) {
  return (
    <div className="flex bg-ink-100 rounded-lg p-1 gap-1">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={`flex-1 py-2 rounded-md text-[13px] font-medium transition-all
            ${value === o.value ? 'bg-white text-ink-900 shadow-sm' : 'text-ink-600 hover:text-ink-900'}`}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

// ─── Form state ──────────────────────────────────────────────────────────────
interface FormState {
  title: string
  description: string
  condition: typeof CONDITIONS[number]
  categories: string[]
  sale_type: 'fixed' | 'auction'
  price: string
  auction_duration_hours: number
  image_urls: string[]
}

const INITIAL: FormState = {
  title: '',
  description: '',
  condition: 'good',
  categories: [],
  sale_type: 'fixed',
  price: '',
  auction_duration_hours: 168,
  image_urls: [''],
}

// ─── Step 1: item info ────────────────────────────────────────────────────────
function Step1({ form, setForm }: { form: FormState; setForm: React.Dispatch<React.SetStateAction<FormState>> }) {
  const toggleCat = (cat: string) =>
    setForm((f) => ({
      ...f,
      categories: f.categories.includes(cat)
        ? f.categories.filter((c) => c !== cat)
        : [...f.categories, cat],
    }))

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-[13px] font-semibold text-ink-900 mb-1.5">Título *</label>
        <input
          type="text"
          maxLength={80}
          placeholder="Ej. iPhone 14 Pro Max 256GB Negro"
          value={form.title}
          onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
          className="w-full h-11 border border-ink-200 rounded-lg px-4 text-[14px] text-ink-900 outline-none focus:border-brand transition-colors"
        />
        <p className="text-[11px] text-ink-400 mt-1 text-right">{form.title.length}/80</p>
      </div>

      <div>
        <label className="block text-[13px] font-semibold text-ink-900 mb-1.5">Descripción *</label>
        <textarea
          rows={4}
          maxLength={1200}
          placeholder="Describe el artículo: estado, detalles, motivo de venta…"
          value={form.description}
          onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          className="w-full border border-ink-200 rounded-lg px-4 py-3 text-[14px] text-ink-900 outline-none focus:border-brand transition-colors resize-none"
        />
        <p className="text-[11px] text-ink-400 mt-1 text-right">{form.description.length}/1200</p>
      </div>

      <div>
        <label className="block text-[13px] font-semibold text-ink-900 mb-2">Estado *</label>
        <Segmented
          options={CONDITIONS.map((c) => ({ value: c, label: conditionLabel(c) }))}
          value={form.condition}
          onChange={(v) => setForm((f) => ({ ...f, condition: v }))}
        />
      </div>

      <div>
        <label className="block text-[13px] font-semibold text-ink-900 mb-2">
          Categorías * <span className="font-normal text-ink-400">(elige al menos una)</span>
        </label>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((cat) => {
            const sel = form.categories.includes(cat)
            return (
              <button
                key={cat}
                type="button"
                onClick={() => toggleCat(cat)}
                className={`px-3 py-1.5 rounded-full text-[13px] font-medium border transition-all capitalize
                  ${sel ? 'bg-brand text-white border-brand' : 'bg-white text-ink-900 border-ink-200 hover:border-brand'}`}
              >
                {cat}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ─── Step 2: pricing ─────────────────────────────────────────────────────────
function Step2({ form, setForm }: { form: FormState; setForm: React.Dispatch<React.SetStateAction<FormState>> }) {
  return (
    <div className="space-y-6">
      <div>
        <label className="block text-[13px] font-semibold text-ink-900 mb-2">Tipo de venta *</label>
        <Segmented
          options={[
            { value: 'fixed' as const, label: 'Precio fijo' },
            { value: 'auction' as const, label: 'Subasta' },
          ]}
          value={form.sale_type}
          onChange={(v) => setForm((f) => ({ ...f, sale_type: v }))}
        />
      </div>

      <div>
        <label className="block text-[13px] font-semibold text-ink-900 mb-1.5">
          {form.sale_type === 'auction' ? 'Precio de salida (€) *' : 'Precio (€) *'}
        </label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-400 text-[14px] font-semibold select-none">€</span>
          <input
            type="number"
            min="0.01"
            step="0.01"
            placeholder="0.00"
            value={form.price}
            onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
            className="w-full h-11 border border-ink-200 rounded-lg pl-8 pr-4 text-[14px] text-ink-900 outline-none focus:border-brand transition-colors"
          />
        </div>
        {form.sale_type === 'fixed' && (
          <p className="text-[11px] text-ink-400 mt-1">IVA incluido. Recibirás el importe completo.</p>
        )}
      </div>

      {form.sale_type === 'auction' && (
        <div>
          <label className="block text-[13px] font-semibold text-ink-900 mb-2">Duración de la subasta *</label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {AUCTION_DURATIONS.map((d) => (
              <button
                key={d.hours}
                type="button"
                onClick={() => setForm((f) => ({ ...f, auction_duration_hours: d.hours }))}
                className={`py-3 rounded-lg text-[13px] font-medium border transition-all
                  ${form.auction_duration_hours === d.hours
                    ? 'bg-amber500 text-white border-amber500'
                    : 'bg-white text-ink-900 border-ink-200 hover:border-amber500'}`}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {form.sale_type === 'auction' && (
        <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
          <AlertCircle size={15} className="text-amber-600 mt-0.5 flex-none" strokeWidth={1.5} />
          <p className="text-[12px] text-amber-700">
            Las pujas son vinculantes. El ganador de la subasta está obligado a comprar el artículo.
          </p>
        </div>
      )}
    </div>
  )
}

// ─── Step 3: photos ───────────────────────────────────────────────────────────
function Step3({ form, setForm }: { form: FormState; setForm: React.Dispatch<React.SetStateAction<FormState>> }) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const toast = useToast()

  const removeImage = (i: number) =>
    setForm((f) => ({ ...f, image_urls: f.image_urls.filter((_, idx) => idx !== i) }))

  async function handleFiles(files: FileList | null) {
    if (!files) return
    const remaining = 5 - form.image_urls.length
    const toUpload = Array.from(files).slice(0, remaining)
    if (toUpload.length === 0) return

    setUploading(true)
    try {
      const urls: string[] = []
      for (const file of toUpload) {
        const { data } = await productsApi.uploadImage(file)
        urls.push(data.url)
      }
      setForm((f) => ({ ...f, image_urls: [...f.image_urls, ...urls] }))
    } catch {
      toast({ kind: 'error', title: 'Error al subir la imagen' })
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-4">
      <p className="text-[13px] text-ink-600">
        Sube las fotos de tu artículo (JPEG, PNG o WebP, máx. {5}MB). La primera será la portada.
      </p>

      {form.image_urls.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {form.image_urls.map((url, i) => (
            <div key={i} className="relative aspect-square rounded-lg overflow-hidden border border-ink-200 bg-ink-100">
              <img src={url} alt="" className="w-full h-full object-cover" />
              {i === 0 && (
                <span className="absolute top-1 left-1 bg-brand text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                  Portada
                </span>
              )}
              <button
                type="button"
                onClick={() => removeImage(i)}
                className="absolute top-1 right-1 w-6 h-6 bg-black/50 hover:bg-danger rounded-full flex items-center justify-center text-white transition-colors"
              >
                <Trash2 size={11} strokeWidth={2} />
              </button>
            </div>
          ))}
        </div>
      )}

      {form.image_urls.length < 5 && (
        <>
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp"
            multiple
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="w-full h-24 border-2 border-dashed border-ink-200 rounded-lg flex flex-col items-center justify-center gap-2 text-ink-400 hover:border-brand hover:text-brand transition-colors disabled:opacity-50"
          >
            {uploading ? (
              <Loader2 size={24} strokeWidth={1.5} className="animate-spin" />
            ) : (
              <ImagePlus size={24} strokeWidth={1.5} />
            )}
            <span className="text-[13px] font-medium">
              {uploading ? 'Subiendo…' : 'Haz clic o arrastra imágenes aquí'}
            </span>
          </button>
        </>
      )}
    </div>
  )
}

// ─── Review summary ───────────────────────────────────────────────────────────
function ReviewSummary({ form }: { form: FormState }) {
  const validImages = form.image_urls.filter(Boolean)
  return (
    <div className="space-y-4">
      <div className="flex gap-4">
        {validImages[0] ? (
          <img src={validImages[0]} alt="" className="w-24 h-24 rounded-card object-cover flex-none" />
        ) : (
          <div className="w-24 h-24 rounded-card bg-gradient-to-br from-brand-tint to-ink-100 flex items-center justify-center text-3xl flex-none">📦</div>
        )}
        <div>
          <h3 className="font-bold text-ink-900">{form.title}</h3>
          <p className="text-[12px] text-ink-600 mt-1 line-clamp-2">{form.description}</p>
          <div className="flex gap-2 flex-wrap mt-2">
            {form.categories.map((c) => (
              <span key={c} className="text-[11px] bg-brand-tint text-brand-dark px-2 py-0.5 rounded-full capitalize">{c}</span>
            ))}
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 text-[13px]">
        <div className="bg-ink-50 rounded-lg p-3">
          <p className="text-ink-400 text-[11px] mb-0.5">Estado</p>
          <p className="font-semibold text-ink-900">{conditionLabel(form.condition)}</p>
        </div>
        <div className="bg-ink-50 rounded-lg p-3">
          <p className="text-ink-400 text-[11px] mb-0.5">Tipo</p>
          <p className="font-semibold text-ink-900">{form.sale_type === 'fixed' ? 'Precio fijo' : 'Subasta'}</p>
        </div>
        <div className="bg-ink-50 rounded-lg p-3">
          <p className="text-ink-400 text-[11px] mb-0.5">{form.sale_type === 'auction' ? 'Precio de salida' : 'Precio'}</p>
          <p className="font-bold text-brand-dark text-[16px]">{form.price ? `${form.price} €` : '—'}</p>
        </div>
        {form.sale_type === 'auction' && (
          <div className="bg-ink-50 rounded-lg p-3">
            <p className="text-ink-400 text-[11px] mb-0.5">Duración</p>
            <p className="font-semibold text-ink-900">{AUCTION_DURATIONS.find((d) => d.hours === form.auction_duration_hours)?.label}</p>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function PublishProduct() {
  const navigate = useNavigate()
  const toast = useToast()
  const user = useAuthStore((s) => s.user)
  const [step, setStep] = useState(0)
  const [form, setForm] = useState<FormState>(INITIAL)
  const [loading, setLoading] = useState(false)

  const STEPS = ['El artículo', 'Precio', 'Fotos', 'Revisar']

  function validateStep(): string | null {
    if (step === 0) {
      if (!form.title.trim()) return 'El título es obligatorio'
      if (!form.description.trim()) return 'La descripción es obligatoria'
      if (form.categories.length === 0) return 'Elige al menos una categoría'
    }
    if (step === 1) {
      if (!form.price || isNaN(Number(form.price)) || Number(form.price) <= 0) return 'Introduce un precio válido'
    }
    return null
  }

  function next() {
    const err = validateStep()
    if (err) { toast({ kind: 'error', title: err }); return }
    setStep((s) => Math.min(s + 1, STEPS.length - 1))
  }

  function back() { setStep((s) => Math.max(s - 1, 0)) }

  async function publish() {
    if (!user) { navigate('/auth'); return }
    setLoading(true)
    try {
      const endsAt = form.sale_type === 'auction'
        ? new Date(Date.now() + form.auction_duration_hours * 3600_000).toISOString()
        : undefined

      const { data } = await productsApi.create({
        title: form.title.trim(),
        description: form.description.trim(),
        condition: form.condition,
        sale_type: form.sale_type,
        price: Number(form.price),
        categories: form.categories,
        image_urls: form.image_urls.filter(Boolean),
        ends_at: endsAt,
      })

      toast({ kind: 'success', title: '¡Anuncio publicado!', body: 'Tu producto ya es visible en el marketplace.' })
      navigate(`/products/${data.id}`)
    } catch (err: unknown) {
      const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      toast({ kind: 'error', title: detail ?? 'Error al publicar' })
    } finally {
      setLoading(false)
    }
  }

  const stepComponents = [
    <Step1 form={form} setForm={setForm} />,
    <Step2 form={form} setForm={setForm} />,
    <Step3 form={form} setForm={setForm} />,
    <ReviewSummary form={form} />,
  ]

  return (
    <div className="min-h-screen flex flex-col bg-ink-50">
      <div className="hidden md:block"><Navbar /></div>
      <div className="md:hidden"><Navbar mobile /></div>

      <main className="flex-1 max-w-[640px] mx-auto w-full px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-ink-900 text-center">Publicar anuncio</h1>
          <p className="text-[13px] text-ink-600 text-center mt-1">{STEPS[step]}</p>
        </div>

        <StepDots current={step} total={STEPS.length} />

        <div className="bg-white rounded-card border border-ink-200 p-6 shadow-card">
          {stepComponents[step]}
        </div>

        <div className="flex gap-3 mt-6">
          {step > 0 && (
            <Button kind="outline" className="flex-1" size="lg" onClick={back} disabled={loading}>
              Atrás
            </Button>
          )}
          {step < STEPS.length - 1 ? (
            <Button
              className="flex-1"
              size="lg"
              icon={<ChevronRight size={16} strokeWidth={2} />}
              onClick={next}
            >
              Siguiente
            </Button>
          ) : (
            <Button className="flex-1" size="lg" loading={loading} onClick={publish}>
              Publicar ahora
            </Button>
          )}
        </div>
      </main>

      <div className="md:hidden"><BottomNav /></div>
    </div>
  )
}
