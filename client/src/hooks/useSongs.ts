import { useQuery } from '@tanstack/react-query'
import { songsService } from '../services/songs'

export const useSongs = () => {
  return useQuery({
    queryKey: ['songs'],
    queryFn: songsService.getAll
  })
}
