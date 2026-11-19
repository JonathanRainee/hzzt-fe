import { format, parseISO } from 'date-fns'
import type { components } from '@/shared/api/schema'
import { Amount } from './Amount'
import { cn } from './cn'

export type TransactionDTO = components['schemas']['transactions.TransactionDTO']

const TYPE_LABEL: Record<string, string> = {
  INCOME: 'Income',
  EXPENSE: 'Expense',
  TRANSFER: 'Transfer',
  ADJUSTMENT: 'Adjustment',
  OPENING_BALANCE: 'Opening balance',
}

/** Display title: the user's title, else the category, else the type. */
export function transactionTitle(t: TransactionDTO): string {
  return t.title || t.category?.name || TYPE_LABEL[t.type ?? ''] || 'Transaction'
}

/** Signed amount for display: outflows are negative. */
export function signedAmount(t: TransactionDTO): string {
  const amount = t.amount ?? '0'
  return t.direction === 'OUT' && !amount.startsWith('-') ? `-${amount}` : amount
}

export function TransactionRow({ transaction: t }: { transaction: TransactionDTO }) {
  return (
    <div className="flex min-h-14 items-center gap-3 py-2">
      <span
        aria-hidden
        style={t.category?.color ? { backgroundColor: t.category.color } : undefined}
        className={cn(
          'flex size-10 shrink-0 items-center justify-center rounded-full text-lg',
          !t.category?.color && 'bg-surface-3',
        )}
      >
        {t.category?.icon ?? '💱'}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">{transactionTitle(t)}</p>
        <p className="truncate text-sm text-label-secondary">
          {TYPE_LABEL[t.type ?? ''] ?? t.type}
          {t.occurredAt ? ` · ${format(parseISO(t.occurredAt), 'HH:mm')}` : ''}
        </p>
      </div>
      <Amount
        value={signedAmount(t)}
        currency={t.currency ?? ''}
        tone="auto"
        className="font-medium"
      />
    </div>
  )
}

/** "Mon, 3 Nov" heading for a day's transactions. */
export function DayGroupHeader({ date }: { date: string }) {
  return (
    <h3 className="sticky top-14 bg-bg py-2 text-sm font-semibold text-label-secondary">
      {format(parseISO(date), 'EEE, d MMM')}
    </h3>
  )
}
