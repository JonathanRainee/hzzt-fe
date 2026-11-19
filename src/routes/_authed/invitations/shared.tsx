import { createFileRoute } from '@tanstack/react-router'
import { InvitationsScreen } from '@/features/investments/InvitationsScreen'

export const Route = createFileRoute('/_authed/invitations/shared')({
  component: InvitationsScreen,
})
