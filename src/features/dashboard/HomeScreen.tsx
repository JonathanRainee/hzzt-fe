import { useNavigate, useSearch } from '@tanstack/react-router'
import { format } from 'date-fns'
import { useSpace } from '@/app/providers/SpaceProvider'
import { periodFromSearch, periodToSearch } from '@/shared/period'
import { PeriodPicker } from '@/shared/ui/PeriodPicker'
import {
  AnalyticsCard,
  BreakdownCard,
  CalendarCard,
  NetWorthCard,
  OverviewCard,
  QuickActions,
} from './cards'
import type { Range } from './search'
import { monthOf } from './search'

/** The home dashboard. Everything on it is a function of the URL: period, calendar month and chart range. */
export function HomeScreen() {
  const { space } = useSpace()
  const search = useSearch({ from: '/_authed/s/$spaceId/' })
  const navigate = useNavigate()
  const period = periodFromSearch(search)
  const month = search.month ?? monthOf(new Date())
  const range: Range = search.range ?? '1M'

  const go = (patch: Partial<typeof search>) =>
    navigate({
      to: '/s/$spaceId',
      params: { spaceId: space.id },
      search: (prev) => ({ ...prev, ...patch }),
      replace: true,
    })

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Home</h1>
          <p data-testid="active-space" className="text-sm text-label-secondary">
            {space.avatarEmoji} {space.name} · {space.baseCurrency}
          </p>
        </div>
        <PeriodPicker
          value={period}
          onChange={(p) => {
            // Setting a preset clears any custom range, and the other way round.
            const next = periodToSearch(p)
            void go({ period: undefined, from: undefined, to: undefined, ...next })
          }}
        />
      </div>

      <OverviewCard period={period} />
      <NetWorthCard range={range} onRange={(r) => go({ range: r === '1M' ? undefined : r })} />
      <BreakdownCard period={period} />
      <AnalyticsCard period={period} />
      <CalendarCard
        month={month}
        onMonth={(m) => go({ month: m === monthOf(new Date()) ? undefined : m })}
      />
      <QuickActions />
      <p className="sr-only">Today is {format(new Date(), 'd MMMM yyyy')}</p>
    </div>
  )
}
