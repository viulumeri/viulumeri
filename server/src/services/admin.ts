import Feedback from '../models/feedback'
import Teacher from '../models/teacher'
import Student from '../models/student'
import { mapFeedbacksToAdminItems } from '../utils/feedbackHelpers'
import type { AdminFeedbackItem } from '../../../shared/types'

export const getAdminFeedbacks = async (): Promise<AdminFeedbackItem[]> => {
  const feedbacks = await Feedback.find().sort({ createdAt: -1 })

  const teacherUserIds = feedbacks
    .filter(f => f.userType === 'teacher')
    .map(f => f.userId)
  const studentUserIds = feedbacks
    .filter(f => f.userType === 'student')
    .map(f => f.userId)

  const [teachers, students] = await Promise.all([
    Teacher.find({ userId: { $in: teacherUserIds } }, 'userId name email'),
    Student.find({ userId: { $in: studentUserIds } }, 'userId name email')
  ])

  return mapFeedbacksToAdminItems(feedbacks, teachers, students)
}
