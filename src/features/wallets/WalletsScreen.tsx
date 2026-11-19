import { Link } from '@tanstack/react-router'
import { ArrowDown, ArrowUp, Plus } from 'lucide-react'
import { useState } from 'react'
import { useSpace } from '@/app/providers/SpaceProvider'
import { errorMessage } from '@/shared/api/errors'
import { Amount } from '@/shared/ui/Amount'
import { Button } from '@/shared/ui/Button'
import { Card } from '@/shared/ui/Card'
import { EmptyState } from '@/shared/ui/EmptyState'
import { Skeleton } from '@/shared/ui/Skeleton'
import { useToast } from '@/shared/ui/Toast'
import { WalletCard } from '@/shared/ui/WalletCard'
import { WarningsStrip } from '@/shared/ui/WarningsStrip'
import { CreateWalletSheet } from './CreateWalletSheet'
import { moveItem, useReorderWallets, useWallets } from './hooks'

export function WalletsScreen() {
  const { space } = useSpace()
  const wallets = useWallets(space.id)
  const reorder = useReorderWallets(space.id)
  const toast = useToast()
  const [creating, setCreating] = useState(false)
  const [reordering, setReordering] = useState(false)

  const move = (index: number, to: number) => {
    const items = wallets.data?.items ?? []
    const ids = moveItem(items, index, to).map((w) => w.id as string)
    reorder.mutate(ids, { onError: (err) => toast.show(errorMessage(err), 'error') })
  }

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl font-semibold">Wallets</h1>
        <div className="flex gap-2">
          {wallets.data && wallets.data.items.length > 1 ? (
            <Button variant="ghost" size="sm" onClick={() => setReordering((r) => !r)}>
              {reordering ? 'Done' : 'Reorder'}
            </Button>
          ) : null}
          <Button size="sm" onClick={() => setCreating(true)}>
            <Plus aria-hidden className="size-4" />
            Add wallet
          </Button>
        </div>
      </div>

      {wallets.isPending ? (
        <div className="flex flex-col gap-3" aria-busy="true">
          <Skeleton className="h-20" />
          <Skeleton className="aspect-[1.7/1] w-full" />
          <Skeleton className="aspect-[1.7/1] w-full" />
        </div>
      ) : wallets.isError ? (
        <EmptyState
          title="Couldn't load your wallets"
          description="Check your connection and try again."
          action={<Button onClick={() => void wallets.refetch()}>Try again</Button>}
        />
      ) : (
        <>
          <Card>
            <p className="text-sm text-label-secondary">Total balance</p>
            <p className="text-2xl font-semibold" data-testid="wallets-total">
              <Amount
                value={wallets.data.total.amount}
                currency={wallets.data.total.currency || space.baseCurrency}
              />
            </p>
          </Card>
          <WarningsStrip warnings={wallets.data.total.warnings} />

          {wallets.data.items.length === 0 ? (
            <EmptyState
              title="No wallets yet"
              description="Add a bank account, e-wallet or cash to start tracking."
              action={<Button onClick={() => setCreating(true)}>Add wallet</Button>}
            />
          ) : (
            <ul className="flex flex-col gap-3">
              {wallets.data.items.map((w, i, all) => (
                <li key={w.id} className="flex items-center gap-2">
                  <Link
                    to="/s/$spaceId/wallets/$id"
                    params={{ spaceId: space.id, id: w.id as string }}
                    aria-label={`${w.name}, open wallet`}
                    className="min-w-0 flex-1"
                  >
                    <WalletCard
                      name={w.name ?? ''}
                      icon={w.icon ?? '💳'}
                      balance={w.balance ?? '0'}
                      currency={w.currency ?? ''}
                      type={w.type ?? 'OTHER'}
                      cardStyle={w.cardStyle}
                      isFavorite={w.isFavorite}
                    />
                  </Link>
                  {reordering ? (
                    <div className="flex flex-col gap-1">
                      <Button
                        variant="secondary"
                        size="icon"
                        aria-label={`Move ${w.name} up`}
                        disabled={i === 0}
                        onClick={() => move(i, i - 1)}
                      >
                        <ArrowUp aria-hidden className="size-5" />
                      </Button>
                      <Button
                        variant="secondary"
                        size="icon"
                        aria-label={`Move ${w.name} down`}
                        disabled={i === all.length - 1}
                        onClick={() => move(i, i + 1)}
                      >
                        <ArrowDown aria-hidden className="size-5" />
                      </Button>
                    </div>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </>
      )}

      {creating ? <CreateWalletSheet onClose={() => setCreating(false)} /> : null}
    </div>
  )
}
