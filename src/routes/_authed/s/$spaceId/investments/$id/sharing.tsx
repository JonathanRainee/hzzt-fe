import { createFileRoute } from '@tanstack/react-router'
import { SharingScreen } from '@/features/investments/SharingScreen'

export const Route = createFileRoute('/_authed/s/$spaceId/investments/$id/sharing')({
  component: SharingScreen,
})
