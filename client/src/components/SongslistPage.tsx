import { useSongsList } from '../hooks/useSongs'
import { Songslist } from './Songslist'
import { Header } from './Header'

export function SongslistPage() {
  const { data, isPending, isError, error } = useSongsList()

  if (isPending) return <div className="p-4">Ladataan…</div>
  if (isError)
    return <div className="p-4 text-red-300">Virhe: {error.message}</div>

  return (
    <div className="flex flex-col min-h-screen">
      <Header center={<h1>Kappaleet</h1>} />
      <main className="flex-1 overflow-y-auto pb-24">
        <div className="mx-auto max-w-sm">
          <Songslist songs={data ?? []} showChevron />
        </div>
      </main>
    </div>
  )
}
