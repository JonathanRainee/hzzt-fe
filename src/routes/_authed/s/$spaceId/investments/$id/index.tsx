import { createFileRoute } from '@tanstack/react-router'
import { InvestmentDetailScreen } from '@/features/investments/InvestmentDetailScreen'

export const Route = createFileRoute('/_authed/s/$spaceId/investments/$id/')({
  component: InvestmentDetailScreen,
})
