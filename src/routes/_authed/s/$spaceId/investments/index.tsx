import { createFileRoute } from '@tanstack/react-router'
import { InvestmentsScreen } from '@/features/investments/InvestmentsScreen'

export const Route = createFileRoute('/_authed/s/$spaceId/investments/')({
  component: InvestmentsScreen,
})
