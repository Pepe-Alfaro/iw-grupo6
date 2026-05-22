export function fmtPrice(amount: number | string): string {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(Number(amount))
}

export function fmtDate(iso: string): string {
  const normalized = /[-Z+]\d*$/.test(iso) ? iso : iso + 'Z'
  return new Intl.DateTimeFormat('es-ES', { dateStyle: 'medium' }).format(new Date(normalized))
}

export function fmtRelative(iso: string): string {
  const normalized = /[-Z+]\d*$/.test(iso) ? iso : iso + 'Z'
  const diff = Date.now() - new Date(normalized).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'ahora'
  if (mins < 60) return `hace ${mins}m`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `hace ${hours}h`
  return `hace ${Math.floor(hours / 24)}d`
}

export function conditionLabel(cond: string): string {
  const map: Record<string, string> = {
    new: 'Nuevo',
    like_new: 'Como nuevo',
    good: 'Buen estado',
    used: 'Usado',
  }
  return map[cond] ?? cond
}
