export interface SongMetadata {
  title: string
  composer?: string
}

export interface Song {
  id: string
  title: string
  audioBundle: string
  metadata: SongMetadata
}

export interface SongListItem extends Omit<Song, 'audioBundle'> {
  // This is what the client receives from GET /api/songs
}

export interface AppSessionUser {
  userType: 'teacher' | 'student'
}

export interface InviteTeacher {
  id: string
  name: string
}

export interface InviteDetails {
  teacher: InviteTeacher
  currentTeacher: InviteTeacher | null
}

export interface AcceptInviteResponse {
  teacher: InviteTeacher
  changed?: boolean
}
