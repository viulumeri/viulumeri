import { useMutation, type UseMutationOptions } from '@tanstack/react-query'
import { authClient } from '../auth-client'

interface SignUpData {
  email: string
  password: string
  name: string
}

interface LoginData {
  email: string
  password: string
}

export const useSignUp = (
  options?: UseMutationOptions<any, Error, SignUpData>
) => {
  return useMutation({
    mutationFn: async (data: SignUpData) => {
      return await authClient.signUp.email(data)
    },
    ...options
  })
}

export const useLogin = (
  options?: UseMutationOptions<any, Error, LoginData>
) => {
  return useMutation({
    mutationFn: async (data: LoginData) => {
      return await authClient.signIn.email(data)
    },
    ...options
  })
}

