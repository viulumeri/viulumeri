import { useEffect, useMemo, useState } from 'react'
import {
  getAnnouncementKey,
  getAnnouncementsStorageKey
} from '../utils/startupAnnouncements'
import { popupMessagesService } from '../services/popupMessages'
import type { StartupAnnouncement } from '../utils/startupAnnouncements'

const formatPostedAt = (postedAt: string): string => {
  const ms = Date.parse(postedAt)
  if (Number.isNaN(ms)) return postedAt
  return new Date(ms).toLocaleDateString('fi-FI', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
}

type Props = {
  userId?: string
  isPending?: boolean
}

export const StartupAnnouncementsPopup = ({ userId, isPending }: Props) => {
  const [announcements, setAnnouncements] = useState<StartupAnnouncement[]>([])
  const [seenKeys, setSeenKeys] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (!userId) {
      setSeenKeys(new Set())
      return
    }

    const storageKey = getAnnouncementsStorageKey(userId)
    const raw = window.localStorage.getItem(storageKey)
    if (!raw) {
      setSeenKeys(new Set())
      return
    }

    try {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) {
        const keys = parsed.filter((item): item is string => typeof item === 'string')
        setSeenKeys(new Set(keys))
        return
      }
    } catch {
      // Backward compatibility with old marker format (key1|key2|...)
      const keys = raw
        .split('|')
        .map(item => item.trim())
        .filter(Boolean)
      setSeenKeys(new Set(keys))
      return
    }

    setSeenKeys(new Set())
  }, [userId])

  useEffect(() => {
    if (isPending) return
    if (!userId) {
      setAnnouncements([])
      return
    }

    let cancelled = false
    ;(async () => {
      try {
        const data = await popupMessagesService.getAll()
        if (cancelled) return
        setAnnouncements(data.messages)
      } catch {
        if (cancelled) return
        setAnnouncements([])
      }
    })()

    return () => {
      cancelled = true
    }
  }, [userId, isPending])

  const unseenAnnouncements = useMemo(
    () => announcements.filter(item => !seenKeys.has(getAnnouncementKey(item))),
    [announcements, seenKeys]
  )

  if (isPending || !userId || unseenAnnouncements.length === 0) return null

  const onOk = () => {
    if (!userId) return

    const storageKey = getAnnouncementsStorageKey(userId)
    const nextSeen = new Set(seenKeys)
    for (const announcement of unseenAnnouncements) {
      nextSeen.add(getAnnouncementKey(announcement))
    }
    const serialized = JSON.stringify(Array.from(nextSeen))
    window.localStorage.setItem(storageKey, serialized)
    setSeenKeys(nextSeen)
  }

  return (
    <div
      className="fixed inset-x-0 top-4 z-50 flex justify-center px-4 pointer-events-none"
      role="dialog"
      aria-label="Ilmoitukset"
    >
      <div className="pointer-events-auto w-full max-w-2xl rounded-2xl border border-neutral-700 bg-neutral-800 text-neutral-100 shadow-2xl shadow-black/40">
        <div className="p-6">
          <div className="flex items-start justify-between gap-4">
            <h2 className="text-neutral-100">Ilmoitukset</h2>
            <button type="button" className="button-basic shrink-0" onClick={onOk}>
              OK
            </button>
          </div>

          <div className="mt-4 max-h-[60vh] min-w-0 overflow-y-auto overflow-x-hidden space-y-4 pr-2">
            {unseenAnnouncements.map(a => (
              <div
                key={(a.id || `${a.postedAt}-${a.title}`).toString()}
                className="min-w-0 rounded-xl bg-neutral-900/40 p-4"
              >
                <div className="flex min-w-0 items-baseline justify-between gap-4">
                  <div className="min-w-0 flex-1 text-2xl font-semibold break-words">
                    {a.title}
                  </div>
                  <div className="shrink-0 text-sm text-neutral-300">
                    {formatPostedAt(a.postedAt)}
                  </div>
                </div>
                <div className="mt-2 whitespace-pre-wrap break-words text-neutral-100/90">
                  {a.content}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
