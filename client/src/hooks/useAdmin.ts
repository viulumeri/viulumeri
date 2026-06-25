import { useQuery, useMutation, useQueryClient, type UseQueryOptions, type UseMutationOptions } from '@tanstack/react-query'
import {
  adminService,
  type AdminFeedbackItem,
  type AdminSongItem,
  type AdminSongSavePayload,
  type GetAdminFeedbacksResponse,
  type ImpersonateAdminRequest,
  type ImpersonateAdminResponse,
  type Student,
  type SummaryResponse,
  type Teacher,
  type UpdateAdminUserRequest,
  type UpdateAdminUserResponse
} from '../services/admin'
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

type AdminSongListResponse = { songs: AdminSongItem[] }
type AdminSongOrderMutationContext = {
  previousAdminSongs?: AdminSongListResponse
}

export const useUpdateAdminSongOrder = (
  options?: UseMutationOptions<
    AdminSongListResponse,
    Error,
    string[],
    AdminSongOrderMutationContext
  >
) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: adminService.updateAdminSongOrder,
    ...options,
    onMutate: async songIds => {
      await queryClient.cancelQueries({ queryKey: ['admin', 'songs'] })

      const previousAdminSongs = queryClient.getQueryData<AdminSongListResponse>([
        'admin',
        'songs'
      ])

      if (previousAdminSongs) {
        const songsById = new Map(previousAdminSongs.songs.map(song => [song.id, song]))
        const orderedSongIds = new Set(songIds)
        const orderedSongs = songIds
          .map(songId => songsById.get(songId))
          .filter((song): song is AdminSongItem => Boolean(song))
        const remainingSongs = previousAdminSongs.songs.filter(song => !orderedSongIds.has(song.id))

        queryClient.setQueryData(['admin', 'songs'], {
          songs: [...orderedSongs, ...remainingSongs]
        })
      }

      return { previousAdminSongs }
    },
    onError: (error, variables, context, mutationContext) => {
      if (context?.previousAdminSongs) {
        queryClient.setQueryData(['admin', 'songs'], context.previousAdminSongs)
      }

      options?.onError?.(error, variables, context, mutationContext)
    },
    onSuccess: (data, variables, context, mutationContext) => {
      queryClient.setQueryData(['admin', 'songs'], data)
      queryClient.invalidateQueries({ queryKey: ['songs'] })
      options?.onSuccess?.(data, variables, context, mutationContext)
    },
    onSettled: (data, error, variables, context, mutationContext) => {
      options?.onSettled?.(data, error, variables, context, mutationContext)
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
  options?: UseMutationOptions<
    { feedback: { id: string; isRead: boolean; category: AdminFeedbackItem['category'] } },
    Error,
    { id: string; isRead: boolean }
  >
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

export const useUpdateAdminFeedbackCategory = (
  options?: UseMutationOptions<
    { feedback: { id: string; isRead: boolean; category: AdminFeedbackItem['category'] } },
    Error,
    { id: string; category: AdminFeedbackItem['category'] }
  >
) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, category }) =>
      adminService.updateAdminFeedbackCategory(id, category),
    ...options,
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'feedbacks'] })
      options?.onSuccess?.(...args)
    }
  })
}

export const useMarkAllAdminFeedbacksRead = (
  options?: UseMutationOptions<{ modifiedCount: number }, Error, void>
) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: adminService.markAllFeedbacksRead,
    ...options,
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'feedbacks'] })
      options?.onSuccess?.(...args)
    }
  })
}

export const useDeleteReadAdminFeedbacks = (
  options?: UseMutationOptions<void, Error, void>
) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: adminService.deleteReadFeedbacks,
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

export const useUpdateAdminUser = (
  options?: UseMutationOptions<UpdateAdminUserResponse, Error, UpdateAdminUserRequest>
) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: adminService.updateUser,
    ...options,
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'teachers'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'students'] })
      options?.onSuccess?.(...args)
    }
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
      options?.onSuccess?.(...args)
    }
  })
}
