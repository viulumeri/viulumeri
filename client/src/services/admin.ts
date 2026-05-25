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
  }
}

export type { SummaryResponse, Teacher, Student }

