import axios from 'axios'

const baseUrl = '/api/songs'

export const songsService = {
  getAll: async () => {
    const response = await axios.get(baseUrl)
    return response.data
  },
  getById: async (id: string) => {
    const response = await axios.get(`${baseUrl}/${id}`)
    return response.data
  }
}
