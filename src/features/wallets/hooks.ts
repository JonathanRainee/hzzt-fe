import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/shared/api/client'
import { invalidateMoney } from '@/shared/api/invalidate'
import { STATIC_STALE_TIME } from '@/shared/api/queryClient'
import { queryKeys } from '@/shared/api/queryKeys'
import type { components } from '@/shared/api/schema'
import { toMoneyString } from '@/shared/money'
import { type Period, periodToApiQuery } from '@/shared/period'

export type WalletDTO = components['schemas']['wallets.WalletDTO']
type Warning = components['schemas']['currency.Warning']

export interface WalletList {
  items: WalletDTO[]
  total: { amount: string; currency: string; warnings: Warning[] }
}

/** Favourites first, then the user's own order. Stable for equal keys. */
export function sortWallets(items: readonly WalletDTO[]): WalletDTO[] {
  return [...items].sort((a, b) => {
    if (Boolean(a.isFavorite) !== Boolean(b.isFavorite)) return a.isFavorite ? -1 : 1
    return (a.sortOrder ?? 0) - (b.sortOrder ?? 0)
  })
}

/** Returns a copy of `list` with the item at `from` moved to `to` (clamped). */
export function moveItem<T>(list: readonly T[], from: number, to: number): T[] {
  const next = [...list]
  const target = Math.max(0, Math.min(next.length - 1, to))
  const [item] = next.splice(from, 1)
  if (item === undefined) return next
  next.splice(target, 0, item)
  return next
}

export function useWallets(spaceId: string) {
  return useQuery({
    queryKey: queryKeys.space(spaceId).wallets(),
    refetchOnWindowFocus: true, // money screen
    queryFn: async (): Promise<WalletList> => {
      const { data } = await api.GET('/spaces/{spaceId}/wallets', { params: { path: { spaceId } } })
      return {
        items: sortWallets(data?.items ?? []),
        total: {
          amount: toMoneyString(data?.total?.total),
          currency: data?.total?.currency ?? '',
          warnings: data?.total?.warnings ?? [],
        },
      }
    },
  })
}

export function useWallet(spaceId: string, id: string) {
  return useQuery({
    queryKey: queryKeys.space(spaceId).wallet(id),
    refetchOnWindowFocus: true,
    queryFn: async () =>
      (await api.GET('/spaces/{spaceId}/wallets/{id}', { params: { path: { spaceId, id } } })).data,
  })
}

const PAGE_SIZE = 30

/** The wallet's transactions for a period, with the backend's cursor pagination. */
export function useWalletTransactions(
  spaceId: string,
  walletId: string,
  period: Period,
  limit = PAGE_SIZE,
) {
  return useInfiniteQuery({
    queryKey: queryKeys.space(spaceId).transactions({ walletId, period, limit }),
    refetchOnWindowFocus: true,
    initialPageParam: undefined as string | undefined,
    queryFn: async ({ pageParam }) => {
      const { data } = await api.GET('/spaces/{spaceId}/transactions', {
        params: {
          path: { spaceId },
          query: { walletIds: [walletId], ...periodToApiQuery(period), limit, cursor: pageParam },
        },
      })
      return { items: data?.items ?? [], nextCursor: data?.nextCursor || undefined }
    },
    getNextPageParam: (last) => last.nextCursor,
  })
}

export function useCardPresets() {
  return useQuery({
    queryKey: queryKeys.walletCardPresets(),
    staleTime: STATIC_STALE_TIME,
    queryFn: async () => (await api.GET('/wallet-card-presets')).data ?? [],
  })
}

export function useCardTemplates() {
  return useQuery({
    queryKey: queryKeys.walletCardTemplates(),
    staleTime: STATIC_STALE_TIME,
    queryFn: async () => (await api.GET('/wallet-card-templates')).data ?? [],
  })
}

/** Optimistic reorder: the list reorders at once, and snaps back if the server refuses. */
export function useReorderWallets(spaceId: string) {
  const queryClient = useQueryClient()
  const key = queryKeys.space(spaceId).wallets()
  return useMutation({
    mutationFn: async (ids: string[]) =>
      api.PUT('/spaces/{spaceId}/wallets/order', { params: { path: { spaceId } }, body: { ids } }),
    onMutate: async (ids) => {
      await queryClient.cancelQueries({ queryKey: key })
      const previous = queryClient.getQueryData<WalletList>(key)
      if (previous) {
        const byId = new Map(previous.items.map((w) => [w.id, w]))
        const items = ids.map((id) => byId.get(id)).filter((w): w is WalletDTO => Boolean(w))
        queryClient.setQueryData<WalletList>(key, { ...previous, items })
      }
      return { previous }
    },
    onError: (_e, _ids, ctx) => {
      if (ctx?.previous) queryClient.setQueryData(key, ctx.previous)
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: key }),
  })
}

/** Run after any mutation that changes balances. */
export function useInvalidateMoney(spaceId: string) {
  const queryClient = useQueryClient()
  return () => invalidateMoney(queryClient, spaceId)
}
