import { useState, useRef, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import * as Tone from 'tone'
import { useSongById } from '../hooks/useSongs'
import {
  fetchSongTracks,
  fetchSlowSongTracks,
  type AudioTracks
} from '../services/audio'

export const MusicPlayer = () => {
  const { songId } = useParams<{ songId: string }>()
  const navigate = useNavigate()
  const { data: song, isPending, isError, error } = useSongById(songId)
  const [isLoading, setIsLoading] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [audioError, setAudioError] = useState<string | null>(null)
  const [isMelodyMuted, setIsMelodyMuted] = useState(false)
  const [tracksLoaded, setTracksLoaded] = useState(false)
  const [isLooping, setIsLooping] = useState(false)
  const [isPracticeTempo, setIsPracticeTempo] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [dragPosition, setDragPosition] = useState(0)
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
        setDuration(backingDuration)
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
    Tone.Transport.cancel()
    Tone.Transport.stop()
    Tone.Transport.position = 0
  }

  const pausePlayback = () => {
    if (playersRef.current) {
      Tone.Transport.pause()
      setIsPlaying(false)
    }
  }

  const rewindToStart = () => {
    if (playersRef.current) {
      Tone.Transport.position = 0
      setCurrentTime(0)
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

  const handleSliderChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!tracksLoaded) return

    const percentage = parseFloat(event.target.value)
    setIsDragging(true)
    setDragPosition(percentage)
  }

  const handleSliderRelease = () => {
    if (!playersRef.current || !tracksLoaded || !isDragging) return

    const seekTime = (dragPosition / 100) * duration
    Tone.Transport.position = seekTime
    setCurrentTime(seekTime)
    setIsDragging(false)
  }

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const displayTime = isDragging
    ? (dragPosition / 100) * duration
    : currentTime

  useEffect(() => {
    loadSongTracks()
  }, [songId, isPracticeTempo])

  useEffect(() => {
    if (!isPlaying || !audioTracksRef.current?.backing || !playersRef.current)
      return

    const updatePosition = () => {
      const position = Tone.Transport.position
      const positionSeconds = Tone.Time(position).toSeconds()
      setCurrentTime(positionSeconds)

      if (positionSeconds >= duration - 0.1 && !isLooping) {
        setIsPlaying(false)
        Tone.Transport.stop()
        Tone.Transport.position = 0
        setCurrentTime(0)
      }
    }

    const interval = setInterval(updatePosition, 100)
    return () => clearInterval(interval)
  }, [isPlaying, isLooping, duration])

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
      <button onClick={() => navigate(-1)}>← takaisin</button>

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
        {isPlaying && <button onClick={pausePlayback}>Pysäytä</button>}
        <button onClick={rewindToStart} disabled={!tracksLoaded}>
          {isPlaying ? 'Toista alusta' : 'Kelaa alkuun'}
        </button>
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
      <div>
        {tracksLoaded && (
          <div>
            <input
              type="range"
              min="0"
              max="100"
              step="0.1"
              value={isDragging ? dragPosition : (duration > 0 ? (currentTime / duration) * 100 : 0)}
              onChange={handleSliderChange}
              onMouseUp={handleSliderRelease}
              onTouchEnd={handleSliderRelease}
              disabled={!tracksLoaded}
            />
            <p>
              {formatTime(Math.floor(displayTime))} / {formatTime(Math.floor(duration))}
            </p>
          </div>
        )}
      </div>
      {audioError && <p>Virhe: {audioError}</p>}
    </div>
  )
}
