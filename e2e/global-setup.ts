import { request } from '@playwright/test'
import { MongoClient } from 'mongodb'

const BASE_URL = process.env.BASE_URL || 'http://localhost:3001'
const MONGODB_URI =
  process.env.E2E_MONGODB_URI ||
  'mongodb://admin:password@127.0.0.1:27017/viulumeri?authSource=admin'

export const SEED_USERS = [
  {
    email: 'e2e-admin@example.com',
    password: 'E2eAdmin123!',
    name: 'E2E Admin',
    userType: 'admin',
  },
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
  {
    email: 'e2e-delete-me@example.com',
    password: 'E2eDeleteMe123!',
    name: 'E2E Delete Me',
    userType: 'student',
  },
]

const USER_COLLECTION_CANDIDATES = [
  'user',
  'users',
  'auth_users',
  'better_auth_users'
]

async function findUserCollection(
  db: ReturnType<MongoClient['db']>,
  email: string
): Promise<string | null> {
  for (const name of USER_COLLECTION_CANDIDATES) {
    const doc = await db.collection(name).findOne({ email })
    if (doc) return name
  }
  return null
}

export default async function globalSetup() {
  const context = await request.newContext({ baseURL: BASE_URL })
  const mongoClient = new MongoClient(MONGODB_URI)

  try {
    await mongoClient.connect()
    const db = mongoClient.db()

    for (const user of SEED_USERS) {
      const collectionName = await findUserCollection(db, user.email)
      const existing = collectionName
        ? await db.collection(collectionName).findOne({ email: user.email })
        : null

      if (!existing) {
        const response = await context.post('/api/auth/sign-up/email', { data: user })
        if (!response.ok()) {
          const body = await response.text()
          throw new Error(
            `Failed to seed user ${user.email}: ${response.status()} ${body}`
          )
        }
      }

      const targetCollection =
        (await findUserCollection(db, user.email)) || 'user'

      const updateData: Record<string, unknown> = { emailVerified: true }
      if (user.userType === 'admin') {
        updateData.role = 'admin'
      }

      await db.collection(targetCollection).updateOne(
        { email: user.email },
        { $set: updateData }
      )
    }

    // Ensure admin role is set (in case user was already created)
    const adminUser = SEED_USERS.find(u => u.userType === 'admin')
    if (adminUser) {
      const adminCollection =
        (await findUserCollection(db, adminUser.email)) || 'user'

      await db.collection(adminCollection).updateOne(
        { email: adminUser.email },
        { $set: { role: 'admin' } }
      )
    }

    await db.collection('popupmessages').deleteMany({})
    await db.collection('faqs').deleteMany({})
  } finally {
    await mongoClient.close()
    await context.dispose()
  }
}
