import { useState, useRef, useEffect } from 'react'
import { Square, X, FileText, Sparkles } from 'lucide-react'
import toast from 'react-hot-toast'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { noteService } from '../services/noteService'
import { aiService } from '../services/aiService'
import { useParams, useNavigate } from 'react-router-dom'
import IntelligentListening, { Question } from './IntelligentListening'

interface GlobalAudioRecorderProps {
  courseId?: number  // Optional now - will auto-detect from URL
}

export default function GlobalAudioRecorder({ courseId: propCourseId }: GlobalAudioRecorderProps) {
  const { courseId: urlCourseId } = useParams<{ courseId: string }>()
  const navigate = useNavigate()
  const [isRecording, setIsRecording] = useState(false)
  const [isMinimized, setIsMinimized] = useState(true)  // Always start minimized
  const [recordingTime, setRecordingTime] = useState(0)
  const [isTranscribing, setIsTranscribing] = useState(false)
  const [currentNoteId, setCurrentNoteId] = useState<number | null>(null)
  const [fullTranscript, setFullTranscript] = useState<string>('')
  const [showIntelligent, setShowIntelligent] = useState(false)
  const [intelligentEnabled, setIntelligentEnabled] = useState(() => {
    const saved = localStorage.getItem('intelligent_enabled')
    return saved ? JSON.parse(saved) : true
  })
  const [pendingQuestions, setPendingQuestions] = useState<number>(0)  // Count of unread questions
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const timerRef = useRef<number | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const chunkIntervalRef = useRef<number | null>(null)
  const audioChunksRef = useRef<Blob[]>([])  // Collect all audio chunks
  const queryClient = useQueryClient()

  // Auto-detect course ID from URL or prop, fallback to 1 (default course)
  const parsedCourseId = urlCourseId ? Number.parseInt(urlCourseId, 10) : NaN
  const courseId = propCourseId ?? (Number.isFinite(parsedCourseId) ? parsedCourseId : 1)

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
          return error.message || 'Failed to start recording.'
      }
    }

    if (error instanceof Error && error.message) {
      return error.message
    }

    return 'Failed to start recording.'
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

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
      if (chunkIntervalRef.current) {
        clearInterval(chunkIntervalRef.current)
      }
    }
  }, [])

  const createNoteMutation = useMutation({
    mutationFn: noteService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] })
    },
  })

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
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            channelCount: 1,
            sampleRate: 16000,
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
        })
      } catch {
        // Fallback for browsers/devices that reject advanced constraints.
        stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      }

      streamRef.current = stream

      // Create note IMMEDIATELY when recording starts
      const now = new Date()
      const noteTitle = `📝 Transcript - ${now.toLocaleString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        hour: '2-digit', 
        minute: '2-digit' 
      })}`
      
      const newNote = await createNoteMutation.mutateAsync({
        title: noteTitle,
        content: `# ${noteTitle}\n\n**Status:** ✅ Completed\n**Duration:** 0:00\n\n## Transcript\n\n*Listening...*\n\n`,
        course_id: courseId,
        tag_ids: [],
      })
      
      setCurrentNoteId(newNote.id)
      setFullTranscript('')
      audioChunksRef.current = []  // Reset chunks

      const recorderOptions = getRecorderOptions()
      const mediaRecorder = recorderOptions
        ? new MediaRecorder(stream, recorderOptions)
        : new MediaRecorder(stream)
      
      mediaRecorderRef.current = mediaRecorder
      
      console.log('🎙️ Starting MediaRecorder with live transcription every 15 seconds...')
      
      // Request data every 15 seconds for live transcription (larger chunks = better accuracy)
      mediaRecorder.start(15000) // 15 second intervals
      
      console.log('✅ MediaRecorder started, state:', mediaRecorder.state)
      
      mediaRecorder.ondataavailable = async (event) => {
        console.log('📦 Data available event:', event.data.size, 'bytes')
        if (event.data.size > 0) {
          // Collect this chunk
          audioChunksRef.current.push(event.data)
          console.log('✅ Collected chunk, total chunks:', audioChunksRef.current.length)
          
          // Process ALL chunks so far to get live transcript
          if (audioChunksRef.current.length > 0 && !isTranscribing) {
            await processLiveTranscription(newNote.id)
          }
        }
      }
      
      mediaRecorder.onerror = (event: any) => {
        console.error('❌ MediaRecorder error:', event.error)
        toast.error('Recording error: ' + event.error?.message)
      }
      
      mediaRecorder.onstop = async () => {
        console.log('⏹️ MediaRecorder stopped')
        
        // Stop all tracks
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop())
          streamRef.current = null
        }
        
        // Final transcription if we haven't already
        if (audioChunksRef.current.length > 0 && !fullTranscript.trim()) {
          await processCompleteAudio(newNote.id)
        } else {
          await finalizeTranscript(newNote.id)
        }
      }
      
      setIsRecording(true)
      setRecordingTime(0)
      setIsMinimized(true)  // Always minimize when starting
      
      console.log('⏱️ Starting timer...')
      
      // Start timer - update duration every second
      timerRef.current = window.setInterval(() => {
        setRecordingTime(prev => {
          const newTime = prev + 1
          if (newTime % 10 === 0) {  // Log every 10 seconds
            console.log(`⏱️ Recording time: ${newTime}s`)
          }
          return newTime
        })
      }, 1000)
      
      console.log('✅ Recording started successfully!')
      toast.success(`📝 Transcript started\n🎙️ Live transcription active`, { duration: 3000 })
    } catch (error) {
      if (stream) {
        stream.getTracks().forEach(track => track.stop())
      }
      streamRef.current = null
      toast.error(getRecordingErrorMessage(error))
      console.error('Recording error:', error)
    }
  }

  const processLiveTranscription = async (noteId: number) => {
    try {
      // Create a complete audio blob from ALL chunks collected so far
      const completeAudioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
      
      console.log('🎤 Live transcription:', completeAudioBlob.size, 'bytes from', audioChunksRef.current.length, 'chunks')
      
      if (completeAudioBlob.size < 5000) {
        console.log('⏭️ Audio too small for transcription yet')
        return
      }
      
      setIsTranscribing(true)
      
      // Create audio file from complete recording so far
      const audioFile = new File([completeAudioBlob], `live-${Date.now()}.webm`, { type: 'audio/webm' })
      
      // Transcribe the complete audio so far
      const transcript = await aiService.transcribeAudio(audioFile)
      
      if (transcript && transcript.trim().length > 0) {
        console.log('✅ Live transcript updated:', transcript.length, 'characters')
        setFullTranscript(transcript.trim())
        await updateNoteTranscript(noteId, transcript.trim(), recordingTime)
      }
    } catch (error) {
      console.error('Live transcription error:', error)
      // Don't stop recording on error - just log it
    } finally {
      setIsTranscribing(false)
    }
  }

  const processCompleteAudio = async (noteId: number) => {
    try {
      // Combine all chunks into one complete audio file
      const completeAudioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
      
      console.log('🎤 Processing complete audio:', completeAudioBlob.size, 'bytes from', audioChunksRef.current.length, 'chunks')
      
      if (completeAudioBlob.size < 1000) {
        console.log('⏭️ Audio too small, likely no speech')
        await finalizeTranscript(noteId)
        return
      }
      
      setIsTranscribing(true)
      toast.loading('Transcribing audio...', { duration: 2000 })
      
      // Create audio file from complete recording
      const audioFile = new File([completeAudioBlob], `recording-${Date.now()}.webm`, { type: 'audio/webm' })
      
      // Transcribe the complete audio
      const transcript = await aiService.transcribeAudio(audioFile)
      
      if (transcript && transcript.trim().length > 0) {
        console.log('✅ Transcription complete:', transcript.length, 'characters')
        setFullTranscript(transcript.trim())
        await updateNoteTranscript(noteId, transcript.trim(), recordingTime)
        toast.success('✅ Transcription complete!')
      } else {
        console.log('⚠️ No speech detected in recording')
        await finalizeTranscript(noteId)
        toast('⚠️ No speech detected in recording', { 
          icon: '🎤',
          duration: 4000 
        })
      }
    } catch (error) {
      console.error('Transcription error:', error)
      toast.error('Failed to transcribe audio')
      await finalizeTranscript(noteId)
    } finally {
      setIsTranscribing(false)
      audioChunksRef.current = []  // Clear chunks
    }
  }

  const updateNoteTranscript = async (noteId: number, transcript: string, seconds: number) => {
    try {
      const now = new Date()
      const noteTitle = `📝 Transcript - ${now.toLocaleString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        hour: '2-digit', 
        minute: '2-digit' 
      })}`
      
      const updatedContent = `# ${noteTitle}\n\n**Status:** ✅ Completed\n**Duration:** ${formatTime(seconds)}\n\n## Transcript\n\n${transcript}\n\n`
      
      await noteService.update(noteId, { content: updatedContent })
      queryClient.invalidateQueries({ queryKey: ['notes', noteId] })
    } catch (error: any) {
      // If note was deleted (404), stop trying to update it
      if (error?.response?.status === 404) {
        console.warn('Note was deleted, stopping transcript updates')
        setCurrentNoteId(null)
        setIsRecording(false)
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
          mediaRecorderRef.current.stop()
        }
      } else {
        console.error('Failed to update transcript:', error)
      }
    }
  }

  const finalizeTranscript = async (noteId: number) => {
    try {
      const now = new Date()
      const noteTitle = `📝 Transcript - ${now.toLocaleString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        hour: '2-digit', 
        minute: '2-digit' 
      })}`
      
      const finalContent = fullTranscript.trim() || '*No speech detected - try speaking louder or closer to the microphone*'
      const updatedContent = `# ${noteTitle}\n\n**Status:** ✅ Completed\n**Duration:** ${formatTime(recordingTime)}\n\n## Transcript\n\n${finalContent}\n\n`
      
      await noteService.update(noteId, { content: updatedContent })
      queryClient.invalidateQueries({ queryKey: ['notes'] })
      queryClient.invalidateQueries({ queryKey: ['notes', noteId] })
      
      if (fullTranscript.trim()) {
        toast.success('✅ Transcript completed!')
      } else {
        toast('⚠️ No speech detected', { 
          icon: '🎤',
          duration: 4000 
        })
      }
    } catch (error: any) {
      // If note was deleted, just clean up silently
      if (error?.response?.status === 404) {
        console.warn('Note was deleted before finalization')
      } else {
        console.error('Failed to finalize transcript:', error)
        toast.error('Failed to save final transcript')
      }
    } finally {
      setIsTranscribing(false)
      setIsMinimized(true)
      
      // Auto-close after 2 seconds
      setTimeout(() => {
        setCurrentNoteId(null)
        setFullTranscript('')
      }, 2000)
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
      
      toast.success('🛑 Recording stopped - Finalizing...', { duration: 2000 })
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const handleCancel = () => {
    if (isRecording) {
      stopRecording()
    }
    setIsMinimized(false)
    setRecordingTime(0)
  }

  if (!isRecording && !isTranscribing && !isMinimized) {
    return (
      <button
        onClick={startRecording}
        className="fixed bottom-6 left-6 bg-kit-green hover:bg-kit-green-dark text-white rounded-full p-4 shadow-lg z-40 transition-transform hover:scale-110"
        title="Create Transcript"
      >
        <FileText className="w-6 h-6" />
      </button>
    )
  }

  return (
    <div className={`fixed bottom-6 left-6 z-40 transition-all ${isMinimized ? 'w-16' : 'w-80'}`}>
      {isMinimized ? (
        <button
          onClick={() => setIsMinimized(false)}
          className="bg-kit-green hover:bg-kit-green-dark text-white rounded-full p-4 shadow-lg"
          title="Active transcript - Click to view"
        >
          <div className="relative">
            <FileText className="w-6 h-6" />
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
            </span>
          </div>
        </button>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl p-4 border-2 border-kit-green">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="relative">
                <FileText className="w-5 h-5 text-kit-green" />
                {isRecording && (
                  <span className="absolute -top-1 -right-1 flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                  </span>
                )}
              </div>
              <h3 className="font-semibold text-base">
                {isTranscribing ? 'Processing...' : 'Transcript'}
              </h3>
            </div>
            <button
              onClick={() => setIsMinimized(true)}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
              title="Minimize"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="mb-4">
            <div className="text-3xl font-mono text-center mb-2">
              {formatTime(recordingTime)}
            </div>
            {isRecording && (
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                <div className="bg-kit-green h-2 animate-pulse" style={{ width: '100%' }} />
              </div>
            )}
            {isTranscribing && (
              <div className="text-sm text-center text-gray-600 dark:text-gray-400 mt-2">
                Processing transcript...
              </div>
            )}
            {currentNoteId && (
              <button
                onClick={() => navigate(`/courses/${courseId}/notes/${currentNoteId}`)}
                className="mt-2 w-full text-xs text-kit-green hover:text-kit-green-dark flex items-center justify-center gap-1"
              >
                <FileText className="w-3 h-3" />
                View Live Note
              </button>
            )}
            
            {/* AI Listening Toggle */}
            {isRecording && (
              <div className="mt-2 flex items-center justify-between p-2 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-3 h-3 text-purple-500" />
                  <span className="text-xs font-medium text-gray-700 dark:text-gray-300">AI Listening</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={intelligentEnabled}
                    onChange={(e) => {
                      const enabled = e.target.checked
                      setIntelligentEnabled(enabled)
                      localStorage.setItem('intelligent_enabled', JSON.stringify(enabled))
                      toast.success(enabled ? '✨ AI Listening enabled' : '✨ AI Listening disabled', { duration: 2000 })
                    }}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-purple-300 dark:peer-focus:ring-purple-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-gradient-to-r peer-checked:from-purple-500 peer-checked:to-pink-500"></div>
                </label>
              </div>
            )}
          </div>

          <div className="flex gap-2">
            {isRecording && (
              <>
                <button
                  onClick={() => {
                    setShowIntelligent(true)
                    setPendingQuestions(0)
                  }}
                  className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-3 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-1 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  title="View AI Questions"
                  disabled={!intelligentEnabled}
                >
                  <Sparkles className="w-4 h-4" />
                  {pendingQuestions > 0 && (
                    <span className="bg-white text-purple-600 rounded-full px-1.5 py-0.5 text-xs font-bold">
                      {pendingQuestions}
                    </span>
                  )}
                  View
                </button>
                <button
                  onClick={stopRecording}
                  className="flex-1 bg-kit-green hover:bg-kit-green-dark text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <Square className="w-4 h-4" />
                  Complete
                </button>
                <button
                  onClick={handleCancel}
                  className="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-lg transition-colors"
                  title="Cancel"
                >
                  <X className="w-4 h-4" />
                </button>
              </>
            )}
            {isTranscribing && (
              <div className="flex-1 text-center py-2 text-gray-600 dark:text-gray-400">
                <div className="animate-spin inline-block w-5 h-5 border-2 border-current border-t-transparent rounded-full" />
              </div>
            )}
          </div>

          <div className="mt-3 text-xs text-gray-500 dark:text-gray-400 text-center">
            {isRecording && '📝 Live transcription active'}
            {isTranscribing && '⚙️ Finalizing transcript'}
          </div>
        </div>
      )}
      
      {/* Intelligent Listening - Always runs in background if enabled */}
      {intelligentEnabled && isRecording && (
        <IntelligentListening
          transcript={fullTranscript}
          recordingTime={recordingTime}
          onClose={() => setShowIntelligent(!showIntelligent)}
          isVisible={showIntelligent}
          onQuestionGenerated={(question: Question) => {
            console.log('New question generated:', question)
            setPendingQuestions(prev => prev + 1)
          }}
        />
      )}
    </div>
  )
}
