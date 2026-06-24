import fs from 'fs/promises'
import path from 'path'
import logger from '../utils/logger'
import type { Song, SongListItem, SongMetadata } from '../../../shared/types'
import { isImproSong } from '../utils/songMetadata'
import { readSongOrder, sortBySongOrder } from './songOrder'

const DELETED_SONGS_FILE = '.deleted-songs.json'

const readDeletedSongIds = async (musicDir: string): Promise<Set<string>> => {
  try {
    const raw = await fs.readFile(path.join(musicDir, DELETED_SONGS_FILE), 'utf8')
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return new Set()

    return new Set(parsed.filter((id): id is string => typeof id === 'string'))
  } catch {
    return new Set()
  }
}

class MusicService {
  private songs: Song[] = []
  private initialized = false

  initializeEmpty(): void {
    this.songs = []
    this.initialized = true
  }

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
      const deletedSongIds = await readDeletedSongIds(musicDir)

      for (const folder of folders) {
        if (folder.startsWith('.deleted-') || deletedSongIds.has(folder)) {
          continue
        }

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
      const message =
        error instanceof Error ? error.message : String(error)

      const wrapped = new Error(
        `Failed to read music directory ${musicDir}: ${message}`
      )

      ;(wrapped as { cause?: unknown }).cause = error

      const code = (error as NodeJS.ErrnoException | undefined)?.code
      if (code) {
        ;(wrapped as NodeJS.ErrnoException).code = code
      }

      throw wrapped
    }
    const songOrder = await readSongOrder(musicDir)
    return sortBySongOrder(songs, songOrder)
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

    const audioBundle =
      files.find(f => f === 'audio.zip') ??
      files.find(
        f =>
          f.endsWith('.zip') &&
          !f.includes('-slow') &&
          !f.includes('-instrumental')
      )
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
    const updatedAt = await this.getSongUpdatedAt(songPath)
    const rawMetadata = JSON.parse(metaContent) as SongMetadata
    const metadata: SongMetadata = {
      ...rawMetadata,
      isImpro: isImproSong(rawMetadata, folder),
      images: {
        list: `/api/songs/${folder}/image/list`,
        card: `/api/songs/${folder}/image/card`,
        hero: `/api/songs/${folder}/image/hero`
      }
    }

    return {
      id: folder,
      title: metadata.title,
      updatedAt,
      audioBundle,
      metadata
    }
  }

  private async getFileMtime(filePath: string): Promise<number> {
    try {
      const stat = await fs.stat(filePath)
      return stat.mtimeMs
    } catch {
      return 0
    }
  }

  private async getSongUpdatedAt(songPath: string): Promise<string> {
    const imageDir = path.join(songPath, 'images')
    const updatedAtMs = Math.max(
      await this.getFileMtime(path.join(songPath, 'metadata.json')),
      await this.getFileMtime(path.join(songPath, 'audio.zip')),
      await this.getFileMtime(path.join(songPath, 'audio-slow.zip')),
      await this.getFileMtime(path.join(imageDir, 'original.jpg')),
      await this.getFileMtime(path.join(imageDir, 'list.webp')),
      await this.getFileMtime(path.join(imageDir, 'card.webp')),
      await this.getFileMtime(path.join(imageDir, 'hero.webp'))
    )

    return new Date(updatedAtMs || Date.now()).toISOString()
  }

  getAllSongs(): SongListItem[] {
    if (!this.initialized) {
      throw new Error('Music service not initialized')
    }
    return this.songs
      .filter(song => song.metadata.isHidden !== true)
      .map(({ audioBundle, ...song }) => song)
  }

  getSongById(id: string): Song | undefined {
    return this.songs.find(song => song.id === id)
  }
}

export const musicService = new MusicService()
