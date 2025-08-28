import { useParams, useNavigate } from 'react-router-dom'
import { useCreateHomework } from '../hooks/useHomework'
import { SongPicker } from './SongPicker'
import { useState } from 'react'

export const CreateHomeworkPage = () => {
  const { studentId } = useParams()
  const navigate = useNavigate()
  const create = useCreateHomework()

  const [selectedSongIds, setSelectedSongIds] = useState<string[]>([])
  const [comment, setComment] = useState('')

  return (
    <div>
      <h2>Lisää uusi läksy</h2>
      
      <div style={{ marginBottom: 12 }}>
        <label style={{ display: 'block', marginBottom: 6 }}>Kappaleet</label>
        <SongPicker value={selectedSongIds} onChange={setSelectedSongIds} />
      </div>
      
      <div style={{ marginBottom: 12 }}>
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
                navigate(`/teacher/students/${studentId}/homework`)
              },
              onError: e => alert(e instanceof Error ? e.message : 'Virhe')
            }
          )
        }}
      >
        {create.isPending ? 'Tallennetaan…' : 'Luo läksy'}
      </button>
      
      <button 
        onClick={() => navigate(`/teacher/students/${studentId}/homework`)}
        style={{ marginLeft: 8 }}
      >
        Peruuta
      </button>
    </div>
  )
}