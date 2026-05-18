import { useEffect } from 'react'
import { useSongsList } from '../hooks/useSongs'
import { Songslist } from './Songslist'
import { Header } from './Header'
import { useOwnPlayedSongs } from '../hooks/usePlayedSongs'
import { useSession } from '../auth-client'
import type { AppSessionUser } from '../../../shared/types'
import { useNotification } from '../hooks/useNotification'

export const SongslistPage = () => {
  const { data: session } = useSession()
  const userType = (session?.user as AppSessionUser | undefined)?.userType
  const isStudent = userType === 'student'
  const { showError } = useNotification()

  const songs = useSongsList()
  const played = useOwnPlayedSongs({ enabled: isStudent })

  useEffect(() => {
    if (songs.isError) {
      showError(`Virhe: ${songs.error.message}`)
    }
  }, [songs.isError, songs.error, showError])

  useEffect(() => {
    if (isStudent && played.isError) {
      showError(`Virhe: ${played.error.message}`)
    }
  }, [isStudent, played.isError, played.error, showError])

  if (songs.isPending || (isStudent && played.isPending)) {
    return <div className="p-4">Ladataan…</div>
  }

  const playedSet = isStudent
    ? new Set(played.data?.playedSongs ?? [])
    : undefined

  return (
    <div className="flex flex-col min-h-screen">
      <Header center={<h1>Kappaleet</h1>} />
      <main className="flex-1 overflow-y-auto pb-24">
        <div className="mx-auto max-w-sm">
          <Songslist
            songs={songs.data ?? []}
            playedSet={playedSet}
            showChevron
          />
        </div>
      </main>
    </div>
  )
}
