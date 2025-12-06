import mongoose, { Schema, model, models } from "mongoose"

export interface IUser {
  _id: string
  githubId: string
  name: string
  email: string
  username: string
  image?: string
  bio?: string
  createdAt: Date
  updatedAt: Date
  lastLogin: Date
}

const UserSchema = new Schema<IUser>(
  {
    githubId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    username: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    image: {
      type: String,
      default: "",
    },
    bio: {
      type: String,
      default: "",
    },
    lastLogin: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
)

// Create indexes for better query performance
UserSchema.index({ email: 1 })
UserSchema.index({ githubId: 1 })
UserSchema.index({ username: 1 })

const User = models.User || model<IUser>("User", UserSchema)

export default User
