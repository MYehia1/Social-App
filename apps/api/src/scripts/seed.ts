/**
 * Seeds a small, believable dataset so the live demo is never an empty feed.
 *
 * It exercises every feature — mentions, reactions, comments, friendships,
 * pending requests and notifications — so a first-time visitor sees a working
 * product rather than a blank shell.
 *
 * Safe to re-run: it clears only the collections it owns, then recreates them.
 */
import mongoose, { type Types } from 'mongoose'
import { env } from '../config/config'
import { connectDB, disconnectDB } from '../DB/connection.db'
import {
  CommentModel,
  FriendshipModel,
  NotificationModel,
  PostModel,
  ReactionModel,
  UserModel,
} from '../DB/models'
import {
  FriendshipStatusEnum,
  GenderEnum,
  NotificationEnum,
  ReactionEnum,
} from '../common/enums'
import { extractHandles } from '../common/mentions'
import { hashPassword } from '../common/security'

const PASSWORD = env.DEMO_PASSWORD ?? 'Demo@1234'
const HOUR = 60 * 60 * 1000

const people = [
  {
    name: 'Mahmoud Yehia',
    username: 'mahmoud',
    dateOfBirth: new Date('1999-03-14'),
    email: env.DEMO_EMAIL ?? 'demo@echoo.app',
    gender: GenderEnum.MALE,
    bio: 'Full-stack developer. Builds things at 4am.',
  },
  {
    name: 'Nour Hassan',
    username: 'nour',
    dateOfBirth: new Date('1997-11-02'),
    email: 'nour@echoo.app',
    gender: GenderEnum.FEMALE,
    bio: 'Frontend engineer. Opinionated about spacing.',
  },
  {
    name: 'Omar Fathy',
    username: 'omar',
    dateOfBirth: new Date('1995-06-21'),
    email: 'omar@echoo.app',
    gender: GenderEnum.MALE,
    bio: 'Backend and databases. Ask me about indexes.',
  },
  {
    name: 'Salma Adel',
    username: 'salma',
    dateOfBirth: new Date('2000-01-09'),
    email: 'salma@echoo.app',
    gender: GenderEnum.FEMALE,
    bio: 'Product designer. Makes the pixels behave.',
  },
  {
    name: 'Youssef Kamal',
    username: 'youssef',
    dateOfBirth: new Date('2001-08-30'),
    email: 'youssef@echoo.app',
    gender: GenderEnum.MALE,
    bio: 'Learning React. Shipping anyway.',
  },
  {
    name: 'Habiba Sherif',
    username: 'habiba',
    dateOfBirth: new Date('1996-04-17'),
    email: 'habiba@echoo.app',
    gender: GenderEnum.FEMALE,
    bio: 'Data engineer. Pipelines and coffee.',
  },
  {
    name: 'Karim Nabil',
    username: 'karim',
    dateOfBirth: new Date('1994-12-05'),
    email: 'karim@echoo.app',
    gender: GenderEnum.MALE,
    bio: 'Mobile developer. Swift and Kotlin.',
  },
  {
    name: 'Farida Tarek',
    username: 'farida',
    dateOfBirth: new Date('1998-09-23'),
    email: 'farida@echoo.app',
    gender: GenderEnum.FEMALE,
    bio: 'QA engineer. I will find your edge case.',
  },
]

const bodies = [
  'Shipped the first version of Echoo tonight. Three cups of tea and a lot of TypeScript.',
  'Huge thanks to @nour for the design review and @omar for catching the N+1 in the feed query.',
  'Hot take: a good error message is worth more than three clever abstractions.',
  'Finally understood why everyone insists on parameterized cache keys. Learned that one the hard way.',
  'Alexandria in September is unreasonably beautiful. Went for a walk and stayed out three hours.',
  'Spent the morning adding indexes to a collection doing full scans. 400ms down to 6ms.',
  'Reading about how feeds are built at scale. Fan-out on write is wild once you see the numbers.',
  'Dark mode was the single most requested thing from everyone I showed this to. Fair enough.',
  'Anyone else think @salma undersells how much of this UI was her idea?',
  'Reminder to self: commit early, commit often, and never at 4am without reading the diff.',
  'If anyone wants a walkthrough of the auth flow, ask @mahmoud — the refresh-token handling is worth reading.',
  'Pairing with @mahmoud on the notifications work tomorrow. Bringing the good coffee.',
]

const replies = [
  'This is genuinely great work.',
  'Congrats! How long did it take you?',
  'Saving this one.',
  'Been there. Painful lesson but you never forget it.',
  'The indexes thing gets everyone eventually.',
  'Looks clean. Nice job on the typography.',
]

const REACTION_TYPES = Object.values(ReactionEnum)

async function seed(): Promise<void> {
  await connectDB()

  await Promise.all([
    UserModel.deleteMany({}),
    PostModel.deleteMany({}),
    CommentModel.deleteMany({}),
    ReactionModel.deleteMany({}),
    NotificationModel.deleteMany({}),
    FriendshipModel.deleteMany({}),
  ])

  /* ---------------- users ---------------- */

  const hash = await hashPassword(PASSWORD)
  const users = await UserModel.insertMany(
    people.map((person) => ({ ...person, password: hash, confirmedAt: new Date() })),
  )

  const byUsername = new Map(users.map((user) => [user.username, user._id]))
  const demo = users[0]!
  const now = Date.now()

  /* ---------------- posts ---------------- */

  const posts = await PostModel.insertMany(
    bodies.map((body, index) => ({
      body,
      author: users[index % users.length]!._id,
      // Resolve @handles the same way the live service does, so mentions in
      // seeded posts behave exactly like user-written ones.
      mentions: extractHandles(body)
        .map((handle) => byUsername.get(handle))
        .filter((id): id is Types.ObjectId => Boolean(id)),
      // Spread posts back through the last few days so relative timestamps
      // look natural rather than all saying "just now".
      createdAt: new Date(now - index * 7 * HOUR),
      updatedAt: new Date(now - index * 7 * HOUR),
    })),
    { timestamps: false },
  )

  /* ---------------- reactions ---------------- */

  const reactions: Array<Record<string, unknown>> = []
  const tallies = new Map<string, Map<string, number>>()

  posts.forEach((post, postIndex) => {
    const counts = new Map<string, number>()
    // A deterministic spread: earlier posts get more reactions.
    const reactorCount = ((postIndex * 3) % users.length) + 1

    for (let i = 0; i < reactorCount; i += 1) {
      const user = users[(postIndex + i + 1) % users.length]!
      if (user._id.equals(post.author)) continue

      const type = REACTION_TYPES[(postIndex + i) % REACTION_TYPES.length]!
      reactions.push({ post: post._id, user: user._id, type })
      counts.set(type, (counts.get(type) ?? 0) + 1)
    }
    tallies.set(post._id.toString(), counts)
  })

  await ReactionModel.insertMany(reactions)
  await Promise.all(
    posts.map((post) =>
      PostModel.updateOne(
        { _id: post._id },
        { reactionCounts: tallies.get(post._id.toString()) ?? new Map() },
      ),
    ),
  )

  /* ---------------- comments ---------------- */

  const comments = posts.flatMap((post, index) =>
    Array.from({ length: (index % 3) + 1 }, (_unused, offset) => ({
      content: replies[(index + offset) % replies.length]!,
      post: post._id,
      author: users[(index + offset + 1) % users.length]!._id,
      mentions: [],
      createdAt: new Date(now - index * 6 * HOUR + offset * 60_000),
      updatedAt: new Date(now - index * 6 * HOUR + offset * 60_000),
    })),
  )

  await CommentModel.insertMany(comments, { timestamps: false })
  await Promise.all(
    posts.map((post) =>
      PostModel.updateOne(
        { _id: post._id },
        { commentCount: comments.filter((c) => c.post.equals(post._id)).length },
      ),
    ),
  )

  /* ---------------- friendships ---------------- */

  // The demo account is friends with two people and has one request waiting,
  // so both the friends list and the requests page have something to show.
  const friends = [users[1]!, users[2]!]

  await FriendshipModel.insertMany([
    ...friends.map((friend) => ({
      requester: demo._id,
      recipient: friend._id,
      status: FriendshipStatusEnum.ACCEPTED,
      respondedAt: new Date(now - 3 * HOUR),
    })),
    {
      requester: users[3]!._id,
      recipient: demo._id,
      status: FriendshipStatusEnum.PENDING,
    },
    {
      requester: users[4]!._id,
      recipient: demo._id,
      status: FriendshipStatusEnum.PENDING,
    },
  ])

  await UserModel.updateMany(
    { _id: { $in: [demo._id, ...friends.map((f) => f._id)] } },
    { $inc: { friendCount: 1 } },
  )
  // The demo account is on both accepted rows, so it counts twice.
  await UserModel.updateOne({ _id: demo._id }, { $inc: { friendCount: 1 } })

  /* ---------------- notifications ---------------- */

  const mentionPost = posts.find((post) => post.mentions.length > 0)

  await NotificationModel.insertMany([
    {
      recipient: demo._id,
      actor: users[1]!._id,
      type: NotificationEnum.REACTION,
      post: posts[0]!._id,
      createdAt: new Date(now - 20 * 60_000),
      updatedAt: new Date(now - 20 * 60_000),
    },
    {
      recipient: demo._id,
      actor: users[2]!._id,
      type: NotificationEnum.COMMENT,
      post: posts[0]!._id,
      createdAt: new Date(now - 90 * 60_000),
      updatedAt: new Date(now - 90 * 60_000),
    },
    ...(mentionPost
      ? [
          {
            recipient: demo._id,
            actor: users[3]!._id,
            type: NotificationEnum.MENTION_POST,
            post: mentionPost._id,
            createdAt: new Date(now - 4 * HOUR),
            updatedAt: new Date(now - 4 * HOUR),
          },
        ]
      : []),
    {
      recipient: demo._id,
      actor: users[3]!._id,
      type: NotificationEnum.FRIEND_REQUEST,
      createdAt: new Date(now - 5 * HOUR),
      updatedAt: new Date(now - 5 * HOUR),
    },
    {
      recipient: demo._id,
      actor: users[1]!._id,
      type: NotificationEnum.FRIEND_ACCEPTED,
      readAt: new Date(now - 2 * HOUR),
      createdAt: new Date(now - 3 * HOUR),
      updatedAt: new Date(now - 3 * HOUR),
    },
  ], { timestamps: false })

  console.log(
    `Seeded ${users.length} users, ${posts.length} posts, ${comments.length} comments, ` +
      `${reactions.length} reactions, 4 friendships, 5 notifications.`,
  )
  console.log(`Demo login: ${people[0]!.email} / ${PASSWORD}`)

  await disconnectDB()
}

seed().catch(async (error: unknown) => {
  console.error('Seed failed:', error)
  await mongoose.connection.close().catch(() => undefined)
  process.exit(1)
})
