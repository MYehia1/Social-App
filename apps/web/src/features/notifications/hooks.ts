import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { notificationsApi } from '@/lib/api/social'
import { queryKeys } from '@/lib/queryKeys'
import { useAuth } from '@/providers/auth-context'
import { toLocalisedMessage, useI18n } from '@/i18n'

export function useNotifications() {
  return useInfiniteQuery({
    queryKey: queryKeys.notificationList(),
    queryFn: ({ pageParam }) => notificationsApi.list(pageParam),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => lastPage.nextPage,
  })
}


export function useUnreadCount() {
  const { isAuthenticated } = useAuth()

  return useQuery({
    queryKey: queryKeys.unreadCount(),
    queryFn: () => notificationsApi.unreadCount(),
    enabled: isAuthenticated,
    refetchInterval: 60_000,
    refetchOnWindowFocus: true,
    staleTime: 30_000,
  })
}

export function useMarkAllRead() {
  const { t } = useI18n()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => notificationsApi.markAllRead(),
    onSuccess: async () => {
      queryClient.setQueryData(queryKeys.unreadCount(), 0)
      await queryClient.invalidateQueries({ queryKey: queryKeys.notifications() })
      toast.success(t('toast.allCaughtUp'))
    },
    onError: (error) => toast.error(toLocalisedMessage(t, error)),
  })
}

export function useMarkRead() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => notificationsApi.markRead(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.notifications() })
    },


    onError: () => undefined,
  })
}
