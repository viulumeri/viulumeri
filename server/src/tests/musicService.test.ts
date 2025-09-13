import { describe, it, before, after, beforeEach } from 'node:test'
import assert from 'node:assert'
import { musicService } from '../services/music'
import path from 'path'

const fixturesPath = path.join(__dirname, 'fixtures', 'music')
const validMusicDir = fixturesPath
const nonExistentDir = path.join(__dirname, 'non-existent-directory')

describe('MusicService', () => {
  beforeEach(async () => {
    const service = musicService as any
    service.songs = []
    service.initialized = false
  })

  describe('initialize', () => {
    it('should successfully initialize with valid music directory', async () => {
      await musicService.initialize(validMusicDir)

      const songs = musicService.getAllSongs()
      assert.strictEqual(songs.length, 2)

      const song1 = songs.find(s => s.id === 'valid-song-1')
      const song2 = songs.find(s => s.id === 'valid-song-2')

      assert(song1)
      assert.strictEqual(song1.title, 'Tästä se alkaa')
      assert.strictEqual(song1.metadata.composer, 'Laura Lintula')

      assert(song2)
      assert.strictEqual(song2.title, 'Hyppyhiiri')
      assert.strictEqual(song2.metadata.composer, 'Laura Lintula')
    })

    it('should throw error for non-existent directory', async () => {
      await assert.rejects(
        async () => {
          await musicService.initialize(nonExistentDir)
        },
        {
          message: /Failed to read music directory/
        }
      )
    })

    it('should handle missing audio bundle error', async () => {
      const service = musicService as any

      await assert.rejects(
        async () => {
          await service.processSongFolder(fixturesPath, 'missing-zip')
        },
        {
          message: 'Missing audio bundle (.zip) in missing-zip'
        }
      )
    })

    it('should handle missing metadata error', async () => {
      const service = musicService as any

      await assert.rejects(
        async () => {
          await service.processSongFolder(fixturesPath, 'missing-metadata')
        },
        {
          message: 'Missing metadata.json in missing-metadata'
        }
      )
    })

    it('should handle malformed JSON metadata', async () => {
      const service = musicService as any

      await assert.rejects(
        async () => {
          await service.processSongFolder(fixturesPath, 'invalid-json')
        },
        {
          name: 'SyntaxError'
        }
      )
    })

    it('should skip non-directory files', async () => {
      await musicService.initialize(validMusicDir)

      const songs = musicService.getAllSongs()
      assert.strictEqual(songs.length, 2)
      assert(!songs.some(s => s.id === 'not-a-directory'))
    })
  })

  describe('getAllSongs', () => {
    it('should throw error when not initialized', () => {
      assert.throws(
        () => {
          musicService.getAllSongs()
        },
        {
          message: 'Music service not initialized'
        }
      )
    })

    it('should return songs without audioBundle property', async () => {
      await musicService.initialize(validMusicDir)

      const songs = musicService.getAllSongs()
      assert.strictEqual(songs.length, 2)

      songs.forEach(song => {
        assert(song.id)
        assert(song.title)
        assert(song.metadata)
        assert(!('audioBundle' in song))
      })
    })

    it('should return empty array when service has no songs', () => {
      const service = musicService as any
      service.songs = []
      service.initialized = true

      const songs = musicService.getAllSongs()
      assert.strictEqual(songs.length, 0)
    })
  })

  describe('getSongById', () => {
    it('should return song with audioBundle for valid ID', async () => {
      await musicService.initialize(validMusicDir)
      const song = musicService.getSongById('valid-song-1')

      assert(song)
      assert.strictEqual(song.id, 'valid-song-1')
      assert.strictEqual(song.title, 'Tästä se alkaa')
      assert.strictEqual(song.audioBundle, 'audio.zip')
      assert(song.metadata)
      assert.strictEqual(song.metadata.composer, 'Laura Lintula')
    })

    it('should return undefined for non-existent ID', async () => {
      await musicService.initialize(validMusicDir)
      const song = musicService.getSongById('non-existent-song')
      assert.strictEqual(song, undefined)
    })

    it('should return undefined for empty string ID', async () => {
      await musicService.initialize(validMusicDir)
      const song = musicService.getSongById('')
      assert.strictEqual(song, undefined)
    })
  })
})
