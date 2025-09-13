import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseMutationOptions
} from '@tanstack/react-query'
import { studentsService } from '../services/students'

export const useTeacherStudents = () =>
  useQuery({
    queryKey: ['teacher', 'students'],
    queryFn: studentsService.getStudents
  })

export const useDeleteStudent = (
  options?: UseMutationOptions<void, Error, string>
) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: studentsService.deleteStudent,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['teacher', 'students']
      })
    },
    ...options
  })
}
