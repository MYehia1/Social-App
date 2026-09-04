import { Link, useRouteError } from 'react-router-dom'
import { TriangleAlert } from 'lucide-react'

export function RouteError() {
  const error = useRouteError()

  return (
    <div className="grid min-h-dvh place-items-center px-4">
      <div className="max-w-sm text-center">
        <div className="mx-auto grid size-12 place-items-center rounded-full bg-danger-soft">
          <TriangleAlert className="size-5 text-danger" aria-hidden="true" />
        </div>
        <h1 className="mt-4 text-lg font-semibold text-content">
          Something went wrong
        </h1>
        <p className="mt-1.5 text-sm text-muted">
          {error instanceof Error
            ? error.message
            : 'An unexpected error occurred. Try reloading the page.'}
        </p>
        <Link
          to="/"
          onClick={() => window.location.assign('/')}
          className="mt-5 inline-flex h-10 items-center justify-center rounded-lg bg-brand px-4 text-sm font-medium text-on-brand transition-colors hover:bg-brand-hover"
        >
          Reload
        </Link>
      </div>
    </div>
  )
}
