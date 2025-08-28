import { useParams, Link } from 'react-router-dom'
import { HomeworkList } from './HomeworkList'
import { useTeacherStudentHomework } from '../hooks/useHomework'

export const TeacherStudentHomeworkPage = () => {
  const { studentId } = useParams()

  return (
    <div>
      <h2>Oppilaan läksyt</h2>
      <HomeworkList 
        useHomeworkQuery={() => useTeacherStudentHomework(studentId!)}
        actions="teacher"
      />

      <div style={{ marginTop: 24 }}>
        <Link to={`/teacher/students/${studentId}/homework/create`}>
          <button>Lisää uusi läksy</button>
        </Link>
      </div>
    </div>
  )
}
