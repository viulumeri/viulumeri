import axios from 'axios'

export const studentsService = {
  getStudents: async (): Promise<{
    students: { id: string; name: string }[]
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
