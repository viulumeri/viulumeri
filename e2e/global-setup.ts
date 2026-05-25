import { request } from '@playwright/test'
import { MongoClient } from 'mongodb'

const BASE_URL = process.env.BASE_URL || 'http://localhost:3001'
const MONGODB_URI =
  process.env.E2E_MONGODB_URI ||
  'mongodb://admin:password@localhost:27017/viulumeri?authSource=admin'

export const SEED_USERS = [
  {
    email: 'e2e-teacher@example.com',
    password: 'E2eTeacher123!',
    name: 'E2E Teacher',
    userType: 'teacher',
  },
  {
    email: 'e2e-student@example.com',
    password: 'E2eStudent123!',
    name: 'E2E Student',
    userType: 'student',
  },
]

export default async function globalSetup() {
  const context = await request.newContext({ baseURL: BASE_URL })
  const mongoClient = new MongoClient(MONGODB_URI)

  try {
    await mongoClient.connect()
    const db = mongoClient.db()

    for (const user of SEED_USERS) {
      const existing = await db.collection('user').findOne({ email: user.email })

      if (!existing) {
        const response = await context.post('/api/auth/sign-up/email', { data: user })
        if (!response.ok()) {
          const body = await response.text()
          throw new Error(
            `Failed to seed user ${user.email}: ${response.status()} ${body}`
          )
        }
      }

      await db
        .collection('user')
        .updateOne({ email: user.email }, { $set: { emailVerified: true } })
    }
  } finally {
    await mongoClient.close()
    await context.dispose()
  }
}
