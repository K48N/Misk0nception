import { useState, useRef } from 'react'
import { Mic, Square, Play, Pause, Trash2, Upload } from 'lucide-react'
import toast from 'react-hot-toast'

interface AudioRecorderProps {
  onSave: (audioBlob: Blob, filename: string) => void
}

export default function AudioRecorder({ onSave }: AudioRecorderProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [audioURL, setAudioURL] = useState<string | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const timerRef = useRef<number | null>(null)

  const getRecordingErrorMessage = (error: unknown) => {
    if (error instanceof DOMException) {
      switch (error.name) {
        case 'NotAllowedError':
        case 'SecurityError':
          return 'Microphone permission denied. Please allow microphone access in your browser.'
        case 'NotFoundError':
          return 'No microphone was found. Please connect or enable an input device.'
        case 'NotReadableError':
          return 'Microphone is busy or unavailable. Close other recording apps and try again.'
        case 'OverconstrainedError':
          return 'Your microphone does not support the requested audio settings.'
        default:
          return error.message || 'Failed to access microphone.'
      }
    }

    if (error instanceof Error && error.message) {
      return error.message
    }

    return 'Failed to access microphone.'
  }

  const getRecorderOptions = (): MediaRecorderOptions | undefined => {
    const preferredTypes = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/mp4',
    ]

    for (const mimeType of preferredTypes) {
      if (MediaRecorder.isTypeSupported(mimeType)) {
        return { mimeType }
      }
    }

    return undefined
  }

  const startRecording = async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      toast.error('Audio recording is not supported by this browser.')
      return
    }

    if (!window.isSecureContext) {
      toast.error('Recording requires HTTPS or localhost.')
      return
    }

    let stream: MediaStream | null = null

    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorderOptions = getRecorderOptions()
      const mediaRecorder = recorderOptions
        ? new MediaRecorder(stream, recorderOptions)
        : new MediaRecorder(stream)
      
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []
      
      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data)
      }
      
      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        const url = URL.createObjectURL(audioBlob)
        setAudioURL(url)
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop())
      }
      
      mediaRecorder.start()
      setIsRecording(true)
      setRecordingTime(0)
      
      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1)
      }, 1000)
      
      toast.success('Recording started')
    } catch (error) {
      if (stream) {
        stream.getTracks().forEach(track => track.stop())
      }
      toast.error(getRecordingErrorMessage(error))
      console.error('Microphone error:', error)
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
      
      toast.success('Recording stopped')
    }
  }

  const togglePlayback = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause()
      } else {
        audioRef.current.play()
      }
      setIsPlaying(!isPlaying)
    }
  }

  const handleSave = () => {
    if (audioChunksRef.current.length > 0) {
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
      const filename = `recording-${Date.now()}.webm`
      onSave(audioBlob, filename)
      handleDiscard()
      toast.success('Audio saved!')
    }
  }

  const handleDiscard = () => {
    setAudioURL(null)
    setRecordingTime(0)
    audioChunksRef.current = []
    if (audioRef.current) {
      audioRef.current = null
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="card p-4 mb-4">
      <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
        <Mic className="w-4 h-4" />
        Audio Recording
      </h3>

      <div className="flex items-center gap-3">
        {!isRecording && !audioURL && (
          <button
            onClick={startRecording}
            className="btn-primary flex items-center gap-2"
          >
            <Mic className="w-4 h-4" />
            Start Recording
          </button>
        )}

        {isRecording && (
          <>
            <button
              onClick={stopRecording}
              className="btn-secondary flex items-center gap-2 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300"
            >
              <Square className="w-4 h-4" />
              Stop
            </button>
            <div className="text-sm font-mono">
              <span className="text-red-500 animate-pulse">●</span> {formatTime(recordingTime)}
            </div>
          </>
        )}

        {audioURL && !isRecording && (
          <>
            <audio
              ref={audioRef}
              src={audioURL}
              onEnded={() => setIsPlaying(false)}
              className="hidden"
            />
            <button
              onClick={togglePlayback}
              className="btn-secondary flex items-center gap-2"
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              {isPlaying ? 'Pause' : 'Play'}
            </button>
            <button
              onClick={handleSave}
              className="btn-primary flex items-center gap-2"
            >
              <Upload className="w-4 h-4" />
              Save Audio
            </button>
            <button
              onClick={handleDiscard}
              className="btn-secondary flex items-center gap-2 text-red-600"
            >
              <Trash2 className="w-4 h-4" />
              Discard
            </button>
            <div className="text-sm text-gray-500">
              {formatTime(recordingTime)}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
