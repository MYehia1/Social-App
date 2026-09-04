import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { friendsApi } from '@/lib/api/social'
import { queryKeys } from '@/lib/queryKeys'
import { toLocalisedMessage, useI18n } from '@/i18n'

export function useFriends() {
  return useInfiniteQuery({
    queryKey: queryKeys.friendList(),
    queryFn: ({ pageParam }) => friendsApi.list(pageParam),
    initialPageParam: 1,
    getNextPageParam: (page) => page.nextPage,
  })
}

export function useIncomingRequests() {
  return useInfiniteQuery({
    queryKey: queryKeys.incomingRequests(),
    queryFn: ({ pageParam }) => friendsApi.incoming(pageParam),
    initialPageParam: 1,
    getNextPageParam: (page) => page.nextPage,
  })
}

export function useOutgoingRequests() {
  return useInfiniteQuery({
    queryKey: queryKeys.outgoingRequests(),
    queryFn: ({ pageParam }) => friendsApi.outgoing(pageParam),
    initialPageParam: 1,
    getNextPageParam: (page) => page.nextPage,
  })
}

export function useSuggestions() {
  return useQuery({
    queryKey: queryKeys.suggestions(),
    queryFn: () => friendsApi.suggestions(),
  })
}


function useInvalidateFriends() {
  const queryClient = useQueryClient()
  return async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.friends() }),
      queryClient.invalidateQueries({ queryKey: queryKeys.currentUser() }),
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications() }),
    ])
  }
}


function useInvalidateAfterSend() {
  const queryClient = useQueryClient()
  return async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.outgoingRequests() }),
      queryClient.invalidateQueries({ queryKey: queryKeys.incomingRequests() }),
      queryClient.invalidateQueries({ queryKey: queryKeys.friendList() }),
      queryClient.invalidateQueries({ queryKey: queryKeys.currentUser() }),
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications() }),
    ])
  }
}

export function useSendFriendRequest() {
  const { t } = useI18n()
  const invalidate = useInvalidateAfterSend()

  return useMutation({
    mutationFn: (userId: string) => friendsApi.sendRequest(userId),
    onSuccess: async (result) => {

      toast.success(
        result.state === 'friends' ? t('toast.nowFriends') : t('toast.requestSent'),
      )
      await invalidate()
    },
    onError: (error) => toast.error(toLocalisedMessage(t, error)),
  })
}

export function useRespondToRequest() {
  const { t } = useI18n()
  const invalidate = useInvalidateFriends()

  return useMutation({
    mutationFn: ({ id, accept }: { id: string; accept: boolean }) =>
      friendsApi.respond(id, accept),
    onSuccess: async (_result, { accept }) => {
      toast.success(accept ? t('toast.nowFriends') : t('toast.requestDeclined'))
      await invalidate()
    },
    onError: (error) => toast.error(toLocalisedMessage(t, error)),
  })
}

export function useRemoveFriend() {
  const { t } = useI18n()
  const invalidate = useInvalidateFriends()

  return useMutation({
    mutationFn: (userId: string) => friendsApi.remove(userId),
    onSuccess: async () => {
      toast.success(t('toast.friendRemoved'))
      await invalidate()
    },
    onError: (error) => toast.error(toLocalisedMessage(t, error)),
  })
}
