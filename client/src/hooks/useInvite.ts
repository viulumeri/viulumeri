import { useMutation } from '@tanstack/react-query'
import axios from 'axios'

export const useGenerateInviteLink = () =>
  useMutation({
    mutationFn: async () =>
      (await axios.post('/api/invites', null, { withCredentials: true })).data
  })
