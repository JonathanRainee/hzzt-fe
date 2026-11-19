/**
 * The single source of cache keys. Every space-scoped key starts with the space id,
 * so switching spaces can never show another space's data (plan 5.1).
 */
export const queryKeys = {
  me: () => ['me'] as const,
  preferences: () => ['me', 'preferences'] as const,
  spaces: () => ['spaces'] as const,
  currencies: () => ['currencies'] as const,
  walletCardPresets: () => ['wallet-card-presets'] as const,
  walletCardTemplates: () => ['wallet-card-templates'] as const,
  space: (spaceId: string) => ({
    /** Prefix of every key for this space: used to drop its cache on a switch. */
    all: () => ['space', spaceId] as const,
    members: () => ['space', spaceId, 'members'] as const,
    invitation: () => ['space', spaceId, 'invitation'] as const,
    manualRates: () => ['space', spaceId, 'manual-rates'] as const,
    wallets: () => ['space', spaceId, 'wallets'] as const,
    wallet: (id: string) => ['space', spaceId, 'wallets', id] as const,
    transactions: (filters?: unknown) => ['space', spaceId, 'transactions', filters] as const,
    netWorth: () => ['space', spaceId, 'net-worth'] as const,
    dashboard: () => ['space', spaceId, 'dashboard'] as const,
    goals: () => ['space', spaceId, 'goals'] as const,
  }),
}
