import { describe, it, beforeEach, after } from 'node:test'
import assert from 'node:assert'
import fs from 'fs/promises'
import path from 'path'
import { adminSongsService, AdminSongError } from '../services/adminSongs'
import { musicService } from '../services/music'

const testMusicDir = path.join(__dirname, 'tmp', 'admin-songs-service')
const originalMusicDir = process.env.MUSIC_DIR

const asUpload = (content: string, name = 'track.mp3') => ({
  data: Buffer.from(content).toString('base64'),
  name,
  type: 'audio/mpeg'
})

const imageUpload = async () => {
  const image = await fs.readFile(
    path.join(__dirname, 'fixtures', 'music', 'valid-song-1', 'images', 'original.jpg')
  )

  return {
    data: image.toString('base64'),
    name: 'cover.jpg',
    type: 'image/jpeg'
  }
}

const resetMusicDir = async () => {
  await fs.rm(testMusicDir, { recursive: true, force: true })
  await fs.mkdir(testMusicDir, { recursive: true })
  process.env.MUSIC_DIR = testMusicDir
  await musicService.initialize(testMusicDir)
}

beforeEach(async () => {
  await resetMusicDir()
})

after(async () => {
  process.env.MUSIC_DIR = originalMusicDir
  await fs.rm(testMusicDir, { recursive: true, force: true })
})

describe('adminSongsService createSong', () => {
  it('creates a song directory with metadata, audio zips, and generated images', async () => {
    const song = await adminSongsService.createSong({
      name: 'Service Created Song',
      composer: 'Test Composer',
      isImpro: true,
      instrumentalTrack: asUpload('regular backing', 'backing.mp3'),
      melodyTrack: asUpload('regular melody', 'melody.mp3'),
      slowInstrumentalTrack: asUpload('slow backing', 'backing.mp3'),
      slowMelodyTrack: asUpload('slow melody', 'melody.mp3'),
      image: await imageUpload()
    })

    assert.strictEqual(song.title, 'Service Created Song')
    assert.strictEqual(song.metadata.composer, 'Test Composer')
    assert.strictEqual(song.isImpro, true)
    assert.strictEqual(song.isHidden, false)
    assert.strictEqual(song.hasInstrumentalTrack, true)
    assert.strictEqual(song.hasMelodyTrack, true)
    assert.strictEqual(song.hasSlowInstrumentalTrack, true)
    assert.strictEqual(song.hasSlowMelodyTrack, true)
    assert.strictEqual(song.hasImage, true)
    assert.strictEqual(song.metadata.images.card, `/api/songs/${song.id}/image/card`)

    const songDir = path.join(testMusicDir, song.id)
    await assert.doesNotReject(fs.access(path.join(songDir, 'audio.zip')))
    await assert.doesNotReject(fs.access(path.join(songDir, 'audio-slow.zip')))
    await assert.doesNotReject(fs.access(path.join(songDir, 'images', 'original.jpg')))
    await assert.doesNotReject(fs.access(path.join(songDir, 'images', 'list.webp')))
    await assert.doesNotReject(fs.access(path.join(songDir, 'images', 'card.webp')))
    await assert.doesNotReject(fs.access(path.join(songDir, 'images', 'hero.webp')))

    const regularSong = musicService.getSongById(song.id)
    assert(regularSong)
    assert.strictEqual(regularSong.title, 'Service Created Song')
  })

  it('requires a valid name and an instrumental track', async () => {
    await assert.rejects(
      adminSongsService.createSong({
        name: '',
        instrumentalTrack: asUpload('regular backing')
      }),
      /Song name must be 1-100 characters/
    )

    await assert.rejects(
      adminSongsService.createSong({
        name: 'No Instrumental'
      }),
      /Instrumental track is required/
    )
  })
})

describe('adminSongsService updateSong', () => {
  it('updates metadata, replaces optional tracks, and can remove optional files', async () => {
    const song = await adminSongsService.createSong({
      name: 'Editable Song',
      composer: 'Original Composer',
      instrumentalTrack: asUpload('regular backing'),
      melodyTrack: asUpload('regular melody'),
      slowInstrumentalTrack: asUpload('slow backing'),
      slowMelodyTrack: asUpload('slow melody'),
      image: await imageUpload()
    })

    const updated = await adminSongsService.updateSong(song.id, {
      name: 'Edited Song',
      composer: 'Updated Composer',
      isImpro: true,
      isHidden: true,
      deleteMelodyTrack: true,
      deleteSlowInstrumentalTrack: true,
      deleteSlowMelodyTrack: true,
      deleteImage: true
    })

    assert.strictEqual(updated.title, 'Edited Song')
    assert.strictEqual(updated.metadata.composer, 'Updated Composer')
    assert.strictEqual(updated.isImpro, true)
    assert.strictEqual(updated.isHidden, true)
    assert.strictEqual(updated.hasInstrumentalTrack, true)
    assert.strictEqual(updated.hasMelodyTrack, false)
    assert.strictEqual(updated.hasSlowInstrumentalTrack, false)
    assert.strictEqual(updated.hasSlowMelodyTrack, false)
    assert.strictEqual(updated.hasImage, false)
    assert.strictEqual(musicService.getAllSongs().some(item => item.id === song.id), false)
  })

  it('keeps the required instrumental track and reports missing songs', async () => {
    const error = await adminSongsService
      .updateSong('missing-song', { name: 'Missing' })
      .catch(caught => caught)

    assert(error instanceof AdminSongError)
    assert.strictEqual(error.statusCode, 404)
    assert.strictEqual(error.message, 'Song not found')
  })
})

describe('adminSongsService deleteSong', () => {
  it('hides a deleted song from admin and regular song lists', async () => {
    const song = await adminSongsService.createSong({
      name: 'Deleted Song',
      instrumentalTrack: asUpload('regular backing')
    })

    await adminSongsService.deleteSong(song.id)

    const adminSongs = await adminSongsService.listSongs()
    assert.strictEqual(adminSongs.some(item => item.id === song.id), false)
    assert.strictEqual(musicService.getAllSongs().some(item => item.id === song.id), false)

    const deletedSongs = JSON.parse(
      await fs.readFile(path.join(testMusicDir, '.deleted-songs.json'), 'utf8')
    ) as string[]
    assert(deletedSongs.includes(song.id))
  })
})
