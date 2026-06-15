import type { SongImageVariant, SongMetadata } from '../../../shared/types'
import type { SyntheticEvent } from 'react'

export const FALLBACK_IMAGE = '/song-placeholder.svg'

export const getSongImageUrl = (
  metadata: SongMetadata | undefined,
  variant: SongImageVariant
): string => {
  if (metadata?.images?.[variant]) {
    return metadata.images[variant]
  }

  if (metadata?.imgurl) {
    return metadata.imgurl
  }

  return FALLBACK_IMAGE
}

export const handleSongImageError = (
  event: SyntheticEvent<HTMLImageElement>
): void => {
  const image = event.currentTarget

  if (image.src.endsWith(FALLBACK_IMAGE)) {
    image.removeAttribute('src')
    return
  }

  image.src = FALLBACK_IMAGE
}
