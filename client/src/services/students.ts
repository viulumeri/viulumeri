import axios from 'axios'

export interface StudentWithHomework {
  id: string
  name: string
  latestHomework?: {
    practiceCount: number
  }
}

export const studentsService = {
  getStudents: async (): Promise<{
    students: StudentWithHomework[]
  }> => {
    const response = await axios.get('/api/students', {
      withCredentials: true
    })
    return response.data
  },

  deleteStudent: async (studentId: string): Promise<void> => {
    await axios.delete(`/api/students/${studentId}`, {
      withCredentials: true
    })
  }
}