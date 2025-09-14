import axios from 'axios'
import JSZip from 'jszip'

const AUDIO_CACHE_NAME = 'viulumeri-audio'

export const fetchSongBundle = async (songId: string): Promise<string> => {
  const cacheKey = `song-bundle-${songId}`
  const cache = await caches.open(AUDIO_CACHE_NAME)
  
  const cachedResponse = await cache.match(cacheKey)
  if (cachedResponse) {
    const cachedBlob = await cachedResponse.blob()
    const zip = new JSZip()
    const zipContent = await zip.loadAsync(cachedBlob)

    const audioFile = zipContent.file('backing.mp3') || 
                     zipContent.file('melody.mp3') || 
                     zipContent.file('click.mp3')

    if (!audioFile) {
      throw new Error('No MP3 files found in cached bundle')
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

  const audioFile = zipContent.file('backing.mp3') || 
                   zipContent.file('melody.mp3') || 
                   zipContent.file('click.mp3')

  if (!audioFile) {
    throw new Error('No MP3 files found in bundle')
  }

  const audioBlob = await audioFile.async('blob')
  return URL.createObjectURL(audioBlob)
}

