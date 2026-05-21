import client from './client'
import type { Auction, Bid } from '../types'

export const auctionsApi = {
  get: (productId: number) => client.get<Auction>(`/auctions/${productId}`),

  bid: (productId: number, amount: number) =>
    client.post<Bid>(`/auctions/${productId}/bid`, { amount: amount.toString() }),
}
