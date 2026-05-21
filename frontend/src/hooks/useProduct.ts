import { useEffect, useState } from 'react'
import { productsApi } from '../api/productsApi'
import type { Product } from '../types'

export function useProduct(id: number) {
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    productsApi
      .get(id)
      .then((r) => { if (!cancelled) setProduct(r.data) })
      .catch(() => { if (!cancelled) setError('Producto no encontrado') })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [id])

  return { product, loading, error, setProduct }
}
