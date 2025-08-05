```typescript
// Better Auth handles this
// Better Auth User (in 'user' collection via MongoDB client)
interface BetterAuthUser {
  id: string
  email: string
  name?: string
  image?: string
  createdAt: Date
  updatedAt: Date
}

interface Teacher {
  _id: ObjectId
  userId: string // References Better Auth user.id
  name: string
  email: string // Duplicated for easy queries, sync with BA
  students: ObjectId[] // References to Student._id
}

interface Student {
  _id: ObjectId
  userId: string // References Better Auth user.id
  name: string
  email: string // Duplicated for easy queries, sync with BA
  teacherId: ObjectId // References Teacher._id
  homeworks: Homework[]
  songProgress: SongProgress[]
}

interface Homework {
  _id: ObjectId
  songs: ObjectId[] // References to Song._id
  assignedDate: Date
  Comments?: string
  practiceCount: number
}

interface SongProgress {
  songId: ObjectId // References Song._id
  isCompleted: boolean
  isCurrentHomework: boolean
  markedCompletedBy?: string // Better Auth user.id
  completedDate?: Date
}

interface Song {
  _id: ObjectId
  title: string
  audioFiles: {
    backing: string // URL/path to backing track
    clickTrack: string // URL/path to click track
    melody: string // URL/path to melody track
  }
}
```
