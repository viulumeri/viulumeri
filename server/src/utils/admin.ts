import mongoose from 'mongoose'

type EnsureAdminResult =
  | { ok: true; promoted: boolean; collection: string }
  | { ok: false; reason: string }

async function tryPromoteInCollection(
  collectionName: string,
  email: string
): Promise<{ matched: number; modified: number } | null> {
  const db = mongoose.connection.db
  if (!db) return null

  const col = db.collection(collectionName)

  // Better Auth schemas vary; we only rely on "email" and a custom "userType" field.
  const update = await col.updateOne(
    { email },
    { $set: { role: 'admin' } }
  )

  return { matched: update.matchedCount, modified: update.modifiedCount }
}

export async function ensureAdminUser(): Promise<EnsureAdminResult> {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase()
  if (!email) return { ok: false, reason: 'ADMIN_EMAIL not set' }

  // Wait briefly for DB to be ready (index.ts should connect first, but don’t assume).
  if (mongoose.connection.readyState !== 1) {
    return {
      ok: false,
      reason:
        'MongoDB connection not ready (ensure DB connects before ensureAdminUser())',
    }
  }

  // Try common collection names (adjust once you confirm the actual one).
  const candidates = [
    'users',
    'user',
    'auth_users',
    'better_auth_users',
  ]

  for (const name of candidates) {
    const res = await tryPromoteInCollection(name, email)
    if (!res) continue

    if (res.matched > 0) {
      return { ok: true, promoted: res.modified > 0, collection: name }
    }
  }

  return {
    ok: false,
    reason:
      `No user with email "${email}" found in collections: ${candidates.join(
        ', '
      )}. ` +
      `Create the user via UI first, then restart.`,
  }
}
