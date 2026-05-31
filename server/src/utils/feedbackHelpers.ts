import type { AdminFeedbackItem } from '../../../shared/types'

interface FeedbackDoc {
  id?: string
  userId: string
  userType: string
  title: string
  category: string
  message: string
  createdAt: Date
}

interface UserInfo {
  userId: string
  name: string
  email: string
}

export const mapFeedbacksToAdminItems = (
  feedbacks: FeedbackDoc[],
  teachers: UserInfo[],
  students: UserInfo[]
): AdminFeedbackItem[] => {
  const userMap = new Map<string, { name: string; email: string }>()
  for (const t of teachers) userMap.set(t.userId, { name: t.name, email: t.email })
  for (const s of students) userMap.set(s.userId, { name: s.name, email: s.email })

  return feedbacks.map(f => {
    const user = userMap.get(f.userId)
    return {
      id: f.id ?? '',
      title: f.title,
      category: f.category as AdminFeedbackItem['category'],
      message: f.message,
      senderName: user?.name ?? 'Poistettu käyttäjä',
      senderEmail: user?.email ?? '',
      userType: f.userType as AdminFeedbackItem['userType'],
      createdAt: f.createdAt.toISOString()
    }
  })
}
