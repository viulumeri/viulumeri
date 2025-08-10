import { Router } from 'express'
import { fromNodeHeaders } from 'better-auth/node'
import path from 'path'
import { musicService } from '../services/music'
import { auth } from '../utils/auth'

const songsRouter = Router()

const authenticateSession = async (request: any, response: any) => {
  const session = await auth.api.getSession({
    headers: fromNodeHeaders(request.headers)
  })

  if (!session) {
    response.status(401).json({ error: 'Authentication required' })
    return null
  }

  return session
}

songsRouter.get('/', async (request, response) => {
  const session = await authenticateSession(request, response)
  if (!session) return

  response.status(200).send(musicService.getAllSongs())
})

songsRouter.get('/:id', async (request, response) => {
  const session = await authenticateSession(request, response)
  if (!session) return

  const song = musicService.getSongById(request.params.id)

  if (!song) {
    return response.status(404).json({ error: 'Song not found' })
  }

  response.status(200).json(song)
})

songsRouter.get('/:id/bundle', async (request, response) => {
  const session = await authenticateSession(request, response)
  if (!session) return

  const song = musicService.getSongById(request.params.id)

  if (!song) {
    return response.status(404).json({ error: 'Song not found' })
  }

  const musicDir = process.env.MUSIC_DIR || '/var/www/audio'
  const bundlePath = path.join(musicDir, song.id, song.audioBundle)

  response.sendFile(bundlePath, err => {
    if (err) {
      response.status(404).json({ error: 'Audio bundle not found' })
    }
  })
})

export default songsRouter
