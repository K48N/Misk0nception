import { useState, useEffect, useRef } from 'react'
import { Play, Pause, RotateCcw, Settings, X } from 'lucide-react'
import toast from 'react-hot-toast'

interface FocusModeProps {
  isActive: boolean
  onExit: () => void
  content: string
  onContentChange: (content: string) => void
}

export default function FocusMode({ isActive, onExit, content, onContentChange }: FocusModeProps) {
  const [isRunning, setIsRunning] = useState(false)
  const [timeLeft, setTimeLeft] = useState(25 * 60) // 25 minutes in seconds
  const [isBreak, setIsBreak] = useState(false)
  const [sessionsCompleted, setSessionsCompleted] = useState(0)
  const [showSettings, setShowSettings] = useState(false)
  
  // Settings
  const [focusTime, setFocusTime] = useState(25)
  const [shortBreak, setShortBreak] = useState(5)
  const [longBreak, setLongBreak] = useState(15)
  const [sessionsBeforeLong, setSessionsBeforeLong] = useState(4)

  const intervalRef = useRef<number | null>(null)


  useEffect(() => {
    if (!isActive) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
      return
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onExit()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isActive, onExit])

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = window.setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            handleTimerComplete()
            return 0
          }
          return prev - 1
        })
      }, 1000)
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [isRunning])

  const handleTimerComplete = () => {
    setIsRunning(false)
    playSound()

    if (isBreak) {
      // Break finished, start new focus session
      setIsBreak(false)
      setTimeLeft(focusTime * 60)
      toast.success('Break over! Ready for another focus session?', { duration: 5000 })
    } else {
      // Focus session finished
      const newCount = sessionsCompleted + 1
      setSessionsCompleted(newCount)
      
      // Determine break length
      const isLongBreak = newCount % sessionsBeforeLong === 0
      const breakLength = isLongBreak ? longBreak : shortBreak
      
      setIsBreak(true)
      setTimeLeft(breakLength * 60)
      
      toast.success(
        `Session ${newCount} complete! ${isLongBreak ? 'Long' : 'Short'} break time!`,
        { duration: 5000 }
      )
    }
  }

  const playSound = () => {
    // Simple beep sound
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
    const oscillator = audioContext.createOscillator()
    const gainNode = audioContext.createGain()
    
    oscillator.connect(gainNode)
    gainNode.connect(audioContext.destination)
    
    oscillator.frequency.value = 800
    oscillator.type = 'sine'
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5)
    
    oscillator.start(audioContext.currentTime)
    oscillator.stop(audioContext.currentTime + 0.5)
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const handlePlayPause = () => {
    setIsRunning(!isRunning)
  }

  const handleReset = () => {
    setIsRunning(false)
    setTimeLeft(isBreak ? (sessionsCompleted % sessionsBeforeLong === 0 ? longBreak : shortBreak) * 60 : focusTime * 60)
  }

  const handleApplySettings = () => {
    setTimeLeft(focusTime * 60)
    setIsBreak(false)
    setIsRunning(false)
    setShowSettings(false)
    toast.success('Settings applied!')
  }

  if (!isActive) return null

  return (
    <div className="fixed inset-0 bg-gray-900 z-[9999] flex flex-col">
      {/* Header */}
      <div className="bg-gray-800 px-6 py-4 flex items-center justify-between border-b border-gray-700">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold text-white">Focus Mode</h1>
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <span>Sessions: {sessionsCompleted}</span>
            <span>•</span>
            <span className={isBreak ? 'text-green-400' : 'text-blue-400'}>
              {isBreak ? '☕ Break Time' : '🎯 Focus Time'}
            </span>
          </div>
        </div>
        <button
          onClick={onExit}
          className="text-gray-400 hover:text-white hover:bg-gray-700 p-2 rounded-lg transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Editor */}
        <div className="flex-1 p-8">
          <textarea
            value={content}
            onChange={(e) => onContentChange(e.target.value)}
            className="w-full h-full bg-gray-800 text-gray-100 p-6 rounded-lg border border-gray-700 font-mono text-base resize-none focus:outline-none focus:ring-2 focus:ring-kit-green"
            placeholder="Start writing your notes..."
          />
        </div>

        {/* Pomodoro Timer */}
        <div className="w-80 bg-gray-800 border-l border-gray-700 p-6 flex flex-col items-center justify-center">
          <div className="text-center space-y-6">
            {/* Timer Display */}
            <div className="relative">
              <svg className="transform -rotate-90 w-48 h-48">
                <circle
                  cx="96"
                  cy="96"
                  r="88"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="none"
                  className="text-gray-700"
                />
                <circle
                  cx="96"
                  cy="96"
                  r="88"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="none"
                  className={isBreak ? 'text-green-500' : 'text-kit-green'}
                  strokeDasharray={`${2 * Math.PI * 88}`}
                  strokeDashoffset={`${2 * Math.PI * 88 * (1 - timeLeft / ((isBreak ? (sessionsCompleted % sessionsBeforeLong === 0 ? longBreak : shortBreak) : focusTime) * 60))}`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-5xl font-bold text-white font-mono">{formatTime(timeLeft)}</span>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-center gap-4">
              <button
                onClick={handlePlayPause}
                className={`p-4 rounded-full ${
                  isBreak ? 'bg-green-600 hover:bg-green-700' : 'bg-kit-green hover:bg-kit-green-dark'
                } text-white transition-colors`}
              >
                {isRunning ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
              </button>
              <button
                onClick={handleReset}
                className="p-4 rounded-full bg-gray-700 hover:bg-gray-600 text-white transition-colors"
              >
                <RotateCcw className="w-6 h-6" />
              </button>
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="p-4 rounded-full bg-gray-700 hover:bg-gray-600 text-white transition-colors"
              >
                <Settings className="w-6 h-6" />
              </button>
            </div>

            {/* Settings Panel */}
            {showSettings && (
              <div className="bg-gray-700 rounded-lg p-4 space-y-3 text-left">
                <h3 className="font-semibold text-white mb-3">Timer Settings</h3>
                
                <div>
                  <label className="block text-sm text-gray-300 mb-1">Focus Time (minutes)</label>
                  <input
                    type="number"
                    value={focusTime}
                    onChange={(e) => setFocusTime(Number(e.target.value))}
                    min="1"
                    max="90"
                    className="w-full px-3 py-2 bg-gray-800 text-white rounded border border-gray-600"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-300 mb-1">Short Break (minutes)</label>
                  <input
                    type="number"
                    value={shortBreak}
                    onChange={(e) => setShortBreak(Number(e.target.value))}
                    min="1"
                    max="30"
                    className="w-full px-3 py-2 bg-gray-800 text-white rounded border border-gray-600"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-300 mb-1">Long Break (minutes)</label>
                  <input
                    type="number"
                    value={longBreak}
                    onChange={(e) => setLongBreak(Number(e.target.value))}
                    min="1"
                    max="60"
                    className="w-full px-3 py-2 bg-gray-800 text-white rounded border border-gray-600"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-300 mb-1">Sessions before long break</label>
                  <input
                    type="number"
                    value={sessionsBeforeLong}
                    onChange={(e) => setSessionsBeforeLong(Number(e.target.value))}
                    min="2"
                    max="8"
                    className="w-full px-3 py-2 bg-gray-800 text-white rounded border border-gray-600"
                  />
                </div>

                <button
                  onClick={handleApplySettings}
                  className="w-full bg-kit-green hover:bg-kit-green-dark text-white py-2 rounded transition-colors"
                >
                  Apply Settings
                </button>
              </div>
            )}

            {/* Stats */}
            <div className="text-sm text-gray-400 space-y-1">
              <p>Focus sessions completed: {sessionsCompleted}</p>
              <p>Next break: {sessionsCompleted % sessionsBeforeLong === sessionsBeforeLong - 1 ? 'Long' : 'Short'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-gray-800 px-6 py-3 border-t border-gray-700 text-center text-sm text-gray-400">
        Press <kbd className="px-2 py-1 bg-gray-700 rounded">ESC</kbd> to exit Focus Mode
      </div>
    </div>
  )
}
