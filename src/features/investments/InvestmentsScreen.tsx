import { Link } from '@tanstack/react-router'
import { Mail, Plus } from 'lucide-react'
import { useSpace } from '@/app/providers/SpaceProvider'
import { Amount } from '@/shared/ui/Amount'
import { Button } from '@/shared/ui/Button'
import { Card } from '@/shared/ui/Card'
import { EmptyState } from '@/shared/ui/EmptyState'
import { PageHeader } from '@/shared/ui/PageHeader'
import { Skeleton } from '@/shared/ui/Skeleton'
import { WarningsStrip } from '@/shared/ui/WarningsStrip'
import { useInvestments, useInvestmentTypes } from './hooks'
import { InvestmentRow } from './InvestmentRow'
import { groupInvestments } from './valuation'

export function InvestmentsScreen() {
  const { space } = useSpace()
  const list = useInvestments(space.id)
  const types = useInvestmentTypes()
  const label = (assetType: string) =>
    types.data?.find((t) => t.assetType === assetType)?.label ?? assetType

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-4">
      <PageHeader
        title="Investments"
        action={
          <div className="flex gap-2">
            <Button variant="ghost" size="icon" aria-label="Shared investment invitations" asChild>
              <Link to="/invitations/shared">
                <Mail aria-hidden className="size-5" />
              </Link>
            </Button>
            <Button size="sm" asChild>
              <Link to="/s/$spaceId/investments/new" params={{ spaceId: space.id }}>
                <Plus aria-hidden className="size-4" />
                Add
              </Link>
            </Button>
          </div>
        }
      />

      {list.isPending ? (
        <div className="flex flex-col gap-3" aria-busy="true">
          <Skeleton className="h-24" />
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
        </div>
      ) : list.isError ? (
        <EmptyState
          title="Couldn't load your investments"
          action={<Button onClick={() => void list.refetch()}>Try again</Button>}
        />
      ) : (
        <>
          <Card data-testid="portfolio-summary">
            <p className="text-sm text-label-secondary">Portfolio value</p>
            <p className="text-2xl font-semibold">
              <Amount
                value={list.data.summary.totalValue}
                currency={list.data.summary.currency || space.baseCurrency}
              />
            </p>
            <p className="mt-1 flex flex-wrap justify-between gap-2 text-sm text-label-secondary">
              <span>
                Cost{' '}
                <Amount
                  value={list.data.summary.totalCost}
                  currency={list.data.summary.currency || space.baseCurrency}
                />
              </span>
              <span>
                <Amount
                  value={list.data.summary.unrealizedPl}
                  currency={list.data.summary.currency || space.baseCurrency}
                  tone="auto"
                  signDisplay="always"
                />
                {list.data.summary.unrealizedPlPct !== null ? (
                  <> ({list.data.summary.unrealizedPlPct}%)</>
                ) : null}
              </span>
            </p>
          </Card>
          <WarningsStrip warnings={list.data.summary.warnings} />

          {list.data.items.length === 0 ? (
            <EmptyState
              title="No investments yet"
              description="Track crypto, stocks, funds and ETFs in one place."
              action={
                <Button asChild>
                  <Link to="/s/$spaceId/investments/new" params={{ spaceId: space.id }}>
                    Add investment
                  </Link>
                </Button>
              }
            />
          ) : (
            groupInvestments(list.data.items).map((g) => (
              <section key={g.key} aria-label={label(g.assetType)} className="flex flex-col gap-2">
                <h2 className="text-sm font-semibold tracking-wide text-label-secondary uppercase">
                  {label(g.assetType)}
                </h2>
                {g.items.map((i) => (
                  <InvestmentRow key={i.id} investment={i} spaceId={space.id} />
                ))}
              </section>
            ))
          )}
        </>
      )}
    </div>
  )
}
