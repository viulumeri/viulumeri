import { useEffect } from 'react'
import { useSongsList } from '../hooks/useSongs'
import { Songslist } from './Songslist'
import { useOwnPlayedSongs } from '../hooks/usePlayedSongs'
import { useSession } from '../auth-client'
import type { AppSessionUser } from '../../../shared/types'
import { useNotification } from '../hooks/useNotification'
import { Music } from 'lucide-react'

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
      <div className="space-y-4 p-5 pb-5">
      <h1 className="flex items-center gap-3">
        <Music className="w-8 h-8" />
        Kappaleet
      </h1>
      </div>
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
