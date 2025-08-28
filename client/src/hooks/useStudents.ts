import { useQuery } from '@tanstack/react-query'
import { studentsService } from '../services/students'

export const useTeacherStudents = () =>
  useQuery({
    queryKey: ['teacher', 'students'],
    queryFn: studentsService.getStudents
  })
