import { useQuery, useMutation, useQueryClient, type UseQueryOptions, type UseMutationOptions } from '@tanstack/react-query'
import { adminService, type SummaryResponse, type Teacher, type Student, type GetAdminFeedbacksResponse, type ImpersonateAdminRequest, type ImpersonateAdminResponse, type AdminSongItem, type AdminSongSavePayload  } from '../services/admin'
import { clearCachedSongAudio } from '../services/audio'

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

export const useAdminSongs = (
  options?: Omit<UseQueryOptions<{ songs: AdminSongItem[] }, Error>, 'queryKey' | 'queryFn'>
) =>
  useQuery({
    queryKey: ['admin', 'songs'],
    queryFn: adminService.getAdminSongs,
    ...options
  })

export const useCreateAdminSong = (
  options?: UseMutationOptions<{ song: AdminSongItem }, Error, AdminSongSavePayload>
) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: adminService.createAdminSong,
    ...options,
    onSuccess: (data, ...args) => {
      void clearCachedSongAudio(data.song.id)
      queryClient.invalidateQueries({ queryKey: ['admin', 'songs'] })
      queryClient.invalidateQueries({ queryKey: ['songs'] })
      queryClient.invalidateQueries({ queryKey: ['song'] })
      options?.onSuccess?.(data, ...args)
    }
  })
}

export const useUpdateAdminSong = (
  options?: UseMutationOptions<{ song: AdminSongItem }, Error, { id: string; body: AdminSongSavePayload }>
) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, body }) => adminService.updateAdminSong(id, body),
    ...options,
    onSuccess: (data, variables, ...args) => {
      void clearCachedSongAudio(variables.id)
      queryClient.invalidateQueries({ queryKey: ['admin', 'songs'] })
      queryClient.invalidateQueries({ queryKey: ['songs'] })
      queryClient.invalidateQueries({ queryKey: ['song'] })
      options?.onSuccess?.(data, variables, ...args)
    }
  })
}

export const useDeleteAdminSong = (
  options?: UseMutationOptions<void, Error, string>
) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: adminService.deleteAdminSong,
    ...options,
    onSuccess: (data, songId, ...args) => {
      void clearCachedSongAudio(songId)
      queryClient.invalidateQueries({ queryKey: ['admin', 'songs'] })
      queryClient.invalidateQueries({ queryKey: ['songs'] })
      queryClient.invalidateQueries({ queryKey: ['song'] })
      options?.onSuccess?.(data, songId, ...args)
    }
  })
}

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
