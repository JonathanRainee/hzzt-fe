import { createFileRoute, Link } from '@tanstack/react-router'
import { PlaceholderScreen } from '@/app/PlaceholderScreen'
import { Button } from '@/shared/ui/Button'

export const Route = createFileRoute('/_authed/s/$spaceId/assets')({ component: Assets })

function Assets() {
  const { spaceId } = Route.useParams()
  return (
    <div className="mx-auto flex max-w-xl flex-col gap-4">
      <PlaceholderScreen title="Assets" phase="F8" />
      {/* Temporary entry point until the asset page (F8) lists investments itself. */}
      <Button variant="secondary" asChild>
        <Link to="/s/$spaceId/investments" params={{ spaceId }}>
          Investments
        </Link>
      </Button>
    </div>
  )
}
