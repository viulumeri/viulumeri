import axios from 'axios'
import type {
  GenerateInviteResponse,
  InviteDetails,
  AcceptInviteResponse
} from '../../../shared/types'

const baseUrl = '/api/invites'

export const invitesService = {
  generate: async (): Promise<GenerateInviteResponse> => {
    const response = await axios.post(baseUrl, null, { withCredentials: true })
    return response.data
  },
  details: async (token: string): Promise<InviteDetails> => {
    const response = await axios.get(
      `${baseUrl}/${encodeURIComponent(token)}`,
      { withCredentials: true }
    )
    return response.data
  },
  accept: async (token: string): Promise<AcceptInviteResponse> => {
    const response = await axios.post(
      `${baseUrl}/${encodeURIComponent(token)}/accept`,
      null,
      { withCredentials: true }
    )
    return response.data
  }
}
