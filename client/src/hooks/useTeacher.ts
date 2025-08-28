import { useMutation, useQuery, type UseMutationOptions } from '@tanstack/react-query'
import { teacherService } from '../services/teacher'

export const useTeacher = () => {
  return useQuery({
    queryKey: ['teacher'],
    queryFn: teacherService.getTeacher
  })
}

export const useRemoveTeacher = (
  options?: UseMutationOptions<void, Error, void>
) => {
  return useMutation({
    mutationFn: teacherService.removeTeacher,
    ...options
  })
}
