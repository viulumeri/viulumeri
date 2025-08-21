import { HomeworkList } from './HomeworkList'

export const StudentHomeworkPage = () => {
  return (
    <div>
      <h2>Tehtävät</h2>
      <HomeworkList showPracticeCount={false} />
    </div>
  )
}
