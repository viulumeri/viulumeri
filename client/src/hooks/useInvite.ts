import { useMutation, useQuery } from '@tanstack/react-query'
import axios from 'axios'

export const useGenerateInviteLink = () =>
  useMutation({
    mutationFn: async () =>
      (await axios.post('/api/invites', null, { withCredentials: true })).data
  })

export const useInviteDetails = (token: string) =>
  useQuery({
    queryKey: ['invite', token],
    queryFn: async () =>
      (await axios.get(`/api/invites/${token}`, { withCredentials: true }))
        .data,
    enabled: !!token
  })

export const useAcceptInvite = () =>
  useMutation({
    mutationFn: async (token: string) =>
      (
        await axios.post(`/api/invites/${token}/accept`, null, {
          withCredentials: true
        })
      ).data
  })
