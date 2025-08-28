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
      <h1 className=" px-4 pb-4"> Kappaleet</h1>
      <ul className="flex flex-col pb-20 px-10">
        {data.map((song: SongListItem) => (
          <li key={song.id}>
            <Link
              to={`/player/${song.id}`}
              className="flex items-center gap-5 p-3 rounded-lg overflow-hidden"
            >
              <img
                src={song.metadata.imgurl}
                alt={song.title}
                className="w-14 h-14 rounded-full objec"
              />
              <h3 className="">{song.title}</h3>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
