import { useQuery, useMutation, useQueryClient, type UseQueryOptions, type UseMutationOptions } from '@tanstack/react-query'
<<<<<<< HEAD
import { adminService, type SummaryResponse, type Teacher, type Student, type GetAdminFeedbacksResponse } from '../services/admin'
=======
import { adminService, type SummaryResponse, type Teacher, type Student, type ImpersonateAdminRequest, type ImpersonateAdminResponse } from '../services/admin'
>>>>>>> Impersonate

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
    ...options,
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'teachers'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'summary'] })
      options?.onSuccess?.(...args)
    },
  })
}

export const useAdminFeedbacks = (
  options?: Omit<UseQueryOptions<GetAdminFeedbacksResponse, Error>, 'queryKey' | 'queryFn'>
) =>
  useQuery({
    queryKey: ['admin', 'feedbacks'],
    queryFn: adminService.getAdminFeedbacks,
    ...options
  })

export const useDeleteAdminStudent = (
  options?: UseMutationOptions<void, Error, string>
) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: adminService.deleteStudent,
    ...options,
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'students'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'summary'] })
      options?.onSuccess?.(...args)
    },
  })
}

export const useImpersonateAdminUser = (
  options?: UseMutationOptions<ImpersonateAdminResponse, Error, ImpersonateAdminRequest>
) => {
  return useMutation({
    mutationFn: adminService.impersonateUser,
    ...options
  })
}
