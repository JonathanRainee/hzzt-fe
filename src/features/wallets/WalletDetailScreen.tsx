import { useMutation } from '@tanstack/react-query'
import { Link, useNavigate, useParams, useSearch } from '@tanstack/react-router'
import { Ellipsis, Palette, Pencil, Plus, Star, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useSpace } from '@/app/providers/SpaceProvider'
import { api } from '@/shared/api/client'
import { errorMessage, toAppError } from '@/shared/api/errors'
import { periodFromSearch, periodToSearch } from '@/shared/period'
import { Amount } from '@/shared/ui/Amount'
import { Button } from '@/shared/ui/Button'
import { ConfirmDialog } from '@/shared/ui/ConfirmDialog'
import { EmptyState } from '@/shared/ui/EmptyState'
import { PageHeader } from '@/shared/ui/PageHeader'
import { PeriodPicker } from '@/shared/ui/PeriodPicker'
import { SheetShell } from '@/shared/ui/SheetShell'
import { Skeleton } from '@/shared/ui/Skeleton'
import { useToast } from '@/shared/ui/Toast'
import { DayGroupHeader, TransactionRow } from '@/shared/ui/TransactionRow'
import { WalletCard } from '@/shared/ui/WalletCard'
import { useInvalidateMoney, useWallet, useWalletTransactions } from './hooks'
import { TopUpSheet } from './TopUpSheet'

const rowBtn =
  'flex min-h-12 w-full items-center gap-3 rounded-md px-3 text-left hover:bg-surface-3'

export function WalletDetailScreen() {
  const { space } = useSpace()
  const { id } = useParams({ from: '/_authed/s/$spaceId/wallets/$id/' })
  const search = useSearch({ from: '/_authed/s/$spaceId/wallets/$id/' })
  const navigate = useNavigate()
  const toast = useToast()
  const invalidateMoney = useInvalidateMoney(space.id)
  const period = periodFromSearch(search)
  const wallet = useWallet(space.id, id)
  const txns = useWalletTransactions(space.id, id, period)
  const [menu, setMenu] = useState(false)
  const [topUp, setTopUp] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [confirmForce, setConfirmForce] = useState(false)

  const favourite = useMutation({
    mutationFn: async (isFavorite: boolean) =>
      (
        await api.PATCH('/spaces/{spaceId}/wallets/{id}', {
          params: { path: { spaceId: space.id, id } },
          body: { isFavorite },
        })
      ).data,
    meta: { silent: true },
    onSuccess: () => invalidateMoney(),
    onError: (err) => toast.show(errorMessage(err), 'error'),
  })

  const remove = useMutation({
    mutationFn: async (force: boolean) =>
      api.DELETE('/spaces/{spaceId}/wallets/{id}', {
        params: { path: { spaceId: space.id, id }, query: force ? { force: true } : {} },
      }),
    meta: { silent: true },
    onSuccess: async () => {
      await invalidateMoney()
      toast.show('Wallet deleted', 'success')
      await navigate({ to: '/s/$spaceId/wallets', params: { spaceId: space.id } })
    },
    onError: (err) => {
      setConfirmDelete(false)
      if (toAppError(err).code === 'WALLET_HAS_BALANCE') setConfirmForce(true)
      else toast.show(errorMessage(err), 'error')
    },
  })

  const groups = useMemo(() => {
    const byDay = new Map<string, NonNullable<typeof txns.data>['pages'][number]['items']>()
    for (const page of txns.data?.pages ?? []) {
      for (const t of page.items) {
        const day = (t.occurredAt ?? '').slice(0, 10)
        byDay.set(day, [...(byDay.get(day) ?? []), t])
      }
    }
    return [...byDay.entries()]
  }, [txns.data])

  if (wallet.isPending) return <Skeleton className="mx-auto aspect-[1.7/1] max-w-xl" />
  if (wallet.isError || !wallet.data) {
    return (
      <div className="mx-auto max-w-xl">
        <EmptyState
          title="Couldn't load this wallet"
          description={wallet.isError ? errorMessage(wallet.error) : undefined}
          action={<Button onClick={() => void wallet.refetch()}>Try again</Button>}
        />
      </div>
    )
  }

  const w = wallet.data
  const currency = w.currency ?? ''

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-5">
      <PageHeader
        title={w.name ?? 'Wallet'}
        action={
          <Button
            variant="ghost"
            size="icon"
            aria-label="Wallet options"
            onClick={() => setMenu(true)}
          >
            <Ellipsis aria-hidden className="size-6" />
          </Button>
        }
      />
      <WalletCard
        name={w.name ?? ''}
        icon={w.icon ?? '💳'}
        balance={w.balance ?? '0'}
        currency={currency}
        type={w.type ?? 'OTHER'}
        cardStyle={w.cardStyle}
        isFavorite={w.isFavorite}
      />
      <p className="text-center text-sm text-label-secondary">
        Balance{' '}
        <Amount value={w.balance ?? '0'} currency={currency} className="font-semibold text-label" />
      </p>
      <div className="flex gap-3">
        <Button className="flex-1" onClick={() => setTopUp(true)}>
          <Plus aria-hidden className="size-5" />
          Add balance
        </Button>
      </div>

      <section aria-labelledby="txn-heading" className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-3">
          <h2 id="txn-heading" className="text-lg font-semibold">
            Transactions
          </h2>
          <PeriodPicker
            value={period}
            onChange={(p) =>
              navigate({
                to: '/s/$spaceId/wallets/$id',
                params: { spaceId: space.id, id },
                search: periodToSearch(p),
                replace: true,
              })
            }
          />
        </div>

        {txns.isPending ? (
          <div className="flex flex-col gap-2" aria-busy="true">
            <Skeleton className="h-14" />
            <Skeleton className="h-14" />
          </div>
        ) : txns.isError ? (
          <EmptyState
            title="Couldn't load transactions"
            action={<Button onClick={() => void txns.refetch()}>Try again</Button>}
          />
        ) : groups.length === 0 ? (
          <EmptyState title="No transactions in this period" description="Try a longer period." />
        ) : (
          <>
            {groups.map(([day, items]) => (
              <div key={day}>
                <DayGroupHeader date={day} />
                <ul className="divide-y divide-border">
                  {items.map((t) => (
                    <li key={t.id}>
                      <TransactionRow transaction={t} />
                    </li>
                  ))}
                </ul>
              </div>
            ))}
            {txns.hasNextPage ? (
              <Button
                variant="secondary"
                disabled={txns.isFetchingNextPage}
                onClick={() => void txns.fetchNextPage()}
              >
                {txns.isFetchingNextPage ? 'Loading…' : 'Load more'}
              </Button>
            ) : null}
          </>
        )}
      </section>

      <SheetShell open={menu} onOpenChange={setMenu} title="Wallet options">
        <ul className="flex flex-col">
          <li>
            <Link
              to="/s/$spaceId/wallets/$id/edit"
              params={{ spaceId: space.id, id }}
              className={rowBtn}
            >
              <Pencil aria-hidden className="size-5" /> Edit wallet
            </Link>
          </li>
          <li>
            <Link
              to="/s/$spaceId/wallets/$id/card"
              params={{ spaceId: space.id, id }}
              className={rowBtn}
            >
              <Palette aria-hidden className="size-5" /> Card style
            </Link>
          </li>
          <li>
            <button
              type="button"
              className={rowBtn}
              onClick={() => {
                setMenu(false)
                favourite.mutate(!w.isFavorite)
              }}
            >
              <Star aria-hidden className="size-5" />{' '}
              {w.isFavorite ? 'Remove from favourites' : 'Add to favourites'}
            </button>
          </li>
          <li>
            <button
              type="button"
              className={`${rowBtn} text-negative`}
              onClick={() => {
                setMenu(false)
                setConfirmDelete(true)
              }}
            >
              <Trash2 aria-hidden className="size-5" /> Delete wallet
            </button>
          </li>
        </ul>
      </SheetShell>

      {topUp ? (
        <TopUpSheet walletId={id} currency={currency} onClose={() => setTopUp(false)} />
      ) : null}

      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title="Delete this wallet?"
        description="The wallet and its transaction history will be removed."
        confirmLabel="Delete wallet"
        destructive
        pending={remove.isPending}
        onConfirm={() => remove.mutate(false)}
      />
      <ConfirmDialog
        open={confirmForce}
        onOpenChange={setConfirmForce}
        title="This wallet still has money in it"
        description="Deleting it now will remove its balance and history. This can't be undone. Move the money to another wallet first if you want to keep it."
        confirmLabel="Delete anyway"
        destructive
        pending={remove.isPending}
        onConfirm={() => {
          setConfirmForce(false)
          remove.mutate(true)
        }}
      />
    </div>
  )
}
