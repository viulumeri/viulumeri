import axios from 'axios'

const baseUrl = '/api/invites'

export const invitesService = {
  generate: async () => {
    const response = await axios.post(baseUrl, null, { withCredentials: true })
    return response.data
  },
  details: async (token: string) => {
    const response = await axios.get(
      `${baseUrl}/${encodeURIComponent(token)}`,
      { withCredentials: true }
    )
    return response.data
  },
  accept: async (token: string) => {
    const response = await axios.post(
      `${baseUrl}/${encodeURIComponent(token)}/accept`,
      null,
      { withCredentials: true }
    )
    return response.data
  }
}
