import axios from 'axios'
import JSZip from 'jszip'

const AUDIO_CACHE_NAME = 'viulumeri-audio'

export interface AudioTracks {
  melody?: string
  backing?: string
}

export const fetchSongBundle = async (songId: string): Promise<string> => {
  const cacheKey = `song-bundle-${songId}`
  const cache = await caches.open(AUDIO_CACHE_NAME)

  const cachedResponse = await cache.match(cacheKey)
  if (cachedResponse) {
    const cachedBlob = await cachedResponse.blob()
    const zip = new JSZip()
    const zipContent = await zip.loadAsync(cachedBlob)

    const audioFile =
      zipContent.file('backing.mp3') || zipContent.file('melody.mp3')

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

  const audioFile =
    zipContent.file('backing.mp3') || zipContent.file('melody.mp3')

  if (!audioFile) {
    throw new Error('MP3-tiedostoja ei löytynyt paketista')
  }

  const audioBlob = await audioFile.async('blob')
  return URL.createObjectURL(audioBlob)
}

const fetchSongTracksInternal = async (
  songId: string,
  bundleType: 'normal' | 'slow'
): Promise<AudioTracks> => {
  const suffix = bundleType === 'slow' ? '-slow' : ''
  const cacheKey = `song-bundle${suffix}-${songId}`
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
      responseType: 'blob'
    })

    const cacheResponse = new Response(response.data)
    await cache.put(cacheKey, cacheResponse.clone())

    const zip = new JSZip()
    zipContent = await zip.loadAsync(response.data)
  }

  const tracks: AudioTracks = {}

  const melodyFile = zipContent.file('melody.mp3')
  if (melodyFile) {
    const melodyBlob = await melodyFile.async('blob')
    tracks.melody = URL.createObjectURL(melodyBlob)
  }

  const backingFile = zipContent.file('backing.mp3')
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

export const fetchSongTracks = async (songId: string): Promise<AudioTracks> => {
  return fetchSongTracksInternal(songId, 'normal')
}

export const fetchSlowSongTracks = async (
  songId: string
): Promise<AudioTracks> => {
  return fetchSongTracksInternal(songId, 'slow')
}
