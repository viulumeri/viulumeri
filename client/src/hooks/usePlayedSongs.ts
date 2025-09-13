import {
  useMutation,
  useQuery,
  type UseMutationOptions
} from '@tanstack/react-query'
import { playedSongsService } from '../services/playedSongs'

type StudentPlayedSongsResponse = {
  id: string
  name: string
  playedSongs: string[]
}

type PlayedSongsListResponse = {
  playedSongs: string[]
}

type MarkSongPlayedParams = {
  studentId: string
  songId: string
}

type UnmarkSongPlayedParams = {
  studentId: string
  songId: string
}

// Teacher hooks
export const useStudentPlayedSongs = (studentId: string) =>
  useQuery<StudentPlayedSongsResponse, Error>({
    queryKey: ['student-played-songs', studentId],
    queryFn: () => playedSongsService.getStudentPlayedSongs(studentId),
    enabled: !!studentId
  })

export const useMarkSongPlayed = (
  options?: UseMutationOptions<StudentPlayedSongsResponse, Error, MarkSongPlayedParams>
) =>
  useMutation<StudentPlayedSongsResponse, Error, MarkSongPlayedParams>({
    mutationFn: ({ studentId, songId }) =>
      playedSongsService.markSongPlayed(studentId, songId),
    ...options
  })

export const useUnmarkSongPlayed = (
  options?: UseMutationOptions<StudentPlayedSongsResponse, Error, UnmarkSongPlayedParams>
) =>
  useMutation<StudentPlayedSongsResponse, Error, UnmarkSongPlayedParams>({
    mutationFn: ({ studentId, songId }) =>
      playedSongsService.unmarkSongPlayed(studentId, songId),
    ...options
  })

// Student hook
export const useOwnPlayedSongs = () =>
  useQuery<PlayedSongsListResponse, Error>({
    queryKey: ['student-played-songs'],
    queryFn: playedSongsService.getOwnPlayedSongs
  })