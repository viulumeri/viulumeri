export type StartupAnnouncement = {
  /** Optional stable identifier. If omitted, a derived key is used. */
  id?: string
  title: string
  content: string
  /** ISO date string (e.g. 2026-05-26 or 2026-05-26T12:00:00Z) */
  postedAt: string
  visibleToTeachers?: boolean
  visibleToStudents?: boolean
}

const ENV_VAR = 'VITE_STARTUP_ANNOUNCEMENTS'

export const getStartupAnnouncementsFromEnv = (): StartupAnnouncement[] => {
  const raw = (import.meta.env as Record<string, unknown>)[ENV_VAR]
  if (typeof raw !== 'string' || raw.trim() === '') return []

  try {
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []

    const normalized = parsed
      .filter((m): m is Partial<StartupAnnouncement> => !!m && typeof m === 'object')
      .map(m => ({
        id: typeof m.id === 'string' ? m.id : undefined,
        title: typeof m.title === 'string' ? m.title : '',
        content: typeof m.content === 'string' ? m.content : '',
        postedAt: typeof m.postedAt === 'string' ? m.postedAt : ''
      }))
      .filter(m => m.title && m.content && m.postedAt)

    normalized.sort((a, b) => {
      const aTime = Date.parse(a.postedAt) || 0
      const bTime = Date.parse(b.postedAt) || 0
      return bTime - aTime
    })

    return normalized
  } catch {
    return []
  }
}

const announcementKey = (m: StartupAnnouncement): string =>
  m.id || `${m.postedAt}::${m.title}`

export const computeAnnouncementsMarker = (
  announcements: StartupAnnouncement[]
): string => {
  if (announcements.length === 0) return ''
  return announcements.map(announcementKey).sort().join('|')
}

export const getAnnouncementsStorageKey = (userId: string): string =>
  `viulumeri.startupAnnouncements.seen.${userId}`
