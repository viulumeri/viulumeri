import { useParams } from 'react-router-dom'
import { HomeworkList } from './HomeworkList'
import {
  useTeacherStudentHomework,
  useCreateHomework
} from '../hooks/useHomework'
import { SongPicker } from './SongPicker'
import { useState } from 'react'

export const TeacherStudentHomeworkPage = () => {
  const { studentId } = useParams()
  const { data, isLoading, isError, refetch } = useTeacherStudentHomework(
    studentId!
  )
  const create = useCreateHomework()

  const [selectedSongIds, setSelectedSongIds] = useState<string[]>([])
  const [comment, setComment] = useState('')

  if (isLoading) return <div>Ladataan…</div>
  if (isError) return <div>Virhe ladattaessa läksyjä</div>

  return (
    <div>
      <h2>Oppilaan läksyt</h2>
      <HomeworkList items={data?.homework ?? []} />

      <div style={{ marginTop: 24 }}>
        <h3>Lisää uusi läksy</h3>
        <div style={{ marginBottom: 12 }}>
          <label style={{ display: 'block', marginBottom: 6 }}>Kappaleet</label>
          <SongPicker value={selectedSongIds} onChange={setSelectedSongIds} />
        </div>
        <div>
          <label>Kommentti</label>
          <br />
          <textarea
            value={comment}
            onChange={e => setComment(e.target.value)}
          />
        </div>
        <button
          disabled={create.isPending}
          onClick={() => {
            create.mutate(
              {
                studentId: studentId!,
                songs: selectedSongIds,
                comment: comment.trim()
              },
              {
                onSuccess: () => {
                  setSelectedSongIds([])
                  setComment('')
                  refetch()
                },
                onError: e => alert(e instanceof Error ? e.message : 'Virhe')
              }
            )
          }}
        >
          {create.isPending ? 'Tallennetaan…' : 'Valmis'}
        </button>
      </div>
    </div>
  )
}
