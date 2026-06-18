import type { SongMetadata } from '../../../shared/types'

export const isImproSong = (
  metadata: Pick<SongMetadata, 'title' | 'isImpro'>,
  songId: string
): boolean => {
  return (
    metadata.isImpro === true ||
    metadata.title.toLowerCase().includes('impro') ||
    songId.toLowerCase().includes('impro')
  )
}
