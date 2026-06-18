import { useCallback, useState, useRef, useEffect } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import * as Tone from 'tone'
import { useSongById } from '../hooks/useSongs'
import {
  fetchSongTracks,
  fetchSlowSongTracks,
  checkSlowTrackAvailability,
  type AudioTracks
} from '../services/audio'
import {
  ArrowLeft,
  Play,
  Pause,
  Rewind,
  StepForward,
  Repeat,
  Guitar,
  Snail
} from 'lucide-react'
import { getSongImageUrl } from '../utils/songImages'

export const MusicPlayer = () => {
  const { songId } = useParams<{ songId: string }>()
  const navigate = useNavigate()
  const location = useLocation()
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
  const loadedTrackKeyRef = useRef<string | null>(null)
  const [hasSlowTrack, setHasSlowTrack] = useState(false)
  const returnTo =
    typeof (location.state as { returnTo?: unknown } | null)?.returnTo === 'string'
      ? (location.state as { returnTo: string }).returnTo
      : null
  const returnState =
    typeof (location.state as { returnState?: unknown } | null)?.returnState === 'object' &&
    (location.state as { returnState?: unknown } | null)?.returnState !== null
      ? (location.state as { returnState: Record<string, unknown> }).returnState
      : undefined

  const playerState = location.state as
    | {
        returnTo?: string
        returnState?: Record<string, unknown>
        homeworkId?: string
      }
    | undefined

  const handleBack = () => {
    if (returnTo) {
      navigate(returnTo, {
        replace: true,
        state: playerState?.homeworkId
          ? {
              ...returnState,
              focusHomeworkId: playerState.homeworkId
            }
          : returnState
      })
      return
    }

    navigate(-1)
  }

const cleanupTransport = useCallback(() => {
  Tone.Transport.cancel()
  Tone.Transport.stop()
  Tone.Transport.position = 0
}, [])

const loadSongTracks = useCallback(async () => {
  if (!songId || !song) return

  const trackKey = `${songId}:${song.updatedAt}:${isPracticeTempo ? 'slow' : 'normal'}`
  if (tracksLoaded && loadedTrackKeyRef.current === trackKey) return

  try {
    setIsLoading(true)
    setAudioError(null)

    const tracks = isPracticeTempo
      ? await fetchSlowSongTracks(songId, song.updatedAt)
      : await fetchSongTracks(songId, song.updatedAt)

    if (!tracks && isPracticeTempo) {
      console.warn('Slow tempo bundle not found, falling back to normal tempo.')
      setHasSlowTrack(false)
      setIsPracticeTempo(false)
      return
    }

    if (!tracks) {
      throw new Error('Ääniraitoja ei löytynyt')
    }

    if (playersRef.current) {
      cleanupTransport()
      playersRef.current.dispose()
    }
    cleanupAudioUrls()
    audioTracksRef.current = tracks

    const playerUrls: { [key: string]: string } = {}
    if (tracks.melody) playerUrls.melody = tracks.melody
    if (tracks.backing) playerUrls.backing = tracks.backing

    playersRef.current = new Tone.Players(playerUrls).toDestination()

    const loadPromises: Promise<unknown>[] = []

    if (tracks.melody) {
      const melodyPlayer = playersRef.current.player('melody')
      if (!melodyPlayer.loaded) {
        loadPromises.push(melodyPlayer.load(tracks.melody))
      }
    }

    if (tracks.backing) {
      const backingPlayer = playersRef.current.player('backing')
      if (!backingPlayer.loaded) {
        loadPromises.push(backingPlayer.load(tracks.backing))
      }
    }

    await Promise.all(loadPromises)

    if (tracks.melody) {
      playersRef.current.player('melody').sync().start(0)
    }

    if (tracks.backing) {
      playersRef.current.player('backing').sync().start(0)

      const backingDuration =
        playersRef.current.player('backing').buffer.duration

      Tone.Transport.loopStart = 0
      Tone.Transport.loopEnd = backingDuration
      setDuration(backingDuration)
    }

    setTracksLoaded(true)
    loadedTrackKeyRef.current = trackKey
  } catch (err) {
    console.error('Error loading tracks:', err)
    setAudioError(
      err instanceof Error ? err.message : 'Raitojen lataus epäonnistui'
    )
  } finally {
    setIsLoading(false)
  }
}, [songId, song, tracksLoaded, isPracticeTempo, cleanupTransport])

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
    loadedTrackKeyRef.current = null
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

  const displayTime = isDragging ? (dragPosition / 100) * duration : currentTime

  useEffect(() => {
    if (!songId) return

    const verifyTracks = async () => {
      const isAvailable = await checkSlowTrackAvailability(songId, song?.updatedAt)
      setHasSlowTrack(isAvailable)
    }

    verifyTracks()
  }, [songId, song?.updatedAt])

  useEffect(() => {
    loadSongTracks()
  }, [loadSongTracks])

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
      loadedTrackKeyRef.current = null
    }
  }, [cleanupTransport])

  useEffect(() => {
    if (!song?.title) return

    const shouldLoop =
      song.metadata?.isImpro === true ||
      song.id.toLowerCase().includes('impro') ||
      song.title.toLowerCase().includes('impro')
    
    setIsLooping(shouldLoop)
    Tone.Transport.loop = shouldLoop
  }, [song?.id, song?.metadata?.isImpro, song?.title])

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
    <div className="min-h-screen flex flex-col">
      <button
        onClick={handleBack}
        className="absolute left-6 top-4 z-10 rounded-full bg-black/35 p-1 backdrop-blur-sm transition hover:bg-black/50"
        aria-label="Palaa takaisin"
      >
        <ArrowLeft className="w-8 h-8 text-white" />
      </button>

      {song && (
        <div
          className="relative flex flex-col justify-end h-[80vh] px-6"
          style={{
            backgroundImage: song?.metadata
              ? `url("${getSongImageUrl(song.metadata, 'hero')}")`
              : undefined,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundColor: '#171717'
          }}
        >
          <div className="absolute inset-x-0 bottom-0 h-30 bg-gradient-to-t from-neutral-900 via-neutral-900/70 to-transparent z-0" />
          <div className="pb-6 relative z-10">
            <h1 className="text-4xl">{song.title}</h1>
          </div>
        </div>
      )}

      {isLoading && <p>Ladataan ääniraitoja...</p>}
      <div>
        <div className="w-full px-6">
          {tracksLoaded && (
            <div className="w-full">
              <input
                className="w-full accent-white"
                type="range"
                min="0"
                max="100"
                step="0.1"
                value={
                  isDragging
                    ? dragPosition
                    : duration > 0
                      ? (currentTime / duration) * 100
                      : 0
                }
                onChange={handleSliderChange}
                onMouseUp={handleSliderRelease}
                onTouchEnd={handleSliderRelease}
                disabled={!tracksLoaded}
              />
              <div className="flex justify-between w-full text-gray-400">
                <span>{formatTime(Math.floor(displayTime))}</span>
                <span>{formatTime(Math.floor(duration))}</span>
              </div>
            </div>
          )}
        </div>

        <div className="w-full px-6 py-5">
          <div className="relative flex items-center justify-between">
            <div className="w-16 flex items-center">
              <button
                onClick={toggleMelodyMute}
                disabled={!(tracksLoaded && audioTracksRef.current?.melody)}
              >
                <Guitar
                  className={`w-6 h-6 ${
                    tracksLoaded && audioTracksRef.current?.melody
                      ? isMelodyMuted
                        ? 'text-yellow-400'
                        : 'text-white'
                      : 'text-gray-500'
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center gap-12">
              <button onClick={rewindToStart} disabled={!tracksLoaded}>
                {isPlaying ? (
                  <StepForward className="w-8 h-8 text-white" />
                ) : (
                  <Rewind className="w-8 h-8 text-white" />
                )}
              </button>

              {!isPlaying ? (
                <button
                  onClick={startPlayback}
                  disabled={isLoading || !tracksLoaded}
                >
                  <Play className="w-10 h-10 text-white" />
                </button>
              ) : (
                <button onClick={pausePlayback}>
                  <Pause className="w-10 h-10 text-white" />
                </button>
              )}

              {tracksLoaded && (
                <button onClick={toggleLoop}>
                  <Repeat
                    className={`w-8 h-8 ${isLooping ? 'text-yellow-400' : 'text-white'}`}
                  />
                </button>
              )}
            </div>

            <div className="w-16 flex items-center justify-end">
              <button
                onClick={togglePracticeTempo}
                disabled={!hasSlowTrack}
                title={!hasSlowTrack ? 'Hidasta versiota ei ole saatavilla tästä kappaleesta' : ''}
              >
                <Snail
                  className={`w-5 h-5 ${
                    !hasSlowTrack
                      ? 'text-gray-600 cursor-not-allowed'
                      : isPracticeTempo
                        ? 'text-yellow-400'
                        : 'text-white'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>
      </div>
      {audioError && <p>Virhe: {audioError}</p>}
    </div>
  )
}
