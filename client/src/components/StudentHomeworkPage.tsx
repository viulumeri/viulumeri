import { HomeworkList } from './HomeworkList'
import { useStudentHomework } from '../hooks/useHomework'

export const StudentHomeworkPage = () => {
  return (
    <div>
      <h2>Tehtävät</h2>
      <HomeworkList 
        useHomeworkQuery={useStudentHomework}
        showPracticeCount={false}
        actions="student"
      />
    </div>
  )
}
