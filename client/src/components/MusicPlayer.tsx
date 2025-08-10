import { useState, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import * as Tone from 'tone'
import { useSongById } from '../hooks/useSongs'
import { fetchSongBundle } from '../services/audio'

export const MusicPlayer = () => {
  const { songId } = useParams<{ songId: string }>()
  const { data: song, isPending, isError, error } = useSongById(songId)
  const [isLoading, setIsLoading] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [audioError, setAudioError] = useState<string | null>(null)
  const playerRef = useRef<Tone.Player | null>(null)

  const fetchAndPlaySong = async () => {
    if (!songId) return

    try {
      setIsLoading(true)
      setAudioError(null)

      const audioUrl = await fetchSongBundle(songId)

      await Tone.start()

      if (playerRef.current) {
        playerRef.current.dispose()
      }

      playerRef.current = new Tone.Player({
        url: audioUrl,
        onload: () => {
          setIsLoading(false)
          playerRef.current?.start()
          setIsPlaying(true)
        },
        onstop: () => {
          setIsPlaying(false)
          URL.revokeObjectURL(audioUrl)
        }
      }).toDestination()
    } catch (err) {
      setAudioError(err instanceof Error ? err.message : 'Failed to load audio')
      setIsLoading(false)
    }
  }

  const stopPlayback = () => {
    if (playerRef.current) {
      playerRef.current.stop()
      setIsPlaying(false)
    }
  }

  if (!songId) {
    return <div>No song selected</div>
  }

  if (isPending) {
    return <div>Loading song...</div>
  }

  if (isError) {
    return <div>Error: {error?.message}</div>
  }

  return (
    <div>
      <Link to="/songslist">← takaisin</Link>

      {song && (
        <div>
          <h1>{song.title}</h1>
          {song.metadata.composer && <p>säveltäjä {song.metadata.composer}</p>}
        </div>
      )}

      <div>
        {!isPlaying && (
          <button onClick={fetchAndPlaySong} disabled={isLoading}>
            {isLoading ? 'Loading...' : 'Play'}
          </button>
        )}
        {isPlaying && <button onClick={stopPlayback}>Stop</button>}
      </div>
      {audioError && <p>Error: {audioError}</p>}
    </div>
  )
}
