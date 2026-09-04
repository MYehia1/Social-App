export const queryKeys = {
  all: ['echoo'] as const,

  currentUser: () => [...queryKeys.all, 'currentUser'] as const,

  posts: () => [...queryKeys.all, 'posts'] as const,
  feed: () => [...queryKeys.posts(), 'feed'] as const,
  post: (id: string) => [...queryKeys.posts(), 'detail', id] as const,
  userPosts: (userId: string) => [...queryKeys.posts(), 'byUser', userId] as const,
  mentions: () => [...queryKeys.posts(), 'mentions'] as const,

  notifications: () => [...queryKeys.all, 'notifications'] as const,
  notificationList: () => [...queryKeys.notifications(), 'list'] as const,
  unreadCount: () => [...queryKeys.notifications(), 'unreadCount'] as const,

  friends: () => [...queryKeys.all, 'friends'] as const,
  friendList: () => [...queryKeys.friends(), 'list'] as const,
  incomingRequests: () => [...queryKeys.friends(), 'incoming'] as const,
  outgoingRequests: () => [...queryKeys.friends(), 'outgoing'] as const,
  suggestions: () => [...queryKeys.friends(), 'suggestions'] as const,

  userSearch: (term: string) => [...queryKeys.all, 'userSearch', term] as const,
  profile: (username: string) => [...queryKeys.all, 'profile', username] as const,
}
