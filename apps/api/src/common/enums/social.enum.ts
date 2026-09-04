/** The reactions a user can leave on a post. One per user per post. */
export enum ReactionEnum {
  LIKE = 'like',
  LOVE = 'love',
  HAHA = 'haha',
  WOW = 'wow',
  SAD = 'sad',
  ANGRY = 'angry',
}

export enum NotificationEnum {
  /** Someone @mentioned you in a post or a comment. */
  MENTION_POST = 'mention_post',
  MENTION_COMMENT = 'mention_comment',
  /** Someone commented on, or reacted to, something of yours. */
  COMMENT = 'comment',
  /** Someone replied to your comment, rather than to the post itself. */
  REPLY = 'reply',
  REACTION = 'reaction',
  /** Friend lifecycle. */
  FRIEND_REQUEST = 'friend_request',
  FRIEND_ACCEPTED = 'friend_accepted',
}

export enum FriendshipStatusEnum {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
}
