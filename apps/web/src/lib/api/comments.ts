import { http } from './client'
import type { Comment, Envelope } from '@/types/api'

export const commentsApi = {
  async create(payload: {
    content: string
    post: string

    parent?: string
  }): Promise<Comment> {
    const { data } = await http.post<Envelope<Comment>>('/comments', payload)
    return data.data
  },

  async update(id: string, content: string): Promise<Comment> {
    const { data } = await http.patch<Envelope<Comment>>(`/comments/${id}`, { content })
    return data.data
  },

  async remove(id: string): Promise<void> {
    await http.delete(`/comments/${id}`)
  },
}
