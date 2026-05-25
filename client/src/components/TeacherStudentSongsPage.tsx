import { useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { useSongsList } from '../hooks/useSongs'
import {
  useStudentPlayedSongs,
  useMarkSongPlayed,
  useUnmarkSongPlayed
} from '../hooks/usePlayedSongs'
import { Songslist } from '../components/Songslist'
import { useNotification } from '../hooks/useNotification'

export const TeacherStudentSongsPage = () => {
  const { studentId } = useParams<{ studentId: string }>()
  const qc = useQueryClient()
  const { showError } = useNotification()

  const songs = useSongsList()
  const played = useStudentPlayedSongs(studentId!)

  useEffect(() => {
    if (songs.isError) {
      showError(`Virhe: ${songs.error.message}`)
    }
  }, [songs.isError, songs.error, showError])

  useEffect(() => {
    if (played.isError) {
      showError(`Virhe: ${played.error.message}`)
    }
  }, [played.isError, played.error, showError])

  const mark = useMarkSongPlayed({
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ['student-played-songs', studentId] })
  })
  const unmark = useUnmarkSongPlayed({
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ['student-played-songs', studentId] })
  })

  if (songs.isPending || played.isPending)
    return <div className="p-4">Ladataan…</div>

  const playedSet = new Set(played.data?.playedSongs ?? [])
  const onTogglePlayed = (songId: string) => {
    if (!studentId) return
    if (playedSet.has(songId)) {
      unmark.mutate({ studentId, songId })
    } else {
      mark.mutate({ studentId, songId })
    }
  }

  return (
    <Songslist
      songs={songs.data ?? []}
      playedSet={playedSet}
      onTogglePlayed={onTogglePlayed}
      showChevron
    />
  )
}
