export interface SearchResultUser {
  id: string
  name: string
  email: string
  isAdmin: boolean
  isCurrentUser: boolean
  role: 'teacher' | 'student'
}