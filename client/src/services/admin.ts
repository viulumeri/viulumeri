import axios from 'axios'
import type { AdminFeedbackItem, GetAdminFeedbacksResponse, SongMetadata } from '../../../shared/types'

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
  isAdmin: boolean
  isCurrentUser: boolean
  studentCount: number
  students: { id: string; name: string; email: string }[]
}

interface Student {
  id: string
  userId: string
  name: string
  email: string
  isAdmin: boolean
  isCurrentUser: boolean
  playedSongs: number
  teacher: { id: string; name: string; email: string } | null
}

interface AdminPopupMessage {
  id: string
  title: string
  content: string
  images?: AdminPopupImagePayload[]
  postedAt: string
  isDraft: boolean
  visibleToTeachers: boolean
  visibleToStudents: boolean
  visibleFrom?: string
  visibleUntil?: string
  visibilityStatus?: 'always' | 'upcoming' | 'active' | 'expired'
}

const getApiErrorMessage = (error: unknown, fallback: string): string => {
  if (axios.isAxiosError(error)) {
    const errorMessage = (error.response?.data as { error?: unknown } | undefined)?.error
    if (typeof errorMessage === 'string' && errorMessage.trim()) {
      return errorMessage
    }
  }

  return error instanceof Error ? error.message : fallback
}

export interface AdminSongFilePayload {
  data: string
  name: string
  type: string
}

export interface AdminPopupImagePayload {
  data: string
  name: string
  type: string
}

export interface AdminPopupSavePayload {
  title: string
  content: string
  isDraft?: boolean
  visibleToTeachers?: boolean
  visibleToStudents?: boolean
  visibleFrom?: string | null
  visibleUntil?: string | null
  images?: File[]
  existingImages?: AdminPopupImagePayload[]
}

const buildPopupFormData = (body: AdminPopupSavePayload): FormData => {
  const formData = new FormData()
  formData.append('title', body.title)
  formData.append('content', body.content)
  if (typeof body.isDraft === 'boolean') formData.append('isDraft', String(body.isDraft))
  if (typeof body.visibleToTeachers === 'boolean') {
    formData.append('visibleToTeachers', String(body.visibleToTeachers))
  }
  if (typeof body.visibleToStudents === 'boolean') {
    formData.append('visibleToStudents', String(body.visibleToStudents))
  }
  formData.append('visibleFrom', body.visibleFrom ?? '')
  formData.append('visibleUntil', body.visibleUntil ?? '')
  if (body.existingImages) {
    formData.append('existingImages', JSON.stringify(body.existingImages))
  }
  for (const file of body.images ?? []) {
    formData.append('images', file, file.name)
  }
  return formData
}

export interface AdminSongItem {
  id: string
  title: string
  updatedAt: string
  isImpro: boolean
  isHidden: boolean
  hasInstrumentalTrack: boolean
  hasMelodyTrack: boolean
  hasSlowInstrumentalTrack: boolean
  hasSlowMelodyTrack: boolean
  hasImage: boolean
  metadata: SongMetadata
}

export interface AdminSongSavePayload {
  name: string
  composer?: string | null
  isImpro: boolean
  isHidden?: boolean
  instrumentalTrack?: AdminSongFilePayload | null
  melodyTrack?: AdminSongFilePayload | null
  slowInstrumentalTrack?: AdminSongFilePayload | null
  slowMelodyTrack?: AdminSongFilePayload | null
  image?: AdminSongFilePayload | null
  deleteMelodyTrack?: boolean
  deleteSlowInstrumentalTrack?: boolean
  deleteSlowMelodyTrack?: boolean
  deleteImage?: boolean
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
  }
  user: Record<string, unknown>
}

export interface UpdateAdminUserRequest {
  id: string
  role: 'teacher' | 'student'
  name: string
  email: string
}

export interface UpdateAdminUserResponse {
  user: {
    id: string
    userId: string
    name: string
    email: string
  }
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

  getAdminSongs: async (): Promise<{ songs: AdminSongItem[] }> => {
    const response = await axios.get('/api/admin/songs', {
      withCredentials: true
    })
    return response.data
  },

  createAdminSong: async (
    body: AdminSongSavePayload
  ): Promise<{ song: AdminSongItem }> => {
    try {
      const response = await axios.post('/api/admin/songs', body, {
        withCredentials: true
      })
      return response.data
    } catch (error) {
      throw new Error(getApiErrorMessage(error, 'Kappaleen lisääminen epäonnistui'))
    }
  },

  updateAdminSong: async (
    id: string,
    body: AdminSongSavePayload
  ): Promise<{ song: AdminSongItem }> => {
    try {
      const response = await axios.patch(
        `/api/admin/songs/${encodeURIComponent(id)}`,
        body,
        { withCredentials: true }
      )
      return response.data
    } catch (error) {
      throw new Error(getApiErrorMessage(error, 'Kappaleen tallennus epäonnistui'))
    }
  },

  deleteAdminSong: async (id: string): Promise<void> => {
    try {
      await axios.delete(`/api/admin/songs/${encodeURIComponent(id)}`, {
        withCredentials: true
      })
    } catch (error) {
      throw new Error(getApiErrorMessage(error, 'Kappaleen poistaminen epäonnistui'))
    }
  },

  createPopupMessage: async (body: AdminPopupSavePayload): Promise<{
    message: AdminPopupMessage
  }> => {
    const response = await axios.post('/api/admin/popup-messages', buildPopupFormData(body), {
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
    body: AdminPopupSavePayload
  ): Promise<{ message: AdminPopupMessage }> => {
    const response = await axios.patch(
      `/api/admin/popup-messages/${id}`,
      buildPopupFormData(body),
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

  updateUser: async ({
    id,
    role,
    name,
    email
  }: UpdateAdminUserRequest): Promise<UpdateAdminUserResponse> => {
    try {
      const resource = role === 'teacher' ? 'teachers' : 'students'
      const response = await axios.patch(
        `/api/admin/${resource}/${id}`,
        { name, email },
        { withCredentials: true }
      )
      return response.data
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const message = error.response?.data?.error
        if (typeof message === 'string') {
          throw new Error(message)
        }
      }
      throw error
    }
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

