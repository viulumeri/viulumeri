import { MongoClient } from 'mongodb'
import mongoose from 'mongoose'
import { databaseUrl } from './config'
import Teacher from '../models/teacher'
import Student from '../models/student'
import { auth } from './auth'

export class TestAuthHelper {
  private static client: MongoClient | null = null

  static async setupTestDatabase() {
    if (this.client) {
      await this.client.close()
    }

    this.client = new MongoClient(databaseUrl)
    await this.client.connect()

    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(databaseUrl)
    }

    await this.clearDatabase()
  }

  static async clearDatabase() {
    if (!this.client) throw new Error('Database not connected')

    const db = this.client.db()
    const collections = await db.collections()

    await Promise.all(collections.map(collection => collection.deleteMany({})))
  }

  static async createTestUser(userData: {
    email: string
    name: string
    userType: 'teacher' | 'student'
  }) {
    if (!this.client) throw new Error('Database not connected')

    const db = this.client.db()
    const usersCollection = db.collection('user')

    const userId = new mongoose.Types.ObjectId().toString()
    const betterAuthUser = {
      id: userId,
      email: userData.email,
      name: userData.name,
      userType: userData.userType,
      emailVerified: true,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    await usersCollection.insertOne(betterAuthUser)

    if (userData.userType === 'teacher') {
      const teacher = new Teacher({
        userId: userId,
        name: userData.name,
        email: userData.email
      })
      await teacher.save()
      return { user: betterAuthUser, profile: teacher }
    } else {
      const student = new Student({
        userId: userId,
        name: userData.name,
        email: userData.email
      })
      await student.save()
      return { user: betterAuthUser, profile: student }
    }
  }

  static async createSession(userId: string) {
    if (!this.client) throw new Error('Database not connected')

    const db = this.client.db()
    const sessionsCollection = db.collection('session')

    const sessionId = new mongoose.Types.ObjectId().toString()
    const token = `test-session-${Date.now()}-${Math.random()}`

    const session = {
      id: sessionId,
      userId,
      token,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      createdAt: new Date(),
      updatedAt: new Date()
    }

    await sessionsCollection.insertOne(session)
    return { sessionId, token }
  }

  static async cleanup() {
    if (this.client) {
      await this.clearDatabase()
      await this.client.close()
      this.client = null
    }

    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close()
    }
  }

  // Helper to get session cookie for requests
  static getSessionCookie(token: string): string {
    return `better-auth.session_token=${token}`
  }
}
