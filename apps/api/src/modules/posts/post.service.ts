import { ForbiddenException, NotFoundException } from '../../common/exceptions'
import { NotificationEnum } from '../../common/enums'
import { resolveMentions } from '../../common/mentions'
import { deleteImage, deleteVideo, uploadImage, uploadVideo } from '../../common/storage'
import { CommentRepository, PostRepository, ReactionRepository } from '../../DB/repository'
import type { PostDocument } from '../../DB/models'
import { toPublicComment } from '../comments/comment.mapper'
import { notificationService } from '../notifications/notification.service'
import { toPublicPost, type PublicPost } from './post.mapper'

const AUTHOR_POPULATE = { path: 'author', select: 'name username photo' }

export interface Paginated<T> {
  items: T[]
  meta: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNextPage: boolean
  }
}

export interface UploadedFiles {
  image?: Express.Multer.File | undefined
  video?: Express.Multer.File | undefined
}

class PostService {
  private readonly postRepository = new PostRepository()
  private readonly commentRepository = new CommentRepository()
  private readonly reactionRepository = new ReactionRepository()

  /** Soft-deleted posts are excluded from every read path. */
  private readonly visible = { deletedAt: { $exists: false } }

  /**
   * Looks up the viewer's own reactions for a whole page of posts in one
   * query, rather than one lookup per row.
   */
  private async myReactions(postIds: string[], userId: string) {
    if (postIds.length === 0) return new Map<string, string>()

    const rows = await this.reactionRepository.findForUser(postIds, userId)
    return new Map(rows.map((row) => [row.post.toString(), row.type]))
  }

  private async paginate(
    filter: Record<string, unknown>,
    page: number,
    limit: number,
    viewerId: string,
  ): Promise<Paginated<PublicPost>> {
    const result = await this.postRepository.paginate({
      filter,
      page,
      limit,
      sort: { createdAt: -1 },
      populate: AUTHOR_POPULATE,
    })

    const { items, ...meta } = result
    const mine = await this.myReactions(
      items.map((post) => post._id.toString()),
      viewerId,
    )

    return {
      items: items.map((post) =>
        toPublicPost(post, mine.get(post._id.toString()) ?? null),
      ),
      meta,
    }
  }

  feed(page: number, limit: number, viewerId: string) {
    return this.paginate(this.visible, page, limit, viewerId)
  }

  byAuthor(userId: string, page: number, limit: number, viewerId: string) {
    return this.paginate({ ...this.visible, author: userId }, page, limit, viewerId)
  }

  /** Posts the viewer was @mentioned in. */
  mentioning(userId: string, page: number, limit: number) {
    return this.paginate({ ...this.visible, mentions: userId }, page, limit, userId)
  }

  private async findVisibleOrFail(id: string): Promise<PostDocument> {
    const post = await this.postRepository
      .findOne({ _id: id, ...this.visible })
      .populate(AUTHOR_POPULATE)

    if (!post) throw new NotFoundException('Post not found')
    return post
  }

  async detail(id: string, viewerId: string) {
    const post = await this.findVisibleOrFail(id)
    const comments = await this.commentRepository.findByPost(id)
    const mine = await this.myReactions([id], viewerId)

    return {
      post: toPublicPost(post, mine.get(id) ?? null),
      comments: comments.map(toPublicComment),
    }
  }

  private storeMedia(files: UploadedFiles) {
    return Promise.all([
      files.image ? uploadImage(files.image.buffer, 'posts') : null,
      files.video ? uploadVideo(files.video.buffer, 'posts') : null,
    ])
  }

  async create(authorId: string, body: string, files: UploadedFiles) {
    const [[image, video], mentions] = await Promise.all([
      this.storeMedia(files),
      resolveMentions(body, authorId),
    ])

    const post = await this.postRepository.create({
      body,
      author: authorId,
      mentions,
      ...(image ? { image: image.url, imagePublicId: image.publicId } : {}),
      ...(video ? { video: video.url, videoPublicId: video.publicId } : {}),
    })

    await notificationService.createMentions(
      mentions,
      authorId,
      NotificationEnum.MENTION_POST,
      { post: post._id.toString() },
    )

    await post.populate(AUTHOR_POPULATE)
    return toPublicPost(post)
  }

  /** Ownership is enforced here, so no route can forget to check it. */
  private async findOwnedOrFail(id: string, userId: string): Promise<PostDocument> {
    const post = await this.postRepository.findOne({ _id: id, ...this.visible })
    if (!post) throw new NotFoundException('Post not found')
    if (post.author.toString() !== userId) {
      throw new ForbiddenException('You can only modify your own posts')
    }
    return post
  }

  async update(id: string, userId: string, body: string, files: UploadedFiles) {
    const post = await this.findOwnedOrFail(id, userId)

    post.body = body
    post.mentions = await resolveMentions(body, userId)

    const [image, video] = await this.storeMedia(files)

    if (image) {
      const previous = post.imagePublicId
      post.image = image.url
      post.imagePublicId = image.publicId
      // Replace first, then clean up, so a failed delete cannot lose the post.
      if (previous) await deleteImage(previous)
    }
    if (video) {
      const previous = post.videoPublicId
      post.video = video.url
      post.videoPublicId = video.publicId
      if (previous) await deleteVideo(previous)
    }

    await post.save()
    await post.populate(AUTHOR_POPULATE)

    const mine = await this.myReactions([id], userId)
    return toPublicPost(post, mine.get(id) ?? null)
  }

  async remove(id: string, userId: string): Promise<void> {
    const post = await this.findOwnedOrFail(id, userId)

    // Soft delete: the row stays for auditing and can be restored, while
    // every read path filters it out.
    post.deletedAt = new Date()
    await post.save()
  }
}

export const postService = new PostService()
