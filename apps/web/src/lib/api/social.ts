import { http } from './client'
import type {
  Author,
  Envelope,
  FriendRequest,
  FriendState,
  Notification,
  Page,
  ReactionSummary,
  ReactionType,
} from '@/types/api'

function toPage<T>(data: Envelope<T[]>): Page<T> {
  return {
    items: data.data,
    nextPage: data.meta?.hasNextPage ? data.meta.page + 1 : null,
  }
}

export const reactionsApi = {

  async toggle(postId: string, type: ReactionType): Promise<ReactionSummary> {
    const { data } = await http.put<Envelope<ReactionSummary>>(`/reactions/${postId}`, {
      type,
    })
    return data.data
  },

  async listForPost(postId: string): Promise<Array<{ type: ReactionType; user: Author }>> {
    const { data } = await http.get<Envelope<Array<{ type: ReactionType; user: Author }>>>(
      `/reactions/${postId}`,
      { params: { limit: 20 } },
    )
    return data.data
  },
}

export const notificationsApi = {
  async list(page: number): Promise<Page<Notification>> {
    const { data } = await http.get<Envelope<Notification[]>>('/notifications', {
      params: { page, limit: 20 },
    })
    return toPage(data)
  },

  async unreadCount(): Promise<number> {
    const { data } = await http.get<Envelope<{ count: number }>>(
      '/notifications/unread-count',
    )
    return data.data.count
  },

  async markAllRead(): Promise<void> {
    await http.patch('/notifications/read-all')
  },

  async markRead(id: string): Promise<void> {
    await http.patch(`/notifications/${id}/read`)
  },
}

export const friendsApi = {
  async list(page: number): Promise<Page<Author>> {
    const { data } = await http.get<Envelope<Author[]>>('/friends', {
      params: { page, limit: 20 },
    })
    return toPage(data)
  },

  async incoming(page: number): Promise<Page<FriendRequest>> {
    const { data } = await http.get<Envelope<FriendRequest[]>>(
      '/friends/requests/incoming',
      { params: { page, limit: 20 } },
    )
    return toPage(data)
  },

  async outgoing(page: number): Promise<Page<FriendRequest>> {
    const { data } = await http.get<Envelope<FriendRequest[]>>(
      '/friends/requests/outgoing',
      { params: { page, limit: 20 } },
    )
    return toPage(data)
  },

  async suggestions(): Promise<Author[]> {
    const { data } = await http.get<Envelope<Author[]>>('/friends/suggestions')
    return data.data
  },

  async sendRequest(userId: string): Promise<{ state: FriendState }> {
    const { data } = await http.post<Envelope<{ state: FriendState }>>(
      `/friends/requests/${userId}`,
    )
    return data.data
  },

  async respond(requestId: string, accept: boolean): Promise<{ state: FriendState }> {
    const { data } = await http.patch<Envelope<{ state: FriendState }>>(
      `/friends/requests/${requestId}`,
      { accept },
    )
    return data.data
  },

  async remove(userId: string): Promise<{ state: FriendState }> {
    const { data } = await http.delete<Envelope<{ state: FriendState }>>(
      `/friends/${userId}`,
    )
    return data.data
  },
}
