import type { SongImageVariant, SongMetadata } from '../../../shared/types'

const FALLBACK_IMAGE = '/song-placeholder.svg'

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
