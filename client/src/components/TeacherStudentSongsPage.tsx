import { useParams } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { useSongsList } from '../hooks/useSongs'
import {
  useStudentPlayedSongs,
  useMarkSongPlayed,
  useUnmarkSongPlayed
} from '../hooks/usePlayedSongs'
import { Songslist } from '../components/Songslist'

export function TeacherStudentSongsPage() {
  const { studentId } = useParams<{ studentId: string }>()
  const qc = useQueryClient()

  const songs = useSongsList()
  const played = useStudentPlayedSongs(studentId!)

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
  if (songs.isError)
    return <div className="p-4 text-red-300">Virhe: {songs.error.message}</div>
  if (played.isError)
    return <div className="p-4 text-red-300">Virhe: {played.error.message}</div>

  const playedSet = new Set(played.data?.playedSongs ?? [])
  const onTogglePlayed = (songId: string) => {
    if (!studentId) return
    playedSet.has(songId)
      ? unmark.mutate({ studentId, songId })
      : mark.mutate({ studentId, songId })
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
