import { http } from './client'
import type {
  Envelope,
  FriendState,
  MentionSuggestion,
  ProfilePayload,
  User,
} from '@/types/api'

export const usersApi = {
  async uploadPhoto(photo: File): Promise<User> {
    const form = new FormData()
    form.append('photo', photo)
    const { data } = await http.put<Envelope<{ user: User }>>('/users/me/photo', form)
    return data.data.user
  },

  async uploadCover(cover: File): Promise<User> {
    const form = new FormData()
    form.append('cover', cover)
    const { data } = await http.put<Envelope<{ user: User }>>('/users/me/cover', form)
    return data.data.user
  },

  async updateProfile(payload: ProfilePayload): Promise<User> {
    const { data } = await http.patch<Envelope<{ user: User }>>('/users/me', payload)
    return data.data.user
  },

  async search(q: string): Promise<MentionSuggestion[]> {
    const { data } = await http.get<Envelope<MentionSuggestion[]>>('/users/search', {
      params: { q, limit: 6 },
    })
    return data.data
  },

  async byUsername(username: string): Promise<{ user: User; friendState: FriendState }> {
    const { data } = await http.get<Envelope<{ user: User; friendState: FriendState }>>(
      `/users/by-username/${username}`,
    )
    return data.data
  },
}
