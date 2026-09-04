import { http } from './client'
import type { Comment, Envelope, Page, Post, PostPayload } from '@/types/api'

const PAGE_SIZE = 10

function toForm({ body, image, video }: PostPayload): FormData {
  const form = new FormData()
  form.append('body', body)

  if (image) form.append('image', image)
  if (video) form.append('video', video)
  return form
}

function toPage(data: Envelope<Post[]>): Page<Post> {
  return {
    items: data.data,
    nextPage: data.meta?.hasNextPage ? data.meta.page + 1 : null,
  }
}

export const postsApi = {
  async feed(page: number): Promise<Page<Post>> {
    const { data } = await http.get<Envelope<Post[]>>('/posts', {
      params: { page, limit: PAGE_SIZE },
    })
    return toPage(data)
  },

  async mentions(page: number): Promise<Page<Post>> {
    const { data } = await http.get<Envelope<Post[]>>('/posts/mentions', {
      params: { page, limit: PAGE_SIZE },
    })
    return toPage(data)
  },

  async byUser(userId: string, page: number): Promise<Page<Post>> {
    const { data } = await http.get<Envelope<Post[]>>(`/users/${userId}/posts`, {
      params: { page, limit: PAGE_SIZE },
    })
    return toPage(data)
  },

  async byId(id: string): Promise<{ post: Post; comments: Comment[] }> {
    const { data } = await http.get<Envelope<{ post: Post; comments: Comment[] }>>(
      `/posts/${id}`,
    )
    return data.data
  },

  async create(payload: PostPayload): Promise<Post> {
    const { data } = await http.post<Envelope<Post>>('/posts', toForm(payload))
    return data.data
  },

  async update(id: string, payload: PostPayload): Promise<Post> {
    const { data } = await http.patch<Envelope<Post>>(`/posts/${id}`, toForm(payload))
    return data.data
  },

  async remove(id: string): Promise<void> {
    await http.delete(`/posts/${id}`)
  },
}
