import { toMoneyString } from '@/shared/money'
import type { InvestmentDTO, InvestmentView, Valuation } from './types'

const str = (v: unknown): string => toMoneyString(v)

/** Read the opaque `valuation` / `totalValuation` object into a typed shape, or null if absent. */
export function parseValuation(raw: unknown): Valuation | null {
  if (typeof raw !== 'object' || raw === null) return null
  const r = raw as Record<string, unknown>
  if (r.marketValue === undefined) return null
  const base = r.base as Record<string, unknown> | null | undefined
  return {
    price: str(r.price),
    priceSource: (r.priceSource as Valuation['priceSource']) ?? 'MANUAL',
    priceAsOf: typeof r.priceAsOf === 'string' ? r.priceAsOf : null,
    isStale: Boolean(r.isStale),
    marketValue: str(r.marketValue),
    costBasis: str(r.costBasis),
    unrealizedPl: str(r.unrealizedPl),
    unrealizedPlPct:
      r.unrealizedPlPct === null || r.unrealizedPlPct === undefined ? null : str(r.unrealizedPlPct),
    base: base
      ? {
          currency: String(base.currency ?? ''),
          marketValue: str(base.marketValue),
          costBasis: str(base.costBasis),
          unrealizedPl: str(base.unrealizedPl),
          fxRate: str(base.fxRate),
        }
      : null,
    warnings: Array.isArray(r.warnings) ? (r.warnings as Valuation['warnings']) : [],
  }
}

/** A shared-in investment belongs to someone else: it is read-only everywhere. */
export const isSharedIn = (i: Pick<InvestmentDTO, 'ownership'>): boolean =>
  i.ownership === 'SHARED_IN'

/** Basis points (10,000 = 100%) as a percentage string with two decimals: 5000 -> "50.00". */
export function bpsToPct(bps: number | undefined): string {
  const n = Math.round(bps ?? 0)
  const whole = Math.trunc(n / 100)
  const frac = Math.abs(n % 100)
  return `${n < 0 && whole === 0 ? '-' : ''}${whole}.${String(frac).padStart(2, '0')}`
}

export const TYPE_ORDER = ['CRYPTO', 'ID_STOCK', 'US_STOCK', 'GLOBAL_ETF', 'MUTUAL_FUND'] as const

export interface InvestmentGroup {
  key: string
  assetType: string
  items: InvestmentView[]
}

/**
 * Group the list by asset type, in a stable display order. This is the one place that would
 * group by account once backend P18 exists (`InvestmentView.accountId`).
 */
export function groupInvestments(items: readonly InvestmentView[]): InvestmentGroup[] {
  const byType = new Map<string, InvestmentView[]>()
  for (const i of items) {
    const key = i.assetType ?? 'OTHER'
    byType.set(key, [...(byType.get(key) ?? []), i])
  }
  const known: string[] = [...TYPE_ORDER]
  return [...byType.entries()]
    .sort(([a], [b]) => {
      const ia = known.indexOf(a)
      const ib = known.indexOf(b)
      return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib)
    })
    .map(([assetType, group]) => ({ key: assetType, assetType, items: group }))
}
