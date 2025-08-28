import axios from 'axios'

interface TeacherInfo {
  teacher: {
    id: string
    name: string
  } | null
}

export const teacherService = {
  getTeacher: async (): Promise<TeacherInfo> => {
    const response = await axios.get('/api/teacher', {
      withCredentials: true
    })
    return response.data
  },
  
  removeTeacher: async (): Promise<void> => {
    await axios.delete('/api/teacher', {
      withCredentials: true
    })
  }
}
