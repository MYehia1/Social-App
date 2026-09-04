import mongoose from 'mongoose'
import { env } from '../config/config'

export async function connectDB(): Promise<void> {
  // Reject writes that reference undeclared fields instead of silently
  // dropping them, and surface bad queries rather than matching everything.
  mongoose.set('strictQuery', true)

  try {
    await mongoose.connect(env.DB_URI, { serverSelectionTimeoutMS: 10_000 })
    console.log('✅ MongoDB connected')
  } catch (error) {
    // Previously this was caught and logged, leaving the server accepting
    // traffic with no database — every request then failed confusingly.
    console.error('❌ MongoDB connection failed:', error)
    process.exit(1)
  }
}

export async function disconnectDB(): Promise<void> {
  await mongoose.connection.close()
}
