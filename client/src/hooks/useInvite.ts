import {
  useMutation,
  useQuery,
  type UseMutationOptions
} from '@tanstack/react-query'
import { invitesService } from '../services/invites'
import type {
  InviteDetails,
  AcceptInviteResponse,
  GenerateInviteResponse
} from '../../../shared/types'

export const useGenerateInviteLink = (
  options?: UseMutationOptions<GenerateInviteResponse, Error, void>
) => useMutation({ mutationFn: invitesService.generate, ...options })

export const useInviteDetails = (token: string) => {
  return useQuery({
    queryKey: ['invite', token],
    queryFn: (): Promise<InviteDetails> => invitesService.details(token),
    enabled: !!token
  })
}

export const useAcceptInvite = (
  options?: UseMutationOptions<AcceptInviteResponse, Error, string>
) => useMutation({ mutationFn: invitesService.accept, ...options })
