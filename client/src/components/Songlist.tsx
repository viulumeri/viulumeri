import { useSongs } from '../hooks/useSongs'

export const Songlist = () => {
  const { isPending, isError, data, error } = useSongs()
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
        {data.map(song => (
          <li key={song.id}>{song.title}</li>
        ))}
      </ul>
    </div>
  )
}
