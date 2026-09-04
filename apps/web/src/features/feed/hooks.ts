import { useInfiniteQuery } from '@tanstack/react-query'
import { postsApi } from '@/lib/api/posts'
import { queryKeys } from '@/lib/queryKeys'


export function useFeed() {
  return useInfiniteQuery({
    queryKey: queryKeys.feed(),
    queryFn: ({ pageParam }) => postsApi.feed(pageParam),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => lastPage.nextPage,
  })
}
