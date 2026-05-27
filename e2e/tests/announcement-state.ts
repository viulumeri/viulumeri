import { MongoClient } from 'mongodb'
import type { Page } from '@playwright/test'

const MONGODB_URI =
  process.env.E2E_MONGODB_URI ||
  'mongodb://admin:password@127.0.0.1:27017/viulumeri?authSource=admin'

const USER_COLLECTION_CANDIDATES = [
  'user',
  'users',
  'auth_users',
  'better_auth_users'
]

async function findUserIdByEmail(email: string): Promise<string | null> {
  const mongoClient = new MongoClient(MONGODB_URI)
  try {
    await mongoClient.connect()
    const db = mongoClient.db()

    for (const collectionName of USER_COLLECTION_CANDIDATES) {
      const user = await db.collection(collectionName).findOne({ email })
      const userId = user?._id?.toString() || user?.id?.toString()
      if (userId) {
        return userId
      }
    }

    return null
  } finally {
    await mongoClient.close()
  }
}

export async function markStartupAnnouncementsAsSeen(
  page: Page,
  email: string
): Promise<void> {
  const userId = await findUserIdByEmail(email)
  if (!userId) return

  const marker = await page.evaluate(async () => {
    const response = await fetch('/api/popup-messages')
    if (!response.ok) return ''

    const data = (await response.json().catch(() => null)) as {
      messages?: Array<{ id?: string; postedAt?: string; title?: string }>
    } | null

    const messages = Array.isArray(data?.messages) ? data.messages : []
    if (messages.length === 0) return ''

    return messages
      .map(message => message.id || `${message.postedAt}::${message.title}`)
      .sort()
      .join('|')
  })

  if (!marker) return

  await page.evaluate(({ key, value }) => {
    window.localStorage.setItem(key, value)
  }, {
    key: `viulumeri.startupAnnouncements.seen.${userId}`,
    value: marker
  })
}