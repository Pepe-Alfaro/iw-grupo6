import { useEffect, useState } from 'react'
import { productsApi, type ProductFilters } from '../api/productsApi'
import type { Paginated, Product } from '../types'

export function useProducts(filters: ProductFilters = {}) {
  const [data, setData] = useState<Paginated<Product> | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const key = JSON.stringify(filters)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    productsApi
      .list(filters)
      .then((r) => { if (!cancelled) setData(r.data) })
      .catch(() => { if (!cancelled) setError('Error al cargar productos') })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  return { data, loading, error }
}
