import { useCallback, useEffect, useState } from 'react'
import { Banana, MessageSquare, Users, Bell } from 'lucide-react'
import { useAdminSummary, useAdminFeedbacks } from '../hooks/useAdmin'
import { adminService } from '../services/admin'
import type { AdminPopupMessage } from '../services/admin'
import { ADMIN_POPUPS_UPDATED_EVENT } from '../utils/adminPopupEvents'

const formatDelta = (value: number) => {
  if (value > 0) return `+${value}`
  return `${value}`
}

const popupAudienceLabel = (message: AdminPopupMessage) => {
  const visibleToTeachers = message.visibleToTeachers !== false
  const visibleToStudents = message.visibleToStudents !== false

  if (visibleToTeachers && visibleToStudents) return 'Opettajat, Oppilaat'
  if (visibleToTeachers) return 'Opettajat'
  if (visibleToStudents) return 'Oppilaat'
  return 'Ei näkyvissä'
}

export const AdminDashboardPage = () => {
  const { data: summary } = useAdminSummary({ refetchInterval: 30000 })
  const { data: feedbackData } = useAdminFeedbacks({ refetchInterval: 30000 })
  const [messages, setMessages] = useState<AdminPopupMessage[]>([])
  const [baselineTeacherCount, setBaselineTeacherCount] = useState<number | null>(null)
  const [baselineStudentCount, setBaselineStudentCount] = useState<number | null>(null)

  const fetchMessages = useCallback(async () => {
    const response = await adminService.getAdminPopupMessages()
    setMessages(response.messages)
  }, [])

  useEffect(() => {
    void fetchMessages()
    const interval = window.setInterval(() => {
      void fetchMessages()
    }, 30000)

    const handlePopupsUpdated = () => {
      void fetchMessages()
    }
    window.addEventListener(ADMIN_POPUPS_UPDATED_EVENT, handlePopupsUpdated)

    return () => {
      window.clearInterval(interval)
      window.removeEventListener(ADMIN_POPUPS_UPDATED_EVENT, handlePopupsUpdated)
    }
  }, [fetchMessages])

  useEffect(() => {
    if (!summary) return
    if (baselineTeacherCount === null) {
      setBaselineTeacherCount(summary.teacherCount)
    }
    if (baselineStudentCount === null) {
      setBaselineStudentCount(summary.studentCount)
    }
  }, [summary, baselineTeacherCount, baselineStudentCount])

  const teacherCount = summary?.teacherCount ?? 0
  const studentCount = summary?.studentCount ?? 0
  const teacherDelta = baselineTeacherCount === null ? 0 : teacherCount - baselineTeacherCount
  const studentDelta = baselineStudentCount === null ? 0 : studentCount - baselineStudentCount
  const unreadFeedbackCount = (feedbackData?.feedbacks ?? []).filter(item => !item.isRead).length
  const activePopups = messages.filter(
    message =>
      message.isDraft !== true &&
      (message.visibilityStatus === 'active' || message.visibilityStatus === 'always')
  )

  return (
    <div className="admin-page">
      <h1 className="admin-page-title">
        <Banana className="admin-page-title-icon text-yellow-500" />
        Ylläpitopaneeli
      </h1>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-lg bg-neutral-900 p-4">
          <h3 className="flex min-h-10 items-center justify-center gap-2 text-center text-base leading-tight">
            <MessageSquare className="h-5 w-5 shrink-0" />
            <span>Lukemattomat</span>
          </h3>
          <p className="mt-1 text-center text-2xl font-bold md:text-3xl">{unreadFeedbackCount}</p>
        </div>

        <div className="rounded-lg bg-neutral-900 p-4">
          <h3 className="flex min-h-10 items-center justify-center gap-2 text-center text-base leading-tight">
            <Users className="h-5 w-5 shrink-0" />
            Opettajat
          </h3>
          <p className="mt-1 text-center text-2xl font-bold md:text-3xl">{teacherCount}</p>
          <p className="mt-1 text-center text-xs text-gray-400">Muutos: {formatDelta(teacherDelta)}</p>
        </div>

        <div className="rounded-lg bg-neutral-900 p-4">
          <h3 className="flex min-h-10 items-center justify-center gap-2 text-center text-base leading-tight">
            <Users className="h-5 w-5 shrink-0" />
            Oppilaat
          </h3>
          <p className="mt-1 text-center text-2xl font-bold md:text-3xl">{studentCount}</p>
          <p className="mt-1 text-center text-xs text-gray-400">Muutos: {formatDelta(studentDelta)}</p>
        </div>
      </div>

      <div className="admin-card">
        <h3 className="admin-card-title">
          <Bell className="h-5 w-5 shrink-0" />
          <span>Aktiiviset pop-upit</span>
        </h3>

        {activePopups.length === 0 ? (
          <p className="text-gray-400">Ei aktiivisia pop-up-viestejä.</p>
        ) : (
          <div className="max-h-[calc(100vh-300px)] overflow-y-auto rounded-md border border-neutral-700 bg-neutral-950/30 p-2">
            <ul className="space-y-2">
              {activePopups.map(message => (
                <li key={message.id} className="rounded-md border border-neutral-700 bg-neutral-800 p-3">
                  <p className="font-semibold">{message.title}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    Näkyvyys: {popupAudienceLabel(message)}
                  </p>
                  <p className="mt-1 text-sm text-gray-300 whitespace-pre-line break-words">
                    {message.content}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}
