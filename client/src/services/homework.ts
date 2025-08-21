import axios from 'axios'
import type {
  CreateHomeworkBody,
  CreateHomeworkResponse,
  HomeworkListResponse,
  PracticeResponse
} from '../../../shared/types'

export const homeworkService = {
  create: async (body: CreateHomeworkBody): Promise<CreateHomeworkResponse> => {
    const response = await axios.post('/api/homework', body, {
      withCredentials: true
    })
    return response.data
  },
  listForStudent: async (): Promise<HomeworkListResponse> => {
    const response = await axios.get('/api/homework', {
      withCredentials: true
    })
    return response.data
  },
  listForTeacherStudent: async (
    studentId: string
  ): Promise<HomeworkListResponse> => {
    const response = await axios.get(`/api/students/${studentId}/homework`, {
      withCredentials: true
    })
    return response.data
  },
  practiceOnce: async (homeworkId: string): Promise<PracticeResponse> => {
    const response = await axios.post(
      `/api/homework/practice/${homeworkId}`,
      null,
      {
        withCredentials: true
      }
    )
    return response.data
  }
}
