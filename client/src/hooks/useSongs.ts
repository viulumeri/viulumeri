import { useQuery } from '@tanstack/react-query'
import { songsService } from '../services/songs'

export const useSongsList = () => {
  return useQuery({
    queryKey: ['songs'],
    queryFn: songsService.getAll
  })
}

export const useSongById = (songId: string | undefined) => {
  return useQuery({
    queryKey: ['song', songId],
    queryFn: () => songsService.getById(songId!),
    enabled: !!songId
  })
}