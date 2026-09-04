import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '@/providers/auth-context'
import { PostSkeletonList } from '@/features/feed/components/PostSkeleton'

export function ProtectedRoute() {
  const { isAuthenticated, isLoading } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return (
      <div className="mx-auto w-full max-w-2xl px-4 py-6">
        <PostSkeletonList />
      </div>
    )
  }

  if (!isAuthenticated) {

    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  return <Outlet />
}
