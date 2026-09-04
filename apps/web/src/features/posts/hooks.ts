import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { postsApi } from '@/lib/api/posts'
import { queryKeys } from '@/lib/queryKeys'
import type { PostPayload } from '@/types/api'
import { toLocalisedMessage, useI18n } from '@/i18n'


function useInvalidatePosts() {
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({ queryKey: queryKeys.posts() })
}

export function usePost(id: string) {
  return useQuery({


    queryKey: queryKeys.post(id),
    queryFn: () => postsApi.byId(id),
    enabled: Boolean(id),
  })
}


export function useMentionedPosts() {
  return useInfiniteQuery({
    queryKey: queryKeys.mentions(),
    queryFn: ({ pageParam }) => postsApi.mentions(pageParam),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => lastPage.nextPage,
  })
}

export function useUserPosts(userId: string | undefined) {
  return useInfiniteQuery({
    queryKey: queryKeys.userPosts(userId ?? 'unknown'),
    queryFn: ({ pageParam }) => postsApi.byUser(userId as string, pageParam),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => lastPage.nextPage,
    enabled: Boolean(userId),
  })
}

export function useCreatePost() {
  const { t } = useI18n()
  const invalidate = useInvalidatePosts()
  return useMutation({
    mutationFn: (payload: PostPayload) => postsApi.create(payload),
    onSuccess: async () => {
      toast.success(t('toast.postShared'))
      await invalidate()
    },
    onError: (error) => toast.error(toLocalisedMessage(t, error)),
  })
}

export function useUpdatePost(id: string) {
  const { t } = useI18n()
  const invalidate = useInvalidatePosts()
  return useMutation({
    mutationFn: (payload: PostPayload) => postsApi.update(id, payload),
    onSuccess: async () => {
      toast.success(t('toast.postUpdated'))
      await invalidate()
    },
    onError: (error) => toast.error(toLocalisedMessage(t, error)),
  })
}

export function useDeletePost() {
  const { t } = useI18n()
  const invalidate = useInvalidatePosts()
  return useMutation({
    mutationFn: (id: string) => postsApi.remove(id),
    onSuccess: async () => {
      toast.success(t('toast.postDeleted'))
      await invalidate()
    },
    onError: (error) => toast.error(toLocalisedMessage(t, error)),
  })
}
