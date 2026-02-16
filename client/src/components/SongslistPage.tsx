import { useSongsList } from '../hooks/useSongs'
import { Songslist } from './Songslist'
import { Header } from './Header'
import { useOwnPlayedSongs } from '../hooks/usePlayedSongs'
import { useSession } from '../auth-client'
import type { AppSessionUser } from '../../../shared/types'

export const SongslistPage = () => {
  const { data: session } = useSession()
  const userType = (session?.user as AppSessionUser | undefined)?.userType
  const isStudent = userType === 'student'

  const songs = useSongsList()
  const played = useOwnPlayedSongs({ enabled: isStudent })

  if (songs.isPending || (isStudent && played.isPending)) {
    return <div className="p-4">Ladataan…</div>
  }
  if (songs.isError) {
    return <div className="p-4 text-red-300">Virhe: {songs.error.message}</div>
  }
  if (isStudent && played.isError) {
    return <div className="p-4 text-red-300">Virhe: {played.error.message}</div>
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
