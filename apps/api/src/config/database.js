import mongoose from 'mongoose'
import { env } from './env.js'

mongoose.set('strictQuery', true)
mongoose.set('bufferCommands', false)

export async function connectDatabase() {
  return mongoose.connect(env.MONGODB_URI, { serverSelectionTimeoutMS: 5000 })
}

export async function disconnectDatabase() {
  return mongoose.disconnect()
}

export function databaseReady() {
  return mongoose.connection.readyState === 1
}