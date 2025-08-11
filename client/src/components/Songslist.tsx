import { Link } from 'react-router-dom'
import { useSongsList } from '../hooks/useSongs'
import type { SongListItem } from '../../../shared/types'

export const Songslist = () => {
  const { isPending, isError, data, error } = useSongsList()
  if (isPending) {
    return <span>Loading...</span>
  }

  if (isError) {
    return <span>Error: {error.message}</span>
  }

  return (
    <div>
      <h1>Biisilista</h1>
      <ul>
        {data.map((song: SongListItem) => (
          <li key={song.id}>
            <Link to={`/player/${song.id}`}>{song.title}</Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
