import axios from 'axios'
import type { AdminFeedbackItem, GetAdminFeedbacksResponse } from '../../../shared/types'

interface SummaryResponse {
  teacherCount: number
  studentCount: number
  homeworkCount: number
}

interface Teacher {
  id: string
  userId: string
  name: string
  email: string
  studentCount: number
  students: { id: string; name: string; email: string }[]
}

interface Student {
  id: string
  userId: string
  name: string
  email: string
  playedSongs: number
  teacher: { id: string; name: string; email: string } | null
}

interface AdminPopupMessage {
  id: string
  title: string
  content: string
  postedAt: string
  isDraft: boolean
  visibleToTeachers: boolean
  visibleToStudents: boolean
  visibleFrom?: string
  visibleUntil?: string
  visibilityStatus?: 'always' | 'upcoming' | 'active' | 'expired'
}

export interface ImpersonateAdminRequest {
  userId: string
}

export interface ImpersonateAdminResponse {
  session: {
    id: string
    createdAt: string
    updatedAt: string
    userId: string
    expiresAt: string
    token: string
  }
  user: Record<string, unknown>
}

export const adminService = {
  getAdminSummary: async (): Promise<SummaryResponse> => {
    const response = await axios.get('/api/admin/summary', {
      withCredentials: true
    })
    return response.data
  },

  getAdminTeachers: async (): Promise<{ teachers: Teacher[] }> => {
    const response = await axios.get('/api/admin/teachers', {
      withCredentials: true
    })
    return response.data
  },

  getAdminStudents: async (): Promise<{ students: Student[] }> => {
    const response = await axios.get('/api/admin/students', {
      withCredentials: true
    })
    return response.data
  },

  getAdminPopupMessages: async (): Promise<{ messages: AdminPopupMessage[] }> => {
    const response = await axios.get('/api/admin/popup-messages', {
      withCredentials: true
    })
    return response.data
  },

  createPopupMessage: async (body: {
    title: string
    content: string
    isDraft?: boolean
    visibleToTeachers?: boolean
    visibleToStudents?: boolean
    visibleFrom?: string | null
    visibleUntil?: string | null
  }): Promise<{
    message: AdminPopupMessage
  }> => {
    const response = await axios.post('/api/admin/popup-messages', body, {
      withCredentials: true
    })
    return response.data
  },

  updateAdminPopupMessageDraftStatus: async (
    id: string,
    isDraft: boolean
  ): Promise<{ message: AdminPopupMessage }> => {
    const response = await axios.patch(
      `/api/admin/popup-messages/${id}`,
      { isDraft },
      { withCredentials: true }
    )
    return response.data
  },

  updateAdminPopupMessage: async (
    id: string,
    body: {
      title: string
      content: string
      isDraft: boolean
      visibleToTeachers: boolean
      visibleToStudents: boolean
      visibleFrom?: string | null
      visibleUntil?: string | null
    }
  ): Promise<{ message: AdminPopupMessage }> => {
    const response = await axios.patch(
      `/api/admin/popup-messages/${id}`,
      body,
      { withCredentials: true }
    )
    return response.data
  },

  deleteAdminPopupMessage: async (id: string): Promise<void> => {
    await axios.delete(`/api/admin/popup-messages/${id}`, {
      withCredentials: true
    })
  },

  deleteAllPopupMessages: async (): Promise<void> => {
    await axios.delete('/api/admin/popup-messages', {
      withCredentials: true
    })
  },

  deleteTeacher: async (id: string): Promise<void> => {
    await axios.delete(`/api/admin/teachers/${id}`, {
      withCredentials: true
    })
  },

  deleteStudent: async (id: string): Promise<void> => {
    await axios.delete(`/api/admin/students/${id}`, {
      withCredentials: true
    })
  },

  getAdminFeedbacks: async (): Promise<GetAdminFeedbacksResponse> => {
    const response = await axios.get('/api/admin/feedbacks', {
      withCredentials: true
    })
    return response.data
  },

  deleteFeedback: async (id: string): Promise<void> => {
    await axios.delete(`/api/admin/feedbacks/${id}`, {
      withCredentials: true
    })
  },

  updateAdminFeedbackReadStatus: async (
    id: string,
    isRead: boolean
  ): Promise<{ feedback: { id: string; isRead: boolean } }> => {
    const response = await axios.patch(
      `/api/admin/feedbacks/${id}`,
      { isRead },
      { withCredentials: true }
    )
    return response.data
  },
  // Call the better-auth admin plugin endpoint directly so the library
  // sets the auth cookies on the response (browser will receive Set-Cookie).
  impersonateUser: async (body: ImpersonateAdminRequest): Promise<ImpersonateAdminResponse> => {
    const response = await axios.post('/api/auth/admin/impersonate-user', body, {
      withCredentials: true
    })
    return response.data
  },
  
  stopImpersonating: async (): Promise<void> => {
    await axios.post('/api/auth/admin/stop-impersonating', {}, { withCredentials: true })
  }
}

export type { SummaryResponse, Teacher, Student, AdminPopupMessage, AdminFeedbackItem, GetAdminFeedbacksResponse }

