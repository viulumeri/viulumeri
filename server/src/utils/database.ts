import mongoose from 'mongoose'
import { databaseUrl } from './config'

const connectDB = async (): Promise<void> => {
  try {
    await mongoose.connect(databaseUrl)
    console.log('MongoDB connected successfully')
  } catch (error) {
    console.error('MongoDB connection error:', error)
    process.exit(1)
  }
}

export default connectDB

