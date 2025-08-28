export interface SongMetadata {
  title: string
  composer?: string
  imgurl?: string
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

export interface GenerateInviteResponse {
  inviteUrl: string
  expiresIn: string
}

export interface Homework {
  id: string
  student: { id: string; name: string }
  songs: string[]
  comment: string
  practiceCount: number
  createdAt: string
  updatedAt: string
  // returned by GET /api/student/homework and GET /api/teacher/students/:id/homework
}

export interface CreateHomeworkBody {
  studentId: string
  songs?: string[]
  comment?: string
  // client sends in POST /api/teacher/homework
}

export interface CreateHomeworkResponse extends Homework {
  // response to POST /api/teacher/homework)
}

export interface HomeworkListResponse {
  homework: Homework[]
  // response to GET /api/student/homework and and GET /api/teacher/students/:id/homework
}

export interface UpdateHomeworkBody {
  songs?: string[]
  comment?: string
  // client sends in PUT /api/homework/:id
}

export interface UpdateHomeworkResponse extends Homework {
  // response to PUT /api/homework/:id
}

export interface PracticeResponse {
  id: string
  practiceCount: number
}
