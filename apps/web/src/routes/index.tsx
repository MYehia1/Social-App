import { createBrowserRouter } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { RouteError } from '@/components/RouteError'
import { GuestRoute } from './GuestRoute'
import { ProtectedRoute } from './ProtectedRoute'

export const router = createBrowserRouter([
  {
    element: <GuestRoute />,
    errorElement: <RouteError />,
    children: [
      {
        path: '/login',
        lazy: async () => ({ Component: (await import('@/pages/LoginPage')).LoginPage }),
      },
      {
        path: '/register',
        lazy: async () => ({
          Component: (await import('@/pages/RegisterPage')).RegisterPage,
        }),
      },
      {

        path: '/verify',
        lazy: async () => ({
          Component: (await import('@/pages/VerifyEmailPage')).VerifyEmailPage,
        }),
      },
    ],
  },
  {
    element: <AppShell />,
    errorElement: <RouteError />,
    children: [
      {
        element: <ProtectedRoute />,
        children: [
          {
            index: true,
            lazy: async () => ({ Component: (await import('@/pages/FeedPage')).FeedPage }),
          },
          {
            path: 'post/:id',
            lazy: async () => ({ Component: (await import('@/pages/PostPage')).PostPage }),
          },
          {
            path: 'profile',
            lazy: async () => ({
              Component: (await import('@/pages/ProfilePage')).ProfilePage,
            }),
          },
          {

            path: 'u/:username',
            lazy: async () => ({
              Component: (await import('@/pages/UserProfilePage')).UserProfilePage,
            }),
          },
          {
            path: 'friends',
            lazy: async () => ({
              Component: (await import('@/pages/FriendsPage')).FriendsPage,
            }),
          },
          {
            path: 'notifications',
            lazy: async () => ({
              Component: (await import('@/pages/NotificationsPage')).NotificationsPage,
            }),
          },
        ],
      },
      {
        path: '*',
        lazy: async () => ({
          Component: (await import('@/pages/NotFoundPage')).NotFoundPage,
        }),
      },
    ],
  },
])
