import { useState } from 'react'
import { HomeworkList } from './HomeworkList'
import { useStudentHomework, usePracticeOnce } from '../hooks/useHomework'

export const StudentHomeworkPage = () => {
  const { data, isLoading, isError, refetch } = useStudentHomework()
  const [pendingId, setPendingId] = useState<string | null>(null)

  const practice = usePracticeOnce({
    onSuccess: () => {
      setPendingId(null)
      refetch()
    },
    onError: () => {
      setPendingId(null)
      alert('Harjoituskerran tallennus epäonnistui')
    }
  })

  if (isLoading) return <div>Ladataan…</div>
  if (isError) return <div>Virhe ladattaessa läksyjä</div>

  return (
    <div>
      <h2>Tehtävät</h2>
      <HomeworkList
        items={data?.homework ?? []}
        onPractice={id => {
          if (pendingId) return
          setPendingId(id)
          practice.mutate(id)
        }}
        isPracticingId={pendingId}
        showPracticeCount={false}
      />
    </div>
  )
}
