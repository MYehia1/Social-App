import express, { type Express, type Request, type Response } from 'express'
import cookieParser from 'cookie-parser'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import { env, googleAuthEnabled, uploadsEnabled } from './config/config'
import { connectDB, disconnectDB } from './DB/connection.db'
import { globalErrorHandler } from './middleware'
import { ForbiddenException, NotFoundException } from './common/exceptions'
import { mailTransportVerified, verifyMailTransport } from './common/mail'
import {
  authRouter,
  commentRouter,
  friendRouter,
  notificationRouter,
  postRouter,
  reactionRouter,
  userPostsRouter,
  userRouter,
} from './modules'

const API_PREFIX = '/api/v1'

export function createApp(): Express {
  const app = express()

  // Render, Railway and Fly all sit behind a proxy; without this the rate
  // limiter sees one shared IP and the Secure cookie flag misbehaves.
  app.set('trust proxy', 1)

  app.use(helmet())
  app.use(
    cors({
      origin(origin, callback) {
        // Same-origin and server-to-server calls arrive with no Origin header.
        if (!origin || env.ORIGINS.includes(origin)) {
          callback(null, true)
          return
        }
        // A plain Error here would surface as a 500 and be logged as a
        // server fault; a rejected origin is a client problem.
        callback(new ForbiddenException('Origin not allowed'))
      },
      credentials: true,
    }),
  )

  // A body cap stops a single request from exhausting memory. Multipart
  // uploads are capped separately by multer.
  app.use(express.json({ limit: '100kb' }))
  app.use(express.urlencoded({ extended: true, limit: '100kb' }))
  app.use(cookieParser())

  app.use(
    rateLimit({
      windowMs: 15 * 60 * 1000,
      limit: 300,
      standardHeaders: 'draft-7',
      legacyHeaders: false,
    }),
  )

  app.get('/health', (_req: Request, res: Response) => {
    res.status(200).json({
      status: 'ok',
      uploads: uploadsEnabled,
      // Whether mail actually authenticates, not merely whether the two
      // variables are set — a wrong app password satisfies the config check.
      mail: mailTransportVerified(),
      google: googleAuthEnabled,
    })
  })

  app.use(`${API_PREFIX}/auth`, authRouter)
  app.use(`${API_PREFIX}/posts`, postRouter)
  app.use(`${API_PREFIX}/comments`, commentRouter)
  app.use(`${API_PREFIX}/users`, userRouter)
  app.use(`${API_PREFIX}/users`, userPostsRouter)
  app.use(`${API_PREFIX}/reactions`, reactionRouter)
  app.use(`${API_PREFIX}/notifications`, notificationRouter)
  app.use(`${API_PREFIX}/friends`, friendRouter)

  app.use((req: Request) => {
    throw new NotFoundException(`Cannot ${req.method} ${req.originalUrl}`)
  })

  app.use(globalErrorHandler)

  return app
}

export default async function bootstrap(): Promise<void> {
  await connectDB()

  const app = createApp()
  const server = app.listen(env.PORT, () => {
    console.log(`🚀 Echoo API listening on port ${env.PORT} (${env.NODE_ENV})`)
    // Name the inactive integrations at boot, so "why did my upload 503"
    // is answerable from the console rather than by reading the source.
    const inactive = [
      !uploadsEnabled && 'Cloudinary (uploads rejected)',
      !googleAuthEnabled && 'Google sign-in (button hidden)',
    ].filter(Boolean)

    if (inactive.length > 0) {
      console.warn(`⚠️  Inactive: ${inactive.join(' · ')}`)
    }

    // Mail reports itself: unlike the others, being present in the config is
    // no proof it works, so this actually opens a connection and authenticates.
    void verifyMailTransport()
  })

  // Finish in-flight requests and close the DB before exiting, so a deploy
  // does not cut active connections mid-write.
  const shutdown = (signal: string) => {
    console.log(`\n${signal} received, shutting down…`)
    server.close(() => {
      void disconnectDB().finally(() => process.exit(0))
    })
    setTimeout(() => process.exit(1), 10_000).unref()
  }

  process.on('SIGTERM', () => shutdown('SIGTERM'))
  process.on('SIGINT', () => shutdown('SIGINT'))
}
