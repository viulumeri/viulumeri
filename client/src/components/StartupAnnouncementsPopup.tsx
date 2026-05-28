import { useEffect, useMemo, useState } from 'react'
import {
  computeAnnouncementsMarker,
  getAnnouncementsStorageKey
} from '../utils/startupAnnouncements'
import { popupMessagesService } from '../services/popupMessages'
import type { StartupAnnouncement } from '../utils/startupAnnouncements'

const formatPostedAt = (postedAt: string): string => {
  const ms = Date.parse(postedAt)
  if (Number.isNaN(ms)) return postedAt
  return new Date(ms).toLocaleDateString(undefined, {
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

  const marker = useMemo(
    () => computeAnnouncementsMarker(announcements),
    [announcements]
  )

  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    if (isPending) return
    if (!userId) {
      setIsOpen(false)
      return
    }
    if (!marker) {
      setIsOpen(false)
      return
    }

    const key = getAnnouncementsStorageKey(userId)
    const seenMarker = window.localStorage.getItem(key)
    setIsOpen(seenMarker !== marker)
  }, [userId, marker, isPending])

  if (!isOpen) return null

  const onOk = () => {
    if (!userId) return
    const key = getAnnouncementsStorageKey(userId)
    window.localStorage.setItem(key, marker)
    setIsOpen(false)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/70 p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Ilmoitukset"
    >
      <div className="w-full max-w-2xl rounded-2xl bg-neutral-800 text-neutral-100">
        <div className="p-6">
          <h2 className="text-neutral-100">Ilmoitukset</h2>
          <div className="mt-4 max-h-[60vh] min-w-0 overflow-y-auto overflow-x-hidden space-y-4 pr-2">
            {announcements.map(a => (
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

          <div className="mt-6 flex justify-center">
            <button type="button" className="button-basic" onClick={onOk}>
              OK
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
