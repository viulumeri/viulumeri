import { MongoClient } from 'mongodb'
import mongoose from 'mongoose'
import { databaseUrl } from './utils/config'

// MongoDB client is for better-auth
export const client = new MongoClient(databaseUrl)

// Mongoose for rest of the app
export const connectDB = async (): Promise<void> => {
  try {
    await mongoose.connect(databaseUrl)
    console.log('MongoDB connected successfully')
  } catch (error) {
    console.error('MongoDB connection error:', error)
    process.exit(1)
  }
}

export default connectDB

