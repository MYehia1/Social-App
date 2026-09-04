import { useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { commentsApi } from '@/lib/api/comments'
import { queryKeys } from '@/lib/queryKeys'
import { toLocalisedMessage, useI18n } from '@/i18n'


function useInvalidatePosts() {
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({ queryKey: queryKeys.posts() })
}

export function useCreateComment() {
  const { t } = useI18n()
  const invalidate = useInvalidatePosts()
  return useMutation({
    mutationFn: (payload: { content: string; post: string; parent?: string }) =>
      commentsApi.create(payload),
    onSuccess: () => invalidate(),
    onError: (error) => toast.error(toLocalisedMessage(t, error)),
  })
}

export function useUpdateComment() {
  const { t } = useI18n()
  const invalidate = useInvalidatePosts()
  return useMutation({
    mutationFn: ({ id, content }: { id: string; content: string }) =>
      commentsApi.update(id, content),
    onSuccess: async () => {
      toast.success(t('toast.commentUpdated'))
      await invalidate()
    },
    onError: (error) => toast.error(toLocalisedMessage(t, error)),
  })
}

export function useDeleteComment() {
  const { t } = useI18n()
  const invalidate = useInvalidatePosts()
  return useMutation({
    mutationFn: (id: string) => commentsApi.remove(id),
    onSuccess: async () => {
      toast.success(t('toast.commentDeleted'))
      await invalidate()
    },
    onError: (error) => toast.error(toLocalisedMessage(t, error)),
  })
}
