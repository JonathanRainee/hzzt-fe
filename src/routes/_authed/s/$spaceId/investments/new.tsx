import { createFileRoute } from '@tanstack/react-router'
import { CreateInvestmentScreen } from '@/features/investments/CreateInvestmentScreen'

export const Route = createFileRoute('/_authed/s/$spaceId/investments/new')({
  component: CreateInvestmentScreen,
})
