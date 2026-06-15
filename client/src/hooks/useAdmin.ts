import { useQuery, useMutation, useQueryClient, type UseQueryOptions, type UseMutationOptions } from '@tanstack/react-query'
import { adminService, type SummaryResponse, type Teacher, type Student, type GetAdminFeedbacksResponse, type ImpersonateAdminRequest, type ImpersonateAdminResponse  } from '../services/admin'

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

export const useUpdateAdminFeedbackReadStatus = (
  options?: UseMutationOptions<{ feedback: { id: string; isRead: boolean } }, Error, { id: string; isRead: boolean }>
) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, isRead }) =>
      adminService.updateAdminFeedbackReadStatus(id, isRead),
    ...options,
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'feedbacks'] })
      options?.onSuccess?.(...args)
    }
  })
}

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

export const useDeleteAdminFeedback = (
  options?: UseMutationOptions<void, Error, string>
) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => adminService.deleteFeedback(id),
    ...options,
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'feedbacks'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'summary'] })
      options?.onSuccess?.(...args)
    }
  })
}
