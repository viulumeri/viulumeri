import axios from 'axios'

interface SummaryResponse {
  teacherCount: number
  studentCount: number
  homeworkCount: number
}

interface Teacher {
  id: string
  name: string
  email: string
  studentCount: number
  students: { id: string; name: string; email: string }[]
}

interface Student {
  id: string
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
  }
}

export type { SummaryResponse, Teacher, Student, AdminPopupMessage }

