import { useState, useRef, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import * as Tone from 'tone'
import { useSongById } from '../hooks/useSongs'
import {
  fetchSongTracks,
  fetchSlowSongTracks,
  type AudioTracks
} from '../services/audio'

export const MusicPlayer = () => {
  const { songId } = useParams<{ songId: string }>()
  const { data: song, isPending, isError, error } = useSongById(songId)
  const [isLoading, setIsLoading] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [audioError, setAudioError] = useState<string | null>(null)
  const [isMelodyMuted, setIsMelodyMuted] = useState(false)
  const [tracksLoaded, setTracksLoaded] = useState(false)
  const [isLooping, setIsLooping] = useState(false)
  const [isPracticeTempo, setIsPracticeTempo] = useState(false)
  const playersRef = useRef<Tone.Players | null>(null)
  const audioTracksRef = useRef<AudioTracks | null>(null)

  const loadSongTracks = async () => {
    if (!songId || tracksLoaded) return

    try {
      setIsLoading(true)
      setAudioError(null)

      const tracks = isPracticeTempo
        ? await fetchSlowSongTracks(songId)
        : await fetchSongTracks(songId)
      audioTracksRef.current = tracks

      if (playersRef.current) {
        cleanupTransport()
        playersRef.current.dispose()
      }

      const playerUrls: { [key: string]: string } = {}
      if (tracks.melody) playerUrls.melody = tracks.melody
      if (tracks.backing) playerUrls.backing = tracks.backing

      playersRef.current = new Tone.Players(playerUrls).toDestination()

      const loadPromises: Promise<void>[] = []

      if (tracks.melody) {
        loadPromises.push(
          new Promise(resolve => {
            const melodyPlayer = playersRef.current!.player('melody')
            if (melodyPlayer.loaded) {
              resolve()
            } else {
              melodyPlayer.load(tracks.melody!).then(() => resolve())
            }
          })
        )
      }

      if (tracks.backing) {
        loadPromises.push(
          new Promise(resolve => {
            const backingPlayer = playersRef.current!.player('backing')
            if (backingPlayer.loaded) {
              resolve()
            } else {
              backingPlayer.load(tracks.backing!).then(() => resolve())
            }
          })
        )
      }

      await Promise.all(loadPromises)

      if (tracks.melody) {
        playersRef.current.player('melody').sync().start(0)
      }
      if (tracks.backing) {
        playersRef.current.player('backing').sync().start(0)
      }

      if (tracks.backing) {
        const backingDuration =
          playersRef.current.player('backing').buffer.duration
        Tone.Transport.loopStart = 0
        Tone.Transport.loopEnd = backingDuration
      }

      setTracksLoaded(true)
      setIsLoading(false)
    } catch (err) {
      console.error('Error loading tracks:', err)
      setAudioError(
        err instanceof Error ? err.message : 'Raitojen lataus epäonnistui'
      )
      setIsLoading(false)
    }
  }

  const startPlayback = async () => {
    if (!playersRef.current || !tracksLoaded) return

    try {
      await Tone.start()

      const tracks = audioTracksRef.current

      if (tracks?.melody) {
        const melodyPlayer = playersRef.current.player('melody')
        melodyPlayer.mute = isMelodyMuted
      }

      Tone.Transport.loop = isLooping

      Tone.Transport.start()
      setIsPlaying(true)
    } catch (err) {
      console.error('Error starting playback:', err)
      setAudioError(
        err instanceof Error ? err.message : 'Toiston aloitus epäonnistui'
      )
    }
  }

  const cleanupAudioUrls = () => {
    if (audioTracksRef.current) {
      if (audioTracksRef.current.melody)
        URL.revokeObjectURL(audioTracksRef.current.melody)
      if (audioTracksRef.current.backing)
        URL.revokeObjectURL(audioTracksRef.current.backing)
      audioTracksRef.current = null
    }
  }

  const cleanupTransport = () => {
    Tone.Transport.clear()
    Tone.Transport.stop()
    Tone.Transport.position = 0
  }

  const stopPlayback = () => {
    if (playersRef.current) {
      Tone.Transport.stop()
      Tone.Transport.position = 0
      setIsPlaying(false)
    }
  }

  const toggleMelodyMute = () => {
    setIsMelodyMuted(!isMelodyMuted)

    if (playersRef.current && audioTracksRef.current?.melody) {
      const melodyPlayer = playersRef.current.player('melody')
      melodyPlayer.mute = !isMelodyMuted
    }
  }

  const toggleLoop = () => {
    setIsLooping(!isLooping)

    if (isPlaying) {
      Tone.Transport.loop = !isLooping
    }
  }

  const togglePracticeTempo = () => {
    setIsPracticeTempo(!isPracticeTempo)
    setTracksLoaded(false)
  }

  useEffect(() => {
    loadSongTracks()
  }, [songId, isPracticeTempo])

  useEffect(() => {
    if (!isPlaying || !audioTracksRef.current?.backing || !playersRef.current)
      return

    const checkPosition = () => {
      const position = Tone.Transport.position
      const backingDuration =
        playersRef.current!.player('backing').buffer.duration
      const positionSeconds = Tone.Time(position).toSeconds()

      if (positionSeconds >= backingDuration - 0.1 && !isLooping) {
        setIsPlaying(false)
        Tone.Transport.stop()
        Tone.Transport.position = 0
      }
    }

    const interval = setInterval(checkPosition, 100)
    return () => clearInterval(interval)
  }, [isPlaying, isLooping])

  useEffect(() => {
    return () => {
      if (playersRef.current) {
        playersRef.current.dispose()
      }
      cleanupTransport()
      cleanupAudioUrls()
    }
  }, [])

  if (!songId) {
    return <div>Ei kappaletta</div>
  }

  if (isPending) {
    return <div>Ladataan kappaletta...</div>
  }

  if (isError) {
    return <div>Virhe: {error?.message}</div>
  }

  return (
    <div>
      <Link to="/songslist">← takaisin</Link>

      {song && (
        <div>
          {song.metadata.imgurl && (
            <img
              src={song.metadata.imgurl}
              alt={`Cover art for ${song.title}`}
              style={{ maxWidth: '300px', height: 'auto' }}
            />
          )}
          <h1>{song.title}</h1>
          {song.metadata.composer && <p>säveltäjä {song.metadata.composer}</p>}
        </div>
      )}

      {isLoading && <p>Ladataan ääniraitoja...</p>}

      <div>
        {!isPlaying && (
          <button onClick={startPlayback} disabled={isLoading || !tracksLoaded}>
            Toista
          </button>
        )}
        {isPlaying && <button onClick={stopPlayback}>Pysäytä</button>}
        {tracksLoaded && audioTracksRef.current?.melody && (
          <button onClick={toggleMelodyMute}>
            {isMelodyMuted ? 'Melodia päälle' : 'Melodia pois'}
          </button>
        )}
        {tracksLoaded && (
          <button onClick={toggleLoop}>
            {isLooping ? 'Toisto: PÄÄLLÄ' : 'Toisto: POIS'}
          </button>
        )}
        <button onClick={togglePracticeTempo}>
          {isPracticeTempo ? 'Harjoitustempo: PÄÄLLÄ' : 'Harjoitustempo: POIS'}
        </button>
      </div>
      {audioError && <p>Virhe: {audioError}</p>}
    </div>
  )
}
