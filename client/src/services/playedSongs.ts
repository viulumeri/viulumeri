import axios from 'axios'

export const playedSongsService = {
  // Teacher functions
  markSongPlayed: async (studentId: string, songId: string): Promise<{
    id: string
    name: string
    playedSongs: string[]
  }> => {
    const response = await axios.post(
      `/api/students/${studentId}/played-songs`,
      { songId },
      {
        withCredentials: true
      }
    )
    return response.data
  },
  
  unmarkSongPlayed: async (studentId: string, songId: string): Promise<{
    id: string
    name: string
    playedSongs: string[]
  }> => {
    const response = await axios.delete(
      `/api/students/${studentId}/played-songs/${songId}`,
      {
        withCredentials: true
      }
    )
    return response.data
  },

  // Student function
  getOwnPlayedSongs: async (): Promise<{
    playedSongs: string[]
  }> => {
    const response = await axios.get('/api/played-songs', {
      withCredentials: true
    })
    return response.data
  }
}