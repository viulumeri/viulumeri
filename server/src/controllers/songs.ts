import { Router } from 'express'
import fs from 'fs/promises'
import path from 'path'
import type { SongImageVariant } from '../../../shared/types'
import { musicService } from '../services/music'

const songsRouter = Router()
const IMAGE_VARIANTS: SongImageVariant[] = ['list', 'card', 'hero']
const IMAGE_EXTENSIONS = ['.avif', '.webp', '.jpg', '.jpeg', '.png', '.svg']

const resolveSongVariantImagePath = async (
  musicDir: string,
  songId: string,
  variant: SongImageVariant
): Promise<string | null> => {
  const imageDir = path.join(musicDir, songId, 'images')

  for (const extension of IMAGE_EXTENSIONS) {
    const candidate = path.join(imageDir, `${variant}${extension}`)
    try {
      await fs.access(candidate)
      return candidate
    } catch {
      // Try next extension.
    }
  }

  return null
}

songsRouter.get('/', async (_request, response) => {
  response.status(200).send(musicService.getAllSongs())
})

songsRouter.get('/:id', async (request, response) => {
  const song = musicService.getSongById(request.params.id)

  if (!song) {
    return response.status(404).json({ error: 'Song not found' })
  }

  response.status(200).json(song)
})

songsRouter.get('/:id/image/:variant', async (request, response) => {
  const song = musicService.getSongById(request.params.id)

  if (!song) {
    return response.status(404).json({ error: 'Song not found' })
  }

  const variantParam = request.params.variant
  if (!IMAGE_VARIANTS.includes(variantParam as SongImageVariant)) {
    return response.status(400).json({ error: 'Invalid image variant' })
  }

  const variant = variantParam as SongImageVariant
  const musicDir = process.env.MUSIC_DIR || '/var/www/audio'
  const imagePath = await resolveSongVariantImagePath(musicDir, song.id, variant)

  if (!imagePath) {
    return response.status(404).json({ error: 'Song image not found' })
  }

  response.set('Cache-Control', 'public, max-age=86400')
  response.sendFile(imagePath, err => {
    if (err && !response.headersSent) {
      response.status(404).json({ error: 'Song image not found' })
    }
  })
})

songsRouter.get('/:id/bundle', async (request, response) => {
  const song = musicService.getSongById(request.params.id)

  if (!song) {
    return response.status(404).json({ error: 'Song not found' })
  }

  const musicDir = process.env.MUSIC_DIR || '/var/www/audio'
  const bundlePath = path.join(musicDir, song.id, 'audio.zip')

  response.sendFile(bundlePath, err => {
    if (err && !response.headersSent) {
      response.status(404).json({ error: 'Audio bundle not found' })
    }
  })
})

songsRouter.get('/:id/bundle-slow', async (request, response) => {
  const song = musicService.getSongById(request.params.id)

  if (!song) {
    return response.status(404).json({ error: 'Song not found' })
  }

  const musicDir = process.env.MUSIC_DIR || '/var/www/audio'
  const slowBundlePath = path.join(musicDir, song.id, 'audio-slow.zip')

  response.sendFile(slowBundlePath, err => {
    if (err && !response.headersSent) {
      response.status(404).json({ error: 'Audio bundle not found' })
    }
  })
})

songsRouter.head('/:id/bundle-slow', async (request, response) => {
  const song = musicService.getSongById(request.params.id)

  if (!song) {
    return response.status(404).end()
  }

  const musicDir = process.env.MUSIC_DIR || '/var/www/audio'
  const slowBundlePath = path.join(musicDir, song.id, 'audio-slow.zip')

  response.sendFile(slowBundlePath, err => {
    if (err && !response.headersSent) {
      response.status(404).end()
    }
  })
})

export default songsRouter
