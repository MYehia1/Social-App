import { Schema, model, type HydratedDocument } from 'mongoose'
import { GenderEnum, ProviderEnum, RoleEnum } from '../../common/enums'
import type { IUser } from '../../common/interfaces'

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 50 },
    username: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      minlength: 3,
      maxlength: 20,
      match: /^[a-z0-9_]+$/,
      index: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    // Required only for password accounts — a Google user never has one, and
    // an unconditional `required` would reject the document outright.
    // `select: false` keeps the hash out of every query result by default, so
    // it can never be leaked by an endpoint that forgot to strip it.
    password: {
      type: String,
      required(this: { provider?: ProviderEnum }) {
        return this.provider !== ProviderEnum.GOOGLE
      },
      select: false,
    },

    photo: { type: String },
    photoPublicId: { type: String },
    // Newest first. `_id: false` because these are values, not entities —
    // nothing ever addresses a single cover by id.
    covers: {
      type: [{ url: { type: String, required: true }, publicId: { type: String, required: true }, _id: false }],
      default: [],
    },
    // Legacy single cover, still read for accounts created before `covers`.
    coverPhoto: { type: String },
    coverPhotoPublicId: { type: String },
    bio: { type: String, trim: true, maxlength: 160 },

    gender: { type: String, enum: Object.values(GenderEnum), default: GenderEnum.MALE },
    role: { type: String, enum: Object.values(RoleEnum), default: RoleEnum.USER },
    provider: {
      type: String,
      enum: Object.values(ProviderEnum),
      default: ProviderEnum.SYSTEM,
    },

    friendCount: { type: Number, default: 0, min: 0 },

    dateOfBirth: { type: Date },
    confirmedAt: { type: Date },
    // Never queried directly, and never returned to a client.
    otpHash: { type: String, select: false },
    otpExpiresAt: { type: Date, select: false },
    otpAttempts: { type: Number, default: 0, select: false },
    credentialsChangedAt: { type: Date },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform(_doc, ret: Record<string, unknown>) {
        // Belt and braces alongside `select: false`.
        delete ret.password
        delete ret.__v
        delete ret._id
        return ret
      },
    },
    toObject: { virtuals: true },
  },
)

userSchema.virtual('id').get(function (this: HydratedDocument<IUser>) {
  return this._id.toString()
})

export type UserDocument = HydratedDocument<IUser>

export const UserModel = model<IUser>('User', userSchema)
