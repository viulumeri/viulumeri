import { useEffect, useState } from 'react'
import { Banana, MessageSquare, Users, Bell } from 'lucide-react'
import { useAdminSummary, useAdminFeedbacks } from '../hooks/useAdmin'
import { adminService } from '../services/admin'
import type { AdminPopupMessage } from '../services/admin'

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

  useEffect(() => {
    const fetchMessages = async () => {
      const response = await adminService.getAdminPopupMessages()
      setMessages(response.messages)
    }

    void fetchMessages()
    const interval = window.setInterval(() => {
      void fetchMessages()
    }, 30000)

    return () => window.clearInterval(interval)
  }, [])

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
    <div className="space-y-4 p-5 pb-24">
      <h1 className="flex items-center gap-3">
        <Banana className="w-8 h-8" />
        Ylläpitopaneeli
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-neutral-900 rounded-lg p-4">
          <h3 className="flex items-center gap-2 h-14 leading-tight">
            <MessageSquare className="w-5 h-5" />
            <span className="ml-1">Lukemattomat palautteet</span>
          </h3>
          <p className="text-3xl font-bold mt-3">{unreadFeedbackCount}</p>
        </div>

        <div className="bg-neutral-900 rounded-lg p-4">
          <h3 className="flex items-center gap-2 h-14 leading-tight">
            <Users className="w-5 h-5" />
            Opettajat
          </h3>
          <p className="text-3xl font-bold mt-3">{teacherCount}</p>
          <p className="text-sm text-gray-400 mt-1">Muutos: {formatDelta(teacherDelta)}</p>
        </div>

        <div className="bg-neutral-900 rounded-lg p-4">
          <h3 className="flex items-center gap-2 h-14 leading-tight">
            <Users className="w-5 h-5" />
            Oppilaat
          </h3>
          <p className="text-3xl font-bold mt-3">{studentCount}</p>
          <p className="text-sm text-gray-400 mt-1">Muutos: {formatDelta(studentDelta)}</p>
        </div>
      </div>

      <div className="bg-neutral-900 rounded-lg p-4">
        <h3 className="flex items-center gap-2 mb-3">
          <Bell className="w-5 h-5" />
          Aktiiviset pop-upit
        </h3>

        {activePopups.length === 0 ? (
          <p className="text-gray-400">Ei aktiivisia pop-up-viestejä.</p>
        ) : (
          <div className="max-h-72 overflow-y-auto rounded-md border border-neutral-700 bg-neutral-950/30 p-2">
            <ul className="space-y-2">
              {activePopups.map(message => (
                <li key={message.id} className="rounded-md border border-neutral-700 bg-neutral-800 p-3">
                  <p className="font-semibold">{message.title}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    Näkyvyys: {popupAudienceLabel(message)}
                  </p>
                  <p className="mt-1 max-h-32 overflow-y-auto text-sm text-gray-300 whitespace-pre-line break-words pr-1">
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
