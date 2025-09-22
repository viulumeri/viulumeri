import { useParams } from 'react-router-dom'
import { useTeacherStudentHomework } from '../hooks/useHomework'
import { HomeworkCarousel } from './HomeworkCarousel'

export const TeacherStudentHomeworkPage = () => {
  const { studentId } = useParams()
  const { data, isPending, refetch } = useTeacherStudentHomework(studentId!)

  return (
    <HomeworkCarousel
      mode="teacher"
      studentId={studentId}
      homework={data?.homework ?? []}
      isPending={isPending}
      refetch={refetch}
    />
  )
}
