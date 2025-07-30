import { useMutation, type UseMutationOptions } from '@tanstack/react-query'
import { authClient } from '../auth-client'

interface SignUpData {
  email: string
  password: string
  name: string
}

export const useSignUp = (options?: UseMutationOptions<any, Error, SignUpData>) => {
  return useMutation({
    mutationFn: async (data: SignUpData) => {
      return await authClient.signUp.email(data)
    },
    ...options
  })
}