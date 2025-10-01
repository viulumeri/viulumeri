import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import type { SongListItem } from '../../../shared/types'

type Props = {
  song: SongListItem
}

export default function SongCard({ song }: Props) {
  return (
    <Link
      to={`/player/${song.id}`}
      className="relative block w-full max-w-md mx-auto overflow-hidden rounded-md group"
    >
      <img
        src={song.metadata.imgurl}
        alt={song.title}
        className="w-full aspect-square object-cover"
      />
      <div className="absolute bottom-4 left-4 right-4 z-10 flex items-center justify-between">
        <h2 className="font-semibold">{song.title}</h2>
        <ChevronRight
          size={24}
          color="white"
          strokeWidth={2}
          className="drop-shadow-lg"
        />
      </div>
    </Link>
  )
}
