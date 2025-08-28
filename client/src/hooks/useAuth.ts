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

interface ChangePasswordData {
  newPassword: string
  currentPassword: string
  revokeOtherSessions?: boolean
}

interface RequestPasswordResetData {
  email: string
  redirectTo?: string
}

interface ResetPasswordData {
  newPassword: string
  token: string
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
      const response = await authClient.signIn.email(data)
      
      // Check if login actually succeeded by looking at the response
      if (response.error) {
        // Map common Better Auth error messages to Finnish
        let errorMessage = response.error.message || 'Kirjautuminen epäonnistui'
        
        if (errorMessage.includes('Invalid credentials') || errorMessage.includes('Invalid email or password')) {
          errorMessage = 'Virheellinen sähköposti tai salasana'
        } else if (errorMessage.includes('User not found')) {
          errorMessage = 'Käyttäjää ei löydy'
        } else if (errorMessage.includes('Email not verified')) {
          errorMessage = 'Sähköposti ei ole vahvistettu'
        }
        
        throw new Error(errorMessage)
      }
      
      return response
    },
    ...options
  })
}

export const useChangePassword = (
  options?: UseMutationOptions<any, Error, ChangePasswordData>
) => {
  return useMutation({
    mutationFn: async (data: ChangePasswordData) => {
      const response = await authClient.changePassword(data)
      
      if (response.error) {
        // Map common Better Auth error messages to Finnish
        let errorMessage = response.error.message || 'Salasanan vaihto epäonnistui'
        
        if (errorMessage.includes('Invalid password') || errorMessage.includes('Wrong password')) {
          errorMessage = 'Nykyinen salasana on virheellinen'
        } else if (errorMessage.includes('Password')) {
          errorMessage = 'Uusi salasana ei täytä vaatimuksia'
        }
        
        throw new Error(errorMessage)
      }
      
      return response
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

export const useRequestPasswordReset = (
  options?: UseMutationOptions<any, Error, RequestPasswordResetData>
) => {
  return useMutation({
    mutationFn: async (data: RequestPasswordResetData) => {
      const response = await authClient.requestPasswordReset(data)
      
      if (response.error) {
        let errorMessage = response.error.message || 'Salasanan palautus epäonnistui'
        
        if (errorMessage.includes('User not found')) {
          errorMessage = 'Sähköpostiosoitetta ei löydy'
        } else if (errorMessage.includes('Invalid email')) {
          errorMessage = 'Virheellinen sähköpostiosoite'
        }
        
        throw new Error(errorMessage)
      }
      
      return response
    },
    ...options
  })
}

export const useResetPassword = (
  options?: UseMutationOptions<any, Error, ResetPasswordData>
) => {
  return useMutation({
    mutationFn: async (data: ResetPasswordData) => {
      const response = await authClient.resetPassword(data)
      
      if (response.error) {
        let errorMessage = response.error.message || 'Salasanan vaihto epäonnistui'
        
        if (errorMessage.includes('Invalid token') || errorMessage.includes('Token expired')) {
          errorMessage = 'Linkki on vanhentunut tai virheellinen'
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
