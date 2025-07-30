import { MongoClient } from 'mongodb'
import mongoose from 'mongoose'
import { databaseUrl } from './utils/config'
import logger from './utils/logger'

// MongoDB client is for better-auth
export const client = new MongoClient(databaseUrl)

// Connect the MongoDB client for better-auth
client.connect().catch(console.error)

// Mongoose for rest of the app
export const connectDB = async (): Promise<void> => {
  try {
    await mongoose.connect(databaseUrl)
    logger.info('MongoDB connected successfully')
  } catch (error) {
    logger.error('MongoDB connection error:', error)
    process.exit(1)
  }
}

export default connectDB

