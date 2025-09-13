# API Endpoints

## Authentication (Better Auth handles these)

- POST /api/auth/sign-up/email - Sign up with email
- POST /api/auth/sign-in/email - Sign in with email
- POST /api/auth/sign-out - Sign out
- GET /api/auth/session - Get current session
  ... (other Better Auth endpoints)

## Songs (Available to all authenticated users)

- GET /api/songs - Get all songs list
- GET /api/songs/:id - Get specific song details
- GET /api/songs/:id/bundle - Download song's audio bundle (.zip with mp3s)

## Homework (RESTful design with role-based access)

- POST /api/homework - Create homework assignment (teacher only)
- GET /api/homework - Get own homework assignments (student only)
- PUT /api/homework/:homeworkId - Update homework assignment (teacher only)
- DELETE /api/homework/:homeworkId - Delete homework assignment (teacher only)
- POST /api/homework/practice/:homeworkId - Record practice session (student only)

## Students (Teacher access to student data)

- GET /api/students - Get teacher's students list (teacher only)
- DELETE /api/students/:studentId - Remove student from teacher's student list (teacher only)
- GET /api/students/:studentId/homework - Get specific student's homework (teacher only)
- GET /api/students/:studentId/played-songs - Get student's played songs list (teacher only)
- POST /api/students/:studentId/played-songs - Mark song as played for student (teacher only)
- DELETE /api/students/:studentId/played-songs/:songId - Unmark song as played (teacher only)

## Played Songs (Song progress tracking)

- GET /api/played-songs - Get own played songs list (student only)

## Invites (Teacher-student relationship management)

- GET /api/invites - Get teacher's invite codes (teacher only)
- POST /api/invites - Create new invite code (teacher only)
- POST /api/invites/:token/accept - Student accepts invitation (student only)

## Teacher (Teacher-student relationship management)

- DELETE /api/teacher - Student removes their teacher relationship (student only)
