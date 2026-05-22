import { useCallback, useEffect, useState } from 'react'
import { wishlistApi } from '../api/wishlistApi'
import { useAuthStore } from '../store/authStore'

export function useWishlistIds() {
  const user = useAuthStore((s) => s.user)
  const [ids, setIds] = useState<Set<number>>(new Set())

  useEffect(() => {
    if (!user) { setIds(new Set()); return }
    wishlistApi.list().then(({ data }) => {
      setIds(new Set(data.filter((i) => i.product_id != null).map((i) => i.product_id as number)))
    }).catch(() => null)
  }, [user])

  const toggle = useCallback(async (productId: number) => {
    if (!user) return
    if (ids.has(productId)) {
      const { data } = await wishlistApi.list()
      const item = data.find((i) => i.product_id === productId)
      if (item) await wishlistApi.remove(item.id)
      setIds((prev) => { const s = new Set(prev); s.delete(productId); return s })
    } else {
      await wishlistApi.add(productId)
      setIds((prev) => new Set(prev).add(productId))
    }
  }, [user, ids])

  return { ids, toggle }
}
