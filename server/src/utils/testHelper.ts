import { MongoClient } from 'mongodb'
import mongoose from 'mongoose'
import { databaseUrl } from './config'
import { client } from '../db'

export class TestHelper {
  private static client: MongoClient | null = null

  static async setupTestDatabase() {
    if (this.client) {
      await this.client.close()
    }

    this.client = new MongoClient(databaseUrl)
    await this.client.connect()

    // Add mongoose connection for Better Auth hooks
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

  static async cleanup() {
    if (this.client) {
      await this.clearDatabase()
      await this.client.close()
      this.client = null
    }

    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close()
    }

    // Also close the global Better Auth database client
    try {
      await client.close()
    } catch (error) {
      // Client might already be closed, ignore the error
    }
  }

  static async signUpUser(
    api: any,
    userData: {
      email: string
      name: string
      userType: 'teacher' | 'student'
      password?: string
    }
  ) {
    const password = userData.password || 'siikret-test-password-123'

    const response = await api.post('/api/auth/sign-up/email').send({
      email: userData.email,
      name: userData.name,
      password,
      userType: userData.userType
    })

    if (response.status !== 200) {
      throw new Error(
        `Signup failed: ${response.status} ${JSON.stringify(response.body)}`
      )
    }

    return { user: response.body.user, password }
  }

  static async verifyUserEmail(email: string) {
    const db = this.client!.db()
    await db
      .collection('user')
      .updateOne({ email }, { $set: { emailVerified: true } })
  }

  static async signInUser(api: any, email: string, password: string) {
    const response = await api
      .post('/api/auth/sign-in/email')
      .send({ email, password })

    if (response.status !== 200) {
      throw new Error(
        `Signin failed: ${response.status} ${JSON.stringify(response.body)}`
      )
    }

    return response
  }

  static extractSessionCookie(signInResponse: any): string {
    const setCookieHeader = signInResponse.headers['set-cookie']
    const sessionCookie = Array.isArray(setCookieHeader)
      ? setCookieHeader.find((cookie: string) =>
          cookie.startsWith('better-auth.session_token=')
        )
      : setCookieHeader?.includes('better-auth.session_token=')
        ? setCookieHeader
        : undefined

    if (!sessionCookie) {
      throw new Error('No session cookie found in signin response')
    }

    return sessionCookie
  }

  static async createAuthenticatedStudent(
    api: any,
    email?: string,
    name?: string
  ) {
    const userData = {
      email: email || `test-student-${Date.now()}@example.com`,
      name: name || 'Test Student',
      userType: 'student' as const
    }

    const { password } = await this.signUpUser(api, userData)
    await this.verifyUserEmail(userData.email)
    const signInResponse = await this.signInUser(api, userData.email, password)
    const sessionCookie = this.extractSessionCookie(signInResponse)

    return {
      user: signInResponse.body.user,
      sessionCookie,
      email: userData.email,
      password
    }
  }

  static async createAuthenticatedTeacher(
    api: any,
    email?: string,
    name?: string
  ) {
    const userData = {
      email: email || `test-teacher-${Date.now()}@example.com`,
      name: name || 'Test Teacher',
      userType: 'teacher' as const
    }

    const { password } = await this.signUpUser(api, userData)
    await this.verifyUserEmail(userData.email)
    const signInResponse = await this.signInUser(api, userData.email, password)
    const sessionCookie = this.extractSessionCookie(signInResponse)

    return {
      user: signInResponse.body.user,
      sessionCookie,
      email: userData.email,
      password
    }
  }

  static async makeAuthenticatedRequest(
    api: any,
    method: 'get' | 'post' | 'put' | 'delete',
    url: string,
    userType: 'student' | 'teacher',
    data?: any
  ) {
    const authResult =
      userType === 'student'
        ? await this.createAuthenticatedStudent(api)
        : await this.createAuthenticatedTeacher(api)

    const request = api[method](url).set('Cookie', authResult.sessionCookie)

    if (data && (method === 'post' || method === 'put')) {
      request.send(data)
    }

    const response = await request
    return { response, authResult }
  }
}
