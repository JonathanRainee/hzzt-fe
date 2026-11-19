import { Star } from 'lucide-react'
import { Amount } from './Amount'
import { type CardStyleDTO, resolveCardStyle } from './cardStyle'
import { cn } from './cn'

const TYPE_LABEL: Record<string, string> = {
  BANK: 'Bank',
  E_WALLET: 'E-wallet',
  CASH: 'Cash',
  OTHER: 'Other',
}

export interface WalletCardProps {
  name: string
  icon: string
  balance: string
  currency: string
  type: string
  cardStyle: CardStyleDTO | undefined
  isFavorite?: boolean
  className?: string
}

/** The wallet card: icon, name, balance and type over a solid, gradient or template background. */
export function WalletCard({
  name,
  icon,
  balance,
  currency,
  type,
  cardStyle,
  isFavorite,
  className,
}: WalletCardProps) {
  const { background, tone } = resolveCardStyle(cardStyle)
  return (
    <div
      data-tone={tone}
      style={{ background }}
      className={cn(
        'flex aspect-[1.7/1] w-full flex-col justify-between rounded-lg p-4 shadow-card',
        tone === 'light' ? 'text-white' : 'text-black',
        className,
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="flex items-center gap-2 font-semibold">
          <span aria-hidden className="text-xl">
            {icon}
          </span>
          <span className="truncate">{name}</span>
        </span>
        {isFavorite ? (
          <Star aria-label="Favourite" className="size-4 shrink-0 fill-current" />
        ) : null}
      </div>
      <div>
        <p className="text-xs opacity-80">{TYPE_LABEL[type] ?? type}</p>
        <Amount value={balance} currency={currency} className="text-xl font-semibold" />
      </div>
    </div>
  )
}
