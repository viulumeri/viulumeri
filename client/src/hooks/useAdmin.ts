import { useQuery, useMutation, useQueryClient, type UseQueryOptions, type UseMutationOptions } from '@tanstack/react-query'
import { adminService, type SummaryResponse, type Teacher, type Student } from '../services/admin'

export const useAdminSummary = (
  options?: Omit<UseQueryOptions<SummaryResponse, Error>, 'queryKey' | 'queryFn'>
) =>
  useQuery({
    queryKey: ['admin', 'summary'],
    queryFn: adminService.getAdminSummary,
    ...options
  })

export const useAdminTeachers = (
  options?: Omit<UseQueryOptions<{ teachers: Teacher[] }, Error>, 'queryKey' | 'queryFn'>
) =>
  useQuery({
    queryKey: ['admin', 'teachers'],
    queryFn: adminService.getAdminTeachers,
    ...options
  })

export const useAdminStudents = (
  options?: Omit<UseQueryOptions<{ students: Student[] }, Error>, 'queryKey' | 'queryFn'>
) =>
  useQuery({
    queryKey: ['admin', 'students'],
    queryFn: adminService.getAdminStudents,
    ...options
  })

export const useDeleteAdminTeacher = (
  options?: UseMutationOptions<void, Error, string>
) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: adminService.deleteTeacher,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'teachers'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'summary'] })
    },
    ...options
  })
}

export const useDeleteAdminStudent = (
  options?: UseMutationOptions<void, Error, string>
) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: adminService.deleteStudent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'students'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'summary'] })
    },
    ...options
  })
}
