import { Router } from 'express'
import path from 'path'
import { musicService } from '../services/music'

const songsRouter = Router()

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
