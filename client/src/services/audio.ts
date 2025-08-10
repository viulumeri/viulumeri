import axios from 'axios'
import JSZip from 'jszip'

export const fetchSongBundle = async (songId: string): Promise<string> => {
  const response = await axios.get(`/api/songs/${songId}/bundle`, {
    responseType: 'blob'
  })

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