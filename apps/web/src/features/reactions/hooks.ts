import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { toLocalisedMessage, useI18n } from '@/i18n'
import { reactionsApi } from '@/lib/api/social'
import { queryKeys } from '@/lib/queryKeys'
import type { Page, Post, ReactionSummary, ReactionType } from '@/types/api'

type InfinitePosts = { pages: Array<Page<Post>>; pageParams: unknown[] }
type PostDetail = { post: Post; comments: unknown[] }


function applySummary(postId: string, summary: ReactionSummary) {
  return (data: unknown): unknown => {
    if (!data) return data

    const merge = (post: Post): Post =>
      post.id === postId ? { ...post, ...summary } : post


    if (typeof data === 'object' && 'pages' in data) {
      const infinite = data as InfinitePosts
      return {
        ...infinite,
        pages: infinite.pages.map((page) => ({
          ...page,
          items: page.items.map(merge),
        })),
      }
    }


    if (typeof data === 'object' && 'post' in data) {
      const detail = data as PostDetail
      return { ...detail, post: merge(detail.post) }
    }

    return data
  }
}


export function useToggleReaction() {
  const { t } = useI18n()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ postId, type }: { postId: string; type: ReactionType }) =>
      reactionsApi.toggle(postId, type),

    onMutate: async ({ postId, type }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.posts() })
      const previous = queryClient.getQueriesData({ queryKey: queryKeys.posts() })



      queryClient.setQueriesData({ queryKey: queryKeys.posts() }, (data: unknown) => {
        const findPost = (): Post | null => {
          if (!data || typeof data !== 'object') return null
          if ('pages' in data) {
            for (const page of (data as InfinitePosts).pages) {
              const hit = page.items.find((p) => p.id === postId)
              if (hit) return hit
            }
            return null
          }
          if ('post' in data) {
            const detail = data as PostDetail
            return detail.post.id === postId ? detail.post : null
          }
          return null
        }

        const post = findPost()
        if (!post) return data

        const counts = { ...post.reactions }
        const mine = post.myReaction

        if (mine) counts[mine] = Math.max(0, (counts[mine] ?? 1) - 1)

        const next = mine === type ? null : type
        if (next) counts[next] = (counts[next] ?? 0) + 1

        for (const key of Object.keys(counts) as ReactionType[]) {
          if (!counts[key]) delete counts[key]
        }

        return applySummary(postId, {
          reactions: counts,
          reactionTotal: Object.values(counts).reduce((sum, n) => sum + (n ?? 0), 0),
          myReaction: next,
        })(data)
      })

      return { previous }
    },

    onError: (error, _variables, context) => {

      context?.previous.forEach(([key, data]) => queryClient.setQueryData(key, data))
      toast.error(toLocalisedMessage(t, error))
    },


    onSuccess: (summary, { postId }) => {
      queryClient.setQueriesData(
        { queryKey: queryKeys.posts() },
        applySummary(postId, summary),
      )
    },
  })
}


export function usePostReactions(postId: string, enabled: boolean) {
  return useQuery({
    queryKey: [...queryKeys.posts(), 'reactions', postId],
    queryFn: () => reactionsApi.listForPost(postId),
    enabled,
  })
}
