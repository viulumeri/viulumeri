import fs from 'fs/promises'
import path from 'path'
import { inflateRawSync } from 'zlib'
import sharp from 'sharp'
import type { SongMetadata } from '../../../shared/types'
import { musicService } from './music'
import { isImproSong } from '../utils/songMetadata'

const IMAGE_VARIANTS = {
  list: { width: 112, height: 112 },
  card: { width: 720, height: 720 },
  hero: { width: 1920, height: 1080 }
}

const GENERATED_IMAGE_FILES = ['list.webp', 'card.webp', 'hero.webp']
const ORIGINAL_IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.avif', '.svg']
const DELETED_SONGS_FILE = '.deleted-songs.json'
const BACKING_NAME_PARTS = [
  'backing',
  'instrumental',
  'tausta',
  'saestys',
  'säestys'
]
const MELODY_NAME_PARTS = ['melody', 'melodia']

export class AdminSongError extends Error {
  constructor(message: string, public statusCode: number = 400) {
    super(message)
    this.name = 'AdminSongError'
  }
}

type UploadedFile = {
  data: string
  name?: string
  type?: string
}

export type AdminSongPayload = {
  name?: string
  composer?: string | null
  isImpro?: boolean
  isHidden?: boolean
  melodyTrack?: UploadedFile | null
  instrumentalTrack?: UploadedFile | null
  slowInstrumentalTrack?: UploadedFile | null
  slowMelodyTrack?: UploadedFile | null
  image?: UploadedFile | null
  deleteMelodyTrack?: boolean
  deleteSlowInstrumentalTrack?: boolean
  deleteSlowMelodyTrack?: boolean
  deleteImage?: boolean
}

export type AdminSongListItem = {
  id: string
  title: string
  updatedAt: string
  isImpro: boolean
  isHidden: boolean
  hasInstrumentalTrack: boolean
  hasMelodyTrack: boolean
  hasSlowInstrumentalTrack: boolean
  hasSlowMelodyTrack: boolean
  hasImage: boolean
  metadata: SongMetadata
}

const getMusicDir = () => path.resolve(process.env.MUSIC_DIR || '/var/www/audio')

const ensureInside = (root: string, target: string) => {
  const relative = path.relative(root, target)
  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    throw new Error('Invalid song path')
  }
}

const getSongDir = (musicDir: string, songId: string) => {
  const songDir = path.resolve(musicDir, songId)
  ensureInside(musicDir, songDir)
  return songDir
}

const isDeletedSongDir = (name: string) => name.startsWith('.deleted-')

const getDeletedSongsPath = (musicDir: string) =>
  path.join(musicDir, DELETED_SONGS_FILE)

const readDeletedSongIds = async (musicDir: string): Promise<Set<string>> => {
  try {
    const raw = await fs.readFile(getDeletedSongsPath(musicDir), 'utf8')
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return new Set()

    return new Set(parsed.filter((id): id is string => typeof id === 'string'))
  } catch {
    return new Set()
  }
}

const writeDeletedSongIds = async (musicDir: string, songIds: Set<string>) => {
  await fs.writeFile(
    getDeletedSongsPath(musicDir),
    `${JSON.stringify(Array.from(songIds).sort(), null, 2)}\n`,
    'utf8'
  )
}

const addDeletedSongId = async (musicDir: string, songId: string) => {
  const songIds = await readDeletedSongIds(musicDir)
  songIds.add(songId)
  await writeDeletedSongIds(musicDir, songIds)
}

const removeDeletedSongId = async (musicDir: string, songId: string) => {
  const songIds = await readDeletedSongIds(musicDir)
  if (!songIds.delete(songId)) return
  await writeDeletedSongIds(musicDir, songIds)
}

const exists = async (filePath: string) => {
  try {
    await fs.access(filePath)
    return true
  } catch {
    return false
  }
}

const getFileMtime = async (filePath: string) => {
  try {
    const stat = await fs.stat(filePath)
    return stat.mtimeMs
  } catch {
    return 0
  }
}

const removeDirectoryWithRetry = async (dirPath: string) => {
  let lastError: unknown

  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      await fs.rm(dirPath, {
        recursive: true,
        force: true,
        maxRetries: 3,
        retryDelay: 100
      })
      return
    } catch (error) {
      lastError = error
      await new Promise(resolve => setTimeout(resolve, 100 * (attempt + 1)))
    }
  }

  throw lastError
}

const moveSongDirToTombstone = async (musicDir: string, songDir: string, songId: string) => {
  const tombstoneDir = path.resolve(
    musicDir,
    `.deleted-${Date.now()}-${songId.replace(/[^a-zA-Z0-9._-]+/g, '-')}`
  )
  ensureInside(musicDir, tombstoneDir)
  await fs.rename(songDir, tombstoneDir)
  return tombstoneDir
}

const removeSongDirBestEffort = async (
  musicDir: string,
  songDir: string,
  songId: string
) => {
  try {
    const tombstoneDir = await moveSongDirToTombstone(musicDir, songDir, songId)
    await removeDirectoryWithRetry(tombstoneDir)
  } catch {
    await removeDirectoryWithRetry(songDir).catch(() => undefined)
  }
}

const slugify = (value: string) => {
  const slug = value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/ä/g, 'a')
    .replace(/ö/g, 'o')
    .replace(/å/g, 'a')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

  return slug || 'kappale'
}

const uniqueSongId = async (musicDir: string, title: string) => {
  const base = slugify(title)
  let candidate = base
  let index = 2

  while (await exists(path.join(musicDir, candidate))) {
    candidate = `${base}-${index}`
    index += 1
  }

  return candidate
}

const parseUpload = (file: UploadedFile): Buffer => {
  const data = file.data.includes(',')
    ? file.data.slice(file.data.indexOf(',') + 1)
    : file.data

  return Buffer.from(data, 'base64')
}

const crcTable = Array.from({ length: 256 }, (_value, index) => {
  let crc = index
  for (let bit = 0; bit < 8; bit += 1) {
    crc = crc & 1 ? 0xedb88320 ^ (crc >>> 1) : crc >>> 1
  }
  return crc >>> 0
})

const crc32 = (buffer: Buffer) => {
  let crc = 0xffffffff
  for (const byte of buffer) {
    crc = crcTable[(crc ^ byte) & 0xff] ^ (crc >>> 8)
  }
  return (crc ^ 0xffffffff) >>> 0
}

const writeUInt32 = (value: number) => {
  const buffer = Buffer.alloc(4)
  buffer.writeUInt32LE(value >>> 0, 0)
  return buffer
}

const writeUInt16 = (value: number) => {
  const buffer = Buffer.alloc(2)
  buffer.writeUInt16LE(value, 0)
  return buffer
}

const writeStoredZip = async (
  zipPath: string,
  entries: Record<string, Buffer | undefined>
) => {
  const localParts: Buffer[] = []
  const centralParts: Buffer[] = []
  let offset = 0
  let entryCount = 0

  for (const [name, data] of Object.entries(entries)) {
    if (!data) continue

    const nameBuffer = Buffer.from(name)
    const checksum = crc32(data)
    const localHeader = Buffer.concat([
      writeUInt32(0x04034b50),
      writeUInt16(20),
      writeUInt16(0),
      writeUInt16(0),
      writeUInt16(0),
      writeUInt16(0),
      writeUInt32(checksum),
      writeUInt32(data.length),
      writeUInt32(data.length),
      writeUInt16(nameBuffer.length),
      writeUInt16(0),
      nameBuffer
    ])

    localParts.push(localHeader, data)
    centralParts.push(Buffer.concat([
      writeUInt32(0x02014b50),
      writeUInt16(20),
      writeUInt16(20),
      writeUInt16(0),
      writeUInt16(0),
      writeUInt16(0),
      writeUInt16(0),
      writeUInt32(checksum),
      writeUInt32(data.length),
      writeUInt32(data.length),
      writeUInt16(nameBuffer.length),
      writeUInt16(0),
      writeUInt16(0),
      writeUInt16(0),
      writeUInt16(0),
      writeUInt32(0),
      writeUInt32(offset),
      nameBuffer
    ]))

    offset += localHeader.length + data.length
    entryCount += 1
  }

  const localData = Buffer.concat(localParts)
  const centralData = Buffer.concat(centralParts)
  const endRecord = Buffer.concat([
    writeUInt32(0x06054b50),
    writeUInt16(0),
    writeUInt16(0),
    writeUInt16(entryCount),
    writeUInt16(entryCount),
    writeUInt32(centralData.length),
    writeUInt32(localData.length),
    writeUInt16(0)
  ])

  await fs.writeFile(zipPath, Buffer.concat([localData, centralData, endRecord]))
}

const validateName = (name: unknown): string | null => {
  if (typeof name !== 'string') return null
  const trimmed = name.trim()
  if (trimmed.length < 1 || trimmed.length > 100) return null
  return trimmed
}

const readOptionalText = (value: unknown): string | undefined => {
  if (value === undefined || value === null) return undefined
  if (typeof value !== 'string') return undefined

  const trimmed = value.trim()
  return trimmed.length > 0 && trimmed.length <= 100 ? trimmed : undefined
}

const writeMetadata = async (
  songDir: string,
  metadata: SongMetadata
) => {
  await fs.writeFile(
    path.join(songDir, 'metadata.json'),
    `${JSON.stringify(metadata, null, 2)}\n`,
    'utf8'
  )
}

const readMetadata = async (songDir: string): Promise<SongMetadata> => {
  const raw = await fs.readFile(path.join(songDir, 'metadata.json'), 'utf8')
  return JSON.parse(raw) as SongMetadata
}

const removeGeneratedImages = async (imagesDir: string) => {
  await Promise.all(
    GENERATED_IMAGE_FILES.map(file =>
      fs.rm(path.join(imagesDir, file), { force: true })
    )
  )
}

const removeOriginalImages = async (imagesDir: string) => {
  await Promise.all(
    ORIGINAL_IMAGE_EXTENSIONS.map(extension =>
      fs.rm(path.join(imagesDir, `original${extension}`), { force: true })
    )
  )
}

const removeSongImages = async (songDir: string) => {
  const imagesDir = path.join(songDir, 'images')
  await removeGeneratedImages(imagesDir)
  await removeOriginalImages(imagesDir)
  await fs.rm(imagesDir, { recursive: true, force: true })
}

const saveImage = async (songDir: string, image: UploadedFile) => {
  const imagesDir = path.join(songDir, 'images')
  const tmpDir = path.join(songDir, `.tmp-images-${Date.now()}`)
  await fs.mkdir(tmpDir, { recursive: true })

  const tmpOriginal = path.join(tmpDir, 'original.jpg')

  try {
    await sharp(parseUpload(image))
      .jpeg({ quality: 90 })
      .toFile(tmpOriginal)

    for (const [variant, size] of Object.entries(IMAGE_VARIANTS)) {
      const tmpVariant = path.join(tmpDir, `${variant}.webp`)
      await sharp(tmpOriginal)
        .resize(size.width, size.height, {
          fit: 'cover',
          position: 'center'
        })
        .webp({ quality: 82 })
        .toFile(tmpVariant)
    }

    await removeSongImages(songDir)
    await fs.mkdir(imagesDir, { recursive: true })

    await fs.rename(tmpOriginal, path.join(imagesDir, 'original.jpg'))
    await Promise.all(
      Object.keys(IMAGE_VARIANTS).map(variant =>
        fs.rename(
          path.join(tmpDir, `${variant}.webp`),
          path.join(imagesDir, `${variant}.webp`)
        )
      )
    )
  } finally {
    await fs.rm(tmpDir, { recursive: true, force: true })
  }
}

const writeTrackZip = async (
  zipPath: string,
  tracks: { backing?: Buffer; melody?: Buffer }
) => {
  if (!tracks.backing && !tracks.melody) {
    await fs.rm(zipPath, { force: true })
    return
  }

  await writeStoredZip(zipPath, {
    'backing.mp3': tracks.backing,
    'melody.mp3': tracks.melody
  })
}

const reloadSongs = async () => {
  await musicService.initialize(getMusicDir())
}

const readAdminSong = async (
  musicDir: string,
  songId: string
): Promise<AdminSongListItem | null> => {
  const songDir = getSongDir(musicDir, songId)
  const metadataPath = path.join(songDir, 'metadata.json')

  if (!(await exists(metadataPath))) {
    return null
  }

  const rawMetadata = await readMetadata(songDir)
  const metadata: SongMetadata = {
    ...rawMetadata,
    images: {
      list: `/api/songs/${songId}/image/list`,
      card: `/api/songs/${songId}/image/card`,
      hero: `/api/songs/${songId}/image/hero`
    }
  }
  const imagesDir = path.join(songDir, 'images')
  const hasImage = await exists(path.join(imagesDir, 'original.jpg'))

  const audioZipPath = path.join(songDir, 'audio.zip')
  const hasAudioZip = await exists(audioZipPath)
  const audioEntries = await readZipMp3FileNames(audioZipPath)
  const slowZipPath = path.join(songDir, 'audio-slow.zip')
  const hasSlowAudioZip = await exists(slowZipPath)
  const slowAudioEntries = await readZipMp3FileNames(slowZipPath)
  const updatedAtMs = Math.max(
    await getFileMtime(metadataPath),
    await getFileMtime(audioZipPath),
    await getFileMtime(slowZipPath),
    await getFileMtime(path.join(imagesDir, 'original.jpg')),
    await getFileMtime(path.join(imagesDir, 'list.webp')),
    await getFileMtime(path.join(imagesDir, 'card.webp')),
    await getFileMtime(path.join(imagesDir, 'hero.webp'))
  )

  return {
    id: songId,
    title: metadata.title,
    updatedAt: new Date(updatedAtMs || Date.now()).toISOString(),
    isImpro: isImproSong(metadata, songId),
    isHidden: metadata.isHidden === true,
    hasInstrumentalTrack:
      hasAudioZip && audioEntries.some(name => hasNamePart(name, BACKING_NAME_PARTS)),
    hasMelodyTrack:
      hasAudioZip && audioEntries.some(name => hasNamePart(name, MELODY_NAME_PARTS)),
    hasSlowInstrumentalTrack:
      hasSlowAudioZip && slowAudioEntries.some(name => hasNamePart(name, BACKING_NAME_PARTS)),
    hasSlowMelodyTrack:
      hasSlowAudioZip && slowAudioEntries.some(name => hasNamePart(name, MELODY_NAME_PARTS)),
    hasImage,
    metadata
  }
}

const normalizeZipName = (name: string) =>
  name
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()

const hasNamePart = (name: string, nameParts: string[]) => {
  const normalizedName = normalizeZipName(name)
  const normalizedParts = nameParts.map(part => normalizeZipName(part))

  return normalizedParts.some(part => normalizedName.includes(part))
}

const isMacOsMetadataEntry = (name: string) => {
  const parts = name.split('/')
  const baseName = parts[parts.length - 1] ?? name

  return parts.includes('__MACOSX') || baseName.startsWith('._')
}

const ZIP_CENTRAL_DIRECTORY_SIGNATURE = 0x02014b50
const ZIP_LOCAL_FILE_SIGNATURE = 0x04034b50

type ZipEntry = {
  name: string
  data: Buffer
}

const readZipEntries = async (zipPath: string): Promise<ZipEntry[]> => {
  try {
    const buffer = await fs.readFile(zipPath)
    const entries: ZipEntry[] = []
    let offset = 0

    while (offset <= buffer.length - 30) {
      const signature = buffer.readUInt32LE(offset)

      if (signature === ZIP_CENTRAL_DIRECTORY_SIGNATURE) {
        if (offset + 46 > buffer.length) break

        const fileNameLength = buffer.readUInt16LE(offset + 28)
        const extraLength = buffer.readUInt16LE(offset + 30)
        const commentLength = buffer.readUInt16LE(offset + 32)
        const compressionMethod = buffer.readUInt16LE(offset + 10)
        const compressedSize = buffer.readUInt32LE(offset + 20)
        const localHeaderOffset = buffer.readUInt32LE(offset + 42)
        const fileNameStart = offset + 46
        const fileNameEnd = fileNameStart + fileNameLength

        if (fileNameEnd > buffer.length) break

        const name = buffer.toString('utf8', fileNameStart, fileNameEnd)
        if (name.toLowerCase().endsWith('.mp3') && !isMacOsMetadataEntry(name)) {
          const localFileNameLength = buffer.readUInt16LE(localHeaderOffset + 26)
          const localExtraLength = buffer.readUInt16LE(localHeaderOffset + 28)
          const dataStart = localHeaderOffset + 30 + localFileNameLength + localExtraLength
          const dataEnd = dataStart + compressedSize
          const compressedData = buffer.subarray(dataStart, dataEnd)
          const data = compressionMethod === 8
            ? inflateRawSync(compressedData)
            : Buffer.from(compressedData)

          if (!entries.some(entry => entry.name === name)) {
            entries.push({ name, data })
          }
        }

        offset = fileNameEnd + extraLength + commentLength
        continue
      }

      if (signature === ZIP_LOCAL_FILE_SIGNATURE) {
        if (offset + 30 > buffer.length) break

        const fileNameLength = buffer.readUInt16LE(offset + 26)
        const extraLength = buffer.readUInt16LE(offset + 28)
        const fileNameStart = offset + 30
        const fileNameEnd = fileNameStart + fileNameLength

        offset = fileNameEnd + extraLength
        continue
      }

      offset += 1
    }

    return entries
  } catch {
    return []
  }
}

const readZipMp3FileNames = async (zipPath: string): Promise<string[]> => {
  const entries = await readZipEntries(zipPath)
  return entries.map(entry => entry.name)
}

const findTrackEntry = (entries: ZipEntry[], nameParts: string[]) =>
  entries.find(entry => hasNamePart(entry.name, nameParts))

const readTrackZip = async (zipPath: string) => {
  const entries = await readZipEntries(zipPath)

  return {
    backing: findTrackEntry(entries, BACKING_NAME_PARTS)?.data,
    melody: findTrackEntry(entries, MELODY_NAME_PARTS)?.data
  }
}

export const adminSongsService = {
  async listSongs(): Promise<AdminSongListItem[]> {
    const musicDir = getMusicDir()
    const deletedSongIds = await readDeletedSongIds(musicDir)
    const entries = await fs.readdir(musicDir, { withFileTypes: true })
    const songs = await Promise.all(
      entries
        .filter(
          entry =>
            entry.isDirectory() &&
            !isDeletedSongDir(entry.name) &&
            !deletedSongIds.has(entry.name)
        )
        .map(entry => readAdminSong(musicDir, entry.name))
    )

    return songs
      .filter((song): song is AdminSongListItem => Boolean(song))
      .sort((left, right) => left.title.localeCompare(right.title, 'fi'))
  },

  async createSong(payload: AdminSongPayload): Promise<AdminSongListItem> {
    const name = validateName(payload.name)
    if (!name) {
      throw new Error('Song name must be 1-100 characters')
    }
    if (!payload.instrumentalTrack) {
      throw new Error('Instrumental track is required')
    }

    const musicDir = getMusicDir()
    await fs.mkdir(musicDir, { recursive: true })

    const songId = await uniqueSongId(musicDir, name)
    const songDir = getSongDir(musicDir, songId)
    await fs.mkdir(songDir, { recursive: true })
    await removeDeletedSongId(musicDir, songId)

    await writeTrackZip(path.join(songDir, 'audio.zip'), {
      backing: parseUpload(payload.instrumentalTrack),
      melody: payload.melodyTrack ? parseUpload(payload.melodyTrack) : undefined
    })
    await writeTrackZip(path.join(songDir, 'audio-slow.zip'), {
      backing: payload.slowInstrumentalTrack
        ? parseUpload(payload.slowInstrumentalTrack)
        : undefined,
      melody: payload.slowMelodyTrack ? parseUpload(payload.slowMelodyTrack) : undefined
    })
    if (payload.image) await saveImage(songDir, payload.image)

    const composer = readOptionalText(payload.composer)

    await writeMetadata(songDir, {
      title: name,
      ...(composer ? { composer } : {}),
      isImpro: payload.isImpro === true,
      isHidden: payload.isHidden === true
    })

    await reloadSongs()
    const song = await readAdminSong(musicDir, songId)
    if (!song) throw new Error('Failed to read created song')
    return song
  },

  async updateSong(songId: string, payload: AdminSongPayload): Promise<AdminSongListItem> {
    const musicDir = getMusicDir()
    const songDir = getSongDir(musicDir, songId)

    if (!(await exists(songDir))) {
      throw new AdminSongError('Song not found', 404)
    }

    const metadata = await readMetadata(songDir)
    const name = payload.name === undefined ? metadata.title : validateName(payload.name)
    if (!name) {
      throw new Error('Song name must be 1-100 characters')
    }
    const composer =
      payload.composer === undefined
        ? metadata.composer
        : readOptionalText(payload.composer)
    const isHidden =
      payload.isHidden === undefined
        ? metadata.isHidden === true
        : payload.isHidden === true

    const audioZipPath = path.join(songDir, 'audio.zip')
    const slowZipPath = path.join(songDir, 'audio-slow.zip')
    const currentRegularTracks = await readTrackZip(audioZipPath)
    const currentSlowTracks = await readTrackZip(slowZipPath)

    const nextRegularTracks = {
      backing: payload.instrumentalTrack
        ? parseUpload(payload.instrumentalTrack)
        : currentRegularTracks.backing,
      melody: payload.deleteMelodyTrack
        ? undefined
        : payload.melodyTrack
          ? parseUpload(payload.melodyTrack)
          : currentRegularTracks.melody
    }

    const nextSlowTracks = {
      backing: payload.deleteSlowInstrumentalTrack
        ? undefined
        : payload.slowInstrumentalTrack
          ? parseUpload(payload.slowInstrumentalTrack)
          : currentSlowTracks.backing,
      melody: payload.deleteSlowMelodyTrack
        ? undefined
        : payload.slowMelodyTrack
          ? parseUpload(payload.slowMelodyTrack)
          : currentSlowTracks.melody
    }

    await writeTrackZip(audioZipPath, nextRegularTracks)
    await writeTrackZip(slowZipPath, nextSlowTracks)

    if (payload.deleteImage) {
      await removeSongImages(songDir)
    }
    if (payload.image) {
      await saveImage(songDir, payload.image)
    }

    if (!nextRegularTracks.backing) {
      throw new Error('Instrumental track is required')
    }

    await writeMetadata(songDir, {
      ...metadata,
      title: name,
      composer,
      isImpro: payload.isImpro === undefined ? metadata.isImpro === true : payload.isImpro === true,
      isHidden
    })

    await reloadSongs()
    const song = await readAdminSong(musicDir, songId)
    if (!song) throw new Error('Failed to read updated song')
    return song
  },

  async deleteSong(songId: string): Promise<void> {
    const musicDir = getMusicDir()
    const songDir = getSongDir(musicDir, songId)

    if (!(await exists(songDir))) {
      const deletedSongIds = await readDeletedSongIds(musicDir)
      if (deletedSongIds.has(songId)) return

      throw new AdminSongError('Song not found', 404)
    }

    await addDeletedSongId(musicDir, songId)
    await reloadSongs()

    void removeSongDirBestEffort(musicDir, songDir, songId)
  }
}
