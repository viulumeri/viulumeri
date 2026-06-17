import axios from 'axios'
import JSZip from 'jszip'

const AUDIO_CACHE_NAME = 'viulumeri-audio'

const getCacheSuffix = (songId: string, cacheVersion?: string) =>
  cacheVersion ? `${songId}-${encodeURIComponent(cacheVersion)}` : songId

export interface AudioTracks {
  melody?: string
  backing?: string
}

export const clearCachedSongAudio = async (songId: string): Promise<void> => {
  if (!('caches' in window)) return

  const cache = await caches.open(AUDIO_CACHE_NAME)
  const requests = await cache.keys()

  await Promise.all(
    requests
      .filter(request =>
        request.url.includes(`song-bundle-${songId}`) ||
        request.url.includes(`song-bundle-slow-${songId}`)
      )
      .map(request => cache.delete(request))
  )
}

const isMacOsMetadataEntry = (name: string) => {
  const parts = name.split('/')
  const baseName = parts[parts.length - 1] ?? name

  return parts.includes('__MACOSX') || baseName.startsWith('._')
}

const getAudioFiles = (zipContent: JSZip) =>
  Object.values(zipContent.files).filter(file => {
    if (file.dir) return false
    if (isMacOsMetadataEntry(file.name)) return false
    return file.name.toLowerCase().endsWith('.mp3')
  })

const findAudioFile = (zipContent: JSZip, candidates: string[]) => {
  const candidateSet = new Set(candidates.map(candidate => candidate.toLowerCase()))

  return getAudioFiles(zipContent).find(file => {
    const baseName = file.name.split('/').pop()?.toLowerCase()
    return baseName ? candidateSet.has(baseName) : false
  }) ?? null
}

const findAudioFileByNamePart = (zipContent: JSZip, nameParts: string[]) =>
  getAudioFiles(zipContent).find(file => {
    const normalizedName = file.name.toLowerCase()
    return nameParts.some(part => normalizedName.includes(part))
  }) ?? null

const findMelodyFile = (zipContent: JSZip) =>
  findAudioFile(zipContent, ['melody.mp3']) ??
  findAudioFileByNamePart(zipContent, ['melody', 'melodia'])

const findBackingFile = (zipContent: JSZip) =>
  findAudioFile(zipContent, ['backing.mp3', 'instrumental.mp3']) ??
  findAudioFileByNamePart(zipContent, [
    'backing',
    'instrumental',
    'tausta',
    'saestys',
    'säestys'
  ])

export const fetchSongBundle = async (
  songId: string,
  cacheVersion?: string
): Promise<string> => {
  const cacheKey = `song-bundle-${getCacheSuffix(songId, cacheVersion)}`
  const cache = await caches.open(AUDIO_CACHE_NAME)

  const cachedResponse = await cache.match(cacheKey)
  if (cachedResponse) {
    const cachedBlob = await cachedResponse.blob()
    const zip = new JSZip()
    const zipContent = await zip.loadAsync(cachedBlob)

    const audioFile = findAudioFile(zipContent, ['backing.mp3', 'melody.mp3'])

    if (!audioFile) {
      throw new Error('MP3-tiedostoja ei löytynyt välimuistista')
    }

    const audioBlob = await audioFile.async('blob')
    return URL.createObjectURL(audioBlob)
  }

  const response = await axios.get(`/api/songs/${songId}/bundle`, {
    responseType: 'blob'
  })

  const cacheResponse = new Response(response.data)
  await cache.put(cacheKey, cacheResponse.clone())

  const zip = new JSZip()
  const zipContent = await zip.loadAsync(response.data)

  const audioFile = findAudioFile(zipContent, ['backing.mp3', 'melody.mp3'])

  if (!audioFile) {
    throw new Error('MP3-tiedostoja ei löytynyt paketista')
  }

  const audioBlob = await audioFile.async('blob')
  return URL.createObjectURL(audioBlob)
}

const fetchSongTracksInternal = async (
  songId: string,
  bundleType: 'normal' | 'slow',
  cacheVersion?: string
): Promise<AudioTracks | null> => {
  const suffix = bundleType === 'slow' ? '-slow' : ''
  const cacheKey = `song-bundle${suffix}-${getCacheSuffix(songId, cacheVersion)}`
  const apiEndpoint =
    bundleType === 'slow'
      ? `/api/songs/${songId}/bundle-slow`
      : `/api/songs/${songId}/bundle`
  const cache = await caches.open(AUDIO_CACHE_NAME)

  let zipContent: JSZip

  const cachedResponse = await cache.match(cacheKey)
  if (cachedResponse) {
    const cachedBlob = await cachedResponse.blob()
    const zip = new JSZip()
    zipContent = await zip.loadAsync(cachedBlob)
  } else {
    const response = await axios.get(apiEndpoint, {
      responseType: 'blob',
      validateStatus: (status) => (status >= 200 && status < 300) || status === 404 // <-- Don't crash on 404
    })

    if (response.status === 404) {
      return null
    }

    const cacheResponse = new Response(response.data)
    await cache.put(cacheKey, cacheResponse.clone())

    const zip = new JSZip()
    zipContent = await zip.loadAsync(response.data)
  }

  const tracks: AudioTracks = {}

  const melodyFile = findMelodyFile(zipContent)
  if (melodyFile) {
    const melodyBlob = await melodyFile.async('blob')
    tracks.melody = URL.createObjectURL(melodyBlob)
  }

  const backingFile =
    findBackingFile(zipContent) ??
    getAudioFiles(zipContent).find(file => file.name !== melodyFile?.name) ??
    null
  if (backingFile) {
    const backingBlob = await backingFile.async('blob')
    tracks.backing = URL.createObjectURL(backingBlob)
  }

  if (!tracks.melody && !tracks.backing) {
    const bundleName =
      bundleType === 'slow' ? 'hitaasta paketista' : 'paketista'
    throw new Error(
      `Melody.mp3 tai backing.mp3 tiedostoja ei löytynyt ${bundleName}`
    )
  }

  return tracks
}

export const fetchSongTracks = async (
  songId: string,
  cacheVersion?: string
): Promise<AudioTracks | null> => {
  return fetchSongTracksInternal(songId, 'normal', cacheVersion)
}

export const fetchSlowSongTracks = async (
  songId: string,
  cacheVersion?: string
): Promise<AudioTracks | null> => {
  return fetchSongTracksInternal(songId, 'slow', cacheVersion)
}

export const checkSlowTrackAvailability = async (
  songId: string,
  cacheVersion?: string
): Promise<boolean> => {
  try {
    const tracks = await fetchSlowSongTracks(songId, cacheVersion)
    return tracks !== null && Boolean(tracks.backing)
  } catch {
    return false
  }
}
