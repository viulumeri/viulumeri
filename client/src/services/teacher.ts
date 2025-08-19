import axios from 'axios'

export const teacherService = {
  getStudents: async (): Promise<{
    students: { id: string; name: string }[]
  }> => {
    const response = await axios.get('/api/teacher/students', {
      withCredentials: true
    })
    return response.data
  }
}
