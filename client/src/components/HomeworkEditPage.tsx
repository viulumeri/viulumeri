import { useMemo, useState, useEffect, useRef } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { useSongsList } from '../hooks/useSongs'
import {
  useTeacherStudentHomework,
  useUpdateHomework
} from '../hooks/useHomework'
import type { SongListItem } from '../../../shared/types'
import HomeworkCard from './HomeworkCard'
import { FloatingActionButton } from '../components/FloatingActionButton'
import { useNotification } from '../hooks/useNotification'

type HomeworkEditState = {
  studentName?: string
  comment?: string
  preselected?: string[]
}

export const HomeworkEditPage = () => {
  const { studentId, homeworkId } = useParams<{
    studentId: string
    homeworkId: string
  }>()
  const navigate = useNavigate()
  const location = useLocation()
  const draftState = location.state as HomeworkEditState | undefined

  const hwQ = useTeacherStudentHomework(studentId!)
  const songsQ = useSongsList()

  const editing = useMemo(
    () => hwQ.data?.homework.find(h => h.id === homeworkId),
    [hwQ.data, homeworkId]
  )

  const [songIds, setSongIds] = useState<string[] | null>(
    draftState?.preselected ?? null
  )
  const currentSongIds = songIds ?? draftState?.preselected ?? editing?.songs ?? []
  const [comment, setComment] = useState<string>(draftState?.comment ?? '')

  const syncDraftState = (nextComment: string, nextSongIds: string[]) => {
    navigate('.', {
      replace: true,
      state: {
        ...(draftState ?? {}),
        comment: nextComment,
        preselected: nextSongIds
      }
    })
  }

  useEffect(() => {
    if (draftState?.comment !== undefined) {
      setComment(draftState.comment)
      return
    }
    setComment(editing?.comment ?? '')
  }, [draftState?.comment, editing?.comment])

  const songMap = useMemo(() => {
    const m = new Map<string, SongListItem>()
    ;(songsQ.data ?? []).forEach((s: SongListItem) => m.set(s.id, s))
    return m
  }, [songsQ.data])

  const { showError, showSuccess } = useNotification()

  const isSubmittingRef = useRef(false)

  const updateHomework = useUpdateHomework({
    onSuccess: () => {
      showSuccess('Läksy päivitetty onnistuneesti')
      navigate(`/teacher/students/${studentId}/homework`, {
        state: { studentName: draftState?.studentName },
        replace: true
      })
    },
    onError: err => {
      isSubmittingRef.current = false
      showError(err.message || 'Läksyn päivitys epäonnistui')
    }
  })

  const removeSong = (id: string) => {
      const base = currentSongIds
      const next = base.filter(sid => sid !== id)
      setSongIds(next)
      syncDraftState(comment, next)
  }
  
  const handleSave = () => {
    if (!homeworkId || isSubmittingRef.current) return
    isSubmittingRef.current = true
    updateHomework.mutate({
      homeworkId,
      body: { songs: currentSongIds, comment }
    })
  }

  const goToPicker = () => {
    navigate(
      `/teacher/students/${studentId}/homework/${homeworkId}/select-songs`,
      { state: { ...(draftState ?? {}), comment, preselected: currentSongIds } }
    )
  }

  if (hwQ.isPending || songsQ.isPending)
    return <div className="p-4">Ladataan…</div>

  if (hwQ.isError || songsQ.isError) {
    return (
      <div className="p-4">
        <div className="text-red-600">
          Virhe ladattaessa tietoja. Yritä myöhemmin uudelleen.
        </div>
        <button
          onClick={() => navigate(-1)}
          className="mt-4 px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
        >
          Takaisin
        </button>
      </div>
    )
  }

  if (!editing) return <div className="p-4">Läksyä ei löytynyt</div>

  const editedHw = { ...editing, songs: currentSongIds, comment }

  return (
    <div className="flex flex-col overflow-x-hidden">
      <div className="px-[5vw]">
        <HomeworkCard
          mode="teacher"
          hw={editedHw}
          songMap={songMap}
          editableSongs
          onRemoveSong={removeSong}
          headingLabel="Muokkaa tehtävää"
          editableComment
          commentDraft={comment}
          onChangeComment={next => {
            setComment(next)
            syncDraftState(next, currentSongIds)
          }}
          onAddSong={goToPicker}
        />
      </div>

      <FloatingActionButton
        onClick={handleSave}
        icon="check"
        disabled={updateHomework.isPending}
      />
    </div>
  )
}
