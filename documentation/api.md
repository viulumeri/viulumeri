# API Endpoints

## Authentication (Better Auth handles these)

- POST /api/auth/signin
- POST /api/auth/signup
- POST /api/auth/signout
  ...

## Songs

- GET /api/songs - Get all songs (with optional filters)
- GET /api/songs/:id - Get specific song details

## Student Endpoints

- GET /api/student/songs - Get all songs with student's progress
- GET /api/student/homework - Get current homework assignments
- POST /api/student/practice/:homeworkId - Increment practice counter
- PUT /api/student/progress/:songId - Update song status (self-learning)

## Teacher Endpoints

- GET /api/teacher/students - Get teacher's students
- POST /api/teacher/homework - Assign homework to student
- PUT /api/teacher/homework/:id - Update homework assignment
- PUT /api/teacher/progress/:studentId/:songId - Mark song as completed
