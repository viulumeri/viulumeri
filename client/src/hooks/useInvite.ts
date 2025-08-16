import {
  useMutation,
  useQuery,
  type UseMutationOptions
} from '@tanstack/react-query'
import { invitesService } from '../services/invites'

export const useGenerateInviteLink = (
  options?: UseMutationOptions<any, Error, void>
) => {
  return useMutation({
    mutationFn: invitesService.generate,
    ...options
  })
}

export const useInviteDetails = (token: string) => {
  return useQuery({
    queryKey: ['invite', token],
    queryFn: () => invitesService.details(token),
    enabled: !!token
  })
}

export const useAcceptInvite = (
  options?: UseMutationOptions<any, Error, string>
) => {
  return useMutation({
    mutationFn: invitesService.accept,
    ...options
  })
}
