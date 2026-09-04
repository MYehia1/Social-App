import { FriendshipStatusEnum, NotificationEnum } from '../../common/enums'
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '../../common/exceptions'
import { FriendshipRepository, UserRepository } from '../../DB/repository'
import type { Types } from 'mongoose'
import { UserModel, type UserDocument } from '../../DB/models'
import { notificationService } from '../notifications/notification.service'
import { toPublicAuthor, type PublicAuthor } from '../posts/post.mapper'

const USER_SELECT = 'name username photo'

/** How the viewer relates to another profile, for rendering the right button. */
export type FriendState =
  | 'none'
  | 'friends'
  | 'request_sent'
  | 'request_received'
  | 'self'

export interface PublicFriendRequest {
  id: string
  user: PublicAuthor
  createdAt: string | null
}

class FriendService {
  private readonly friendshipRepository = new FriendshipRepository()
  private readonly userRepository = new UserRepository()

  async sendRequest(requesterId: string, targetUserId: string) {
    if (requesterId === targetUserId) {
      throw new BadRequestException('You cannot send yourself a friend request')
    }

    const target = await this.userRepository.findById(targetUserId)
    if (!target) throw new NotFoundException('Account not found')

    const existing = await this.friendshipRepository.findBetween(requesterId, targetUserId)

    if (existing) {
      if (existing.status === FriendshipStatusEnum.ACCEPTED) {
        throw new ConflictException('You are already friends')
      }
      // They already asked you — treat a second request as accepting theirs,
      // which is what the user actually means.
      if (existing.requester.toString() === targetUserId) {
        return this.respond(existing._id.toString(), requesterId, true)
      }
      throw new ConflictException('A request is already pending')
    }

    await this.friendshipRepository.create({
      requester: requesterId,
      recipient: targetUserId,
      status: FriendshipStatusEnum.PENDING,
    })

    await notificationService.create({
      recipient: targetUserId,
      actor: requesterId,
      type: NotificationEnum.FRIEND_REQUEST,
    })

    return { state: 'request_sent' as FriendState }
  }

  /** Accept or decline a request addressed to the current user. */
  async respond(requestId: string, userId: string, accept: boolean) {
    const request = await this.friendshipRepository.findOne({
      _id: requestId,
      recipient: userId,
      status: FriendshipStatusEnum.PENDING,
    })

    if (!request) throw new NotFoundException('Friend request not found')

    if (!accept) {
      await this.friendshipRepository.deleteOne({ _id: request._id })
      return { state: 'none' as FriendState }
    }

    request.status = FriendshipStatusEnum.ACCEPTED
    request.respondedAt = new Date()
    await request.save()

    // Both denormalized counters move together.
    await UserModel.updateMany(
      { _id: { $in: [request.requester, request.recipient] } },
      { $inc: { friendCount: 1 } },
    )

    await notificationService.create({
      recipient: request.requester,
      actor: userId,
      type: NotificationEnum.FRIEND_ACCEPTED,
    })

    return { state: 'friends' as FriendState }
  }

  async removeFriend(userId: string, otherUserId: string) {
    const friendship = await this.friendshipRepository.findBetween(userId, otherUserId)
    if (!friendship) throw new NotFoundException('You are not friends with this person')

    const wasAccepted = friendship.status === FriendshipStatusEnum.ACCEPTED
    await this.friendshipRepository.deleteOne({ _id: friendship._id })

    if (wasAccepted) {
      await UserModel.updateMany(
        { _id: { $in: [friendship.requester, friendship.recipient] } },
        // Guarded so a double-delete race cannot drive the count negative.
        { $inc: { friendCount: -1 } },
      )
    }

    return { state: 'none' as FriendState }
  }

  /** Ids of everyone the user is actually friends with. */
  async friendIds(userId: string): Promise<Types.ObjectId[]> {
    const rows = await this.friendshipRepository.findAccepted(userId)
    return rows.map((row) =>
      row.requester.toString() === userId ? row.recipient : row.requester,
    )
  }

  /** The viewer's relationship to another user. */
  async stateBetween(viewerId: string, otherId: string): Promise<FriendState> {
    if (viewerId === otherId) return 'self'

    const friendship = await this.friendshipRepository.findBetween(viewerId, otherId)
    if (!friendship) return 'none'
    if (friendship.status === FriendshipStatusEnum.ACCEPTED) return 'friends'

    return friendship.requester.toString() === viewerId
      ? 'request_sent'
      : 'request_received'
  }

  /** Accepted friends of a user. */
  async listFriends(userId: string, page: number, limit: number) {
    const result = await this.friendshipRepository.paginate({
      filter: this.friendshipRepository.acceptedFilter(userId),
      page,
      limit,
      sort: { respondedAt: -1 },
      populate: [
        { path: 'requester', select: USER_SELECT },
        { path: 'recipient', select: USER_SELECT },
      ],
    })

    const { items, ...meta } = result

    return {
      // Each row holds both sides; the friend is whichever one is not the viewer.
      items: items.map((row) => {
        const requester = row.requester as unknown as UserDocument
        const other =
          requester._id.toString() === userId
            ? (row.recipient as unknown as UserDocument)
            : requester
        return toPublicAuthor(other)
      }),
      meta,
    }
  }

  /** Requests waiting on the current user. */
  async listIncoming(userId: string, page: number, limit: number) {
    const result = await this.friendshipRepository.paginate({
      filter: { recipient: userId, status: FriendshipStatusEnum.PENDING },
      page,
      limit,
      sort: { createdAt: -1 },
      populate: { path: 'requester', select: USER_SELECT },
    })

    const { items, ...meta } = result

    return {
      items: items.map(
        (row): PublicFriendRequest => ({
          id: row._id.toString(),
          user: toPublicAuthor(row.requester as unknown as UserDocument),
          createdAt: row.createdAt?.toISOString() ?? null,
        }),
      ),
      meta,
    }
  }

  /** Requests the current user has sent and that are still pending. */
  async listOutgoing(userId: string, page: number, limit: number) {
    const result = await this.friendshipRepository.paginate({
      filter: { requester: userId, status: FriendshipStatusEnum.PENDING },
      page,
      limit,
      sort: { createdAt: -1 },
      populate: { path: 'recipient', select: USER_SELECT },
    })

    const { items, ...meta } = result

    return {
      items: items.map(
        (row): PublicFriendRequest => ({
          id: row._id.toString(),
          user: toPublicAuthor(row.recipient as unknown as UserDocument),
          createdAt: row.createdAt?.toISOString() ?? null,
        }),
      ),
      meta,
    }
  }

  /** People the viewer is not yet connected to, for the discovery list. */
  async suggestions(userId: string, limit: number) {
    const related = await this.friendshipRepository.findAllForUser(userId)

    const excluded = new Set<string>([userId])
    for (const row of related) {
      excluded.add(row.requester.toString())
      excluded.add(row.recipient.toString())
    }

    const users = await UserModel.find({ _id: { $nin: [...excluded] } })
      .select(USER_SELECT)
      .limit(limit)

    return users.map(toPublicAuthor)
  }
}

export const friendService = new FriendService()
