import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/shared/api/client'
import { invalidateMoney } from '@/shared/api/invalidate'
import { queryKeys } from '@/shared/api/queryKeys'
import type { components } from '@/shared/api/schema'
import { toMoneyString } from '@/shared/money'
import type { AssetKind } from './kinds'

type S = components['schemas']
export type AssetDTO = S['manualassets.AssetDTO']
type Warning = NonNullable<S['currency.Warning']>
export type HistoryRange = '1M' | '3M' | '6M' | '1Y' | 'ALL'

export interface NetWorthSummary {
  asOf: string | undefined
  currency: string
  netWorth: string
  cash: string
  /** Absent in CASH_ONLY mode, where the server returns only cash and net worth. */
  investments: {
    value: string
    cost: string
    unrealizedPl: string
    unrealizedPlPct: string | null
  } | null
  fixedAssets: string | null
  receivables: string | null
  liabilities: string | null
  trackingMode: 'FULL_NET_WORTH' | 'CASH_ONLY'
  warnings: Warning[]
}

/** Net worth and its components, all in the space base currency and all from the server. */
export function useNetWorthSummary(spaceId: string) {
  return useQuery({
    queryKey: queryKeys.space(spaceId).netWorthSummary(),
    refetchOnWindowFocus: true,
    queryFn: async (): Promise<NetWorthSummary> => {
      const d = (
        await api.GET('/spaces/{spaceId}/net-worth/summary', { params: { path: { spaceId } } })
      ).data
      const opt = (v: unknown) => (v === undefined || v === null ? null : toMoneyString(v))
      return {
        asOf: d?.asOf,
        currency: d?.currency ?? '',
        netWorth: toMoneyString(d?.netWorth),
        cash: toMoneyString(d?.cash),
        investments: d?.investments
          ? {
              value: toMoneyString(d.investments.value),
              cost: toMoneyString(d.investments.cost),
              unrealizedPl: toMoneyString(d.investments.unrealizedPl),
              unrealizedPlPct: opt(d.investments.unrealizedPlPct),
            }
          : null,
        fixedAssets: opt(d?.fixedAssets),
        receivables: opt(d?.receivables),
        liabilities: opt(d?.liabilities),
        trackingMode: d?.trackingMode === 'CASH_ONLY' ? 'CASH_ONLY' : 'FULL_NET_WORTH',
        warnings: d?.warnings ?? [],
      }
    },
  })
}

export interface NetWorthHistory {
  currency: string
  changePct: string | null
  points: Array<{ date: string; netWorth: string; live: boolean }>
}

export function useNetWorthHistory(spaceId: string, range: HistoryRange) {
  return useQuery({
    queryKey: queryKeys.space(spaceId).netWorthHistory(range),
    queryFn: async (): Promise<NetWorthHistory> => {
      const d = (
        await api.GET('/spaces/{spaceId}/net-worth/history', {
          params: { path: { spaceId }, query: { range } },
        })
      ).data
      return {
        currency: d?.currency ?? '',
        changePct: d?.changePct ? toMoneyString(d.changePct) : null,
        points: (d?.points ?? []).map((p) => ({
          date: p.date ?? '',
          netWorth: toMoneyString(p.netWorth),
          live: Boolean(p.live),
        })),
      }
    },
  })
}

export interface ManualAssetList {
  items: AssetDTO[]
  total: { amount: string; currency: string; warnings: Warning[] }
}

/** Manual assets of one kind with that kind's converted total (the `totals` map is keyed by kind). */
export function useManualAssets(spaceId: string, kind: AssetKind, enabled = true) {
  return useQuery({
    queryKey: queryKeys.space(spaceId).manualAssets(kind),
    enabled,
    refetchOnWindowFocus: true,
    queryFn: async (): Promise<ManualAssetList> => {
      const d = (
        await api.GET('/spaces/{spaceId}/manual-assets', {
          params: { path: { spaceId }, query: { kind } },
        })
      ).data
      const totals = (d?.totals ?? {}) as Record<
        string,
        { total?: unknown; currency?: string; warnings?: Warning[] }
      >
      const t = totals[kind]
      return {
        items: d?.items ?? [],
        total: {
          amount: toMoneyString(t?.total),
          currency: t?.currency ?? '',
          warnings: t?.warnings ?? [],
        },
      }
    },
  })
}

export function useManualAsset(spaceId: string, id: string) {
  return useQuery({
    queryKey: queryKeys.space(spaceId).manualAsset(id),
    refetchOnWindowFocus: true,
    queryFn: async () =>
      (await api.GET('/spaces/{spaceId}/manual-assets/{id}', { params: { path: { spaceId, id } } }))
        .data,
  })
}

/** After any asset change the lists, net worth and (for settlements) wallets all move together. */
function useRefreshAll(spaceId: string) {
  const queryClient = useQueryClient()
  return () => invalidateMoney(queryClient, spaceId)
}

export function useCreateAsset(spaceId: string) {
  const refresh = useRefreshAll(spaceId)
  return useMutation({
    mutationFn: async (body: S['manualassets.createRequest']) =>
      (await api.POST('/spaces/{spaceId}/manual-assets', { params: { path: { spaceId } }, body }))
        .data,
    meta: { silent: true },
    onSettled: refresh,
  })
}

export function useUpdateAsset(spaceId: string, id: string) {
  const refresh = useRefreshAll(spaceId)
  return useMutation({
    // null clears counterpartyName, dueDate, estimatedAnnualChangePct and note (backend contract)
    mutationFn: async (body: Record<string, unknown>) =>
      (
        await api.PATCH('/spaces/{spaceId}/manual-assets/{id}', {
          params: { path: { spaceId, id } },
          body: body as never,
        })
      ).data,
    meta: { silent: true },
    onSettled: refresh,
  })
}

export function useDeleteAsset(spaceId: string, id: string) {
  const refresh = useRefreshAll(spaceId)
  return useMutation({
    mutationFn: async () =>
      api.DELETE('/spaces/{spaceId}/manual-assets/{id}', { params: { path: { spaceId, id } } }),
    meta: { silent: true },
    onSettled: refresh,
  })
}

export function useSettle(spaceId: string, id: string) {
  const refresh = useRefreshAll(spaceId)
  return useMutation({
    mutationFn: async (body: S['manualassets.settleRequest']) =>
      (
        await api.POST('/spaces/{spaceId}/manual-assets/{id}/settlements', {
          params: { path: { spaceId, id } },
          body,
        })
      ).data,
    meta: { silent: true },
    // A settlement is a transfer: wallets, history and net worth all change.
    onSettled: refresh,
  })
}
