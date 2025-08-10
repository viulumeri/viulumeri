import fs from 'fs/promises'
import path from 'path'
import logger from '../utils/logger'

interface SongMetadata {
  title: string
  composer?: string
}

interface Song {
  id: string
  title: string
  audioBundle: string
  metadata: SongMetadata
}

class MusicService {
  private songs: Song[] = []
  private initialized = false

  async initialize(
    musicDir: string = process.env.MUSIC_DIR || '/var/www/audio'
  ): Promise<void> {
    try {
      logger.info(`Scanning music library at: ${musicDir}`)
      this.songs = await this.scanMusicLibrary(musicDir)
      this.initialized = true
      logger.info(`Loaded ${this.songs.length} songs`)
      logger.info(this.songs)
    } catch (error) {
      logger.error('Failed to initialize music library:', error)
      throw error
    }
  }

  private async scanMusicLibrary(musicDir: string): Promise<Song[]> {
    const songs: Song[] = []

    try {
      const folders = await fs.readdir(musicDir)

      for (const folder of folders) {
        try {
          const song = await this.processSongFolder(musicDir, folder)
          if (song) {
            songs.push(song)
          }
        } catch (error) {
          logger.error(`Error processing song folder ${folder}:`, error)
        }
      }
    } catch (error) {
      throw new Error(`Failed to read music directory ${musicDir}: ${error}`)
    }
    return songs
  }

  private async processSongFolder(
    musicDir: string,
    folder: string
  ): Promise<Song | null> {
    const songPath = path.join(musicDir, folder)
    const stat = await fs.stat(songPath)

    if (!stat.isDirectory()) {
      return null
    }

    const files = await fs.readdir(songPath)

    const audioBundle = files.find(f => f.endsWith('.zip'))
    if (!audioBundle) {
      throw new Error(`Missing audio bundle (.zip) in ${folder}`)
    }

    if (!files.includes('metadata.json')) {
      throw new Error(`Missing metadata.json in ${folder}`)
    }

    const metaContent = await fs.readFile(
      path.join(songPath, 'metadata.json'),
      'utf8'
    )
    const metadata = JSON.parse(metaContent)

    return {
      id: folder,
      title: metadata.title,
      audioBundle,
      metadata
    }
  }

  getAllSongs(): Song[] {
    if (!this.initialized) {
      throw new Error('Music service not initialized')
    }
    return [...this.songs]
  }

  getSongById(id: string): Song | undefined {
    return this.songs.find(song => song.id === id)
  }
}

export const musicService = new MusicService()
