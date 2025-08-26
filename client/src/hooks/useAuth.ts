import { useMutation, type UseMutationOptions } from '@tanstack/react-query'
import { authClient } from '../auth-client'

interface SignUpData {
  email: string
  password: string
  name: string
  userType: 'teacher' | 'student'
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
      const response = await authClient.signUp.email(data)

      // Check if signup actually succeeded by looking at the response
      if (response.error) {
        // Map common Better Auth error messages to Finnish
        let errorMessage =
          response.error.message || 'Rekisteröityminen epäonnistui'

        if (errorMessage.includes('User already exists')) {
          errorMessage = 'Käyttäjätunnus on jo olemassa'
        } else if (errorMessage.includes('Invalid email')) {
          errorMessage = 'Virheellinen sähköpostiosoite'
        } else if (errorMessage.includes('Password')) {
          errorMessage = 'Salasana ei täytä vaatimuksia'
        }

        throw new Error(errorMessage)
      }

      return response
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

export const useDeleteUser = (
  options?: UseMutationOptions<any, Error, { callbackURL?: string }>
) => {
  return useMutation({
    mutationFn: async (data: { callbackURL?: string } = {}) => {
      return await authClient.deleteUser(data)
    },
    ...options
  })
}
