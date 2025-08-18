import { useQuery } from '@tanstack/react-query'
import { teacherService } from '../services/teacher'

export const useTeacherStudents = () =>
  useQuery({
    queryKey: ['teacher', 'students'],
    queryFn: teacherService.getStudents
  })
