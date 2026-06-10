import { useQuery } from '@tanstack/react-query'
import { aiService } from '../services/aiService'
import { useThemeStore } from '../store/themeStore'
import { Palette, Bot, Info, AlertCircle, RefreshCw, Sparkles } from 'lucide-react'
import Skeleton from '../components/Skeleton'
import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'

const PERSONALITY_PRESETS = [
  {
    id: 'friendly',
    name: 'Friendly & Encouraging',
    icon: '😊',
    description: 'Supportive and motivating, celebrates your progress',
    prompt: 'You are a friendly and encouraging AI tutor. Be supportive, motivating, and celebrate student progress. Use positive language and emojis occasionally.'
  },
  {
    id: 'professional',
    name: 'Professional & Formal',
    icon: '🎓',
    description: 'Academic and structured, focuses on clarity',
    prompt: 'You are a professional academic tutor. Be formal, structured, and focus on clarity. Use precise academic language without emojis.'
  },
  {
    id: 'socratic',
    name: 'Socratic Questioner',
    icon: '🤔',
    description: 'Asks thought-provoking questions to deepen understanding',
    prompt: 'You are a Socratic tutor who guides students through questioning. Ask thought-provoking questions that help students discover answers themselves. Encourage critical thinking.'
  },
  {
    id: 'concise',
    name: 'Brief & Direct',
    icon: '⚡',
    description: 'Short, to-the-point responses without extra elaboration',
    prompt: 'You are a concise tutor. Give brief, direct answers. Be efficient and to-the-point without unnecessary elaboration.'
  },
  {
    id: 'detailed',
    name: 'Detailed & Thorough',
    icon: '📚',
    description: 'Comprehensive explanations with examples',
    prompt: 'You are a thorough tutor. Provide detailed explanations with examples, analogies, and comprehensive coverage of topics.'
  },
  {
    id: 'custom',
    name: 'Custom',
    icon: '✨',
    description: 'Define your own personality',
    prompt: ''
  }
]

export default function Settings() {
  const { theme, toggleTheme } = useThemeStore()
  
  // AI personality settings
  const [selectedPersonality, setSelectedPersonality] = useState(() => {
    return localStorage.getItem('ai_personality') || 'friendly'
  })
  const [customPrompt, setCustomPrompt] = useState(() => {
    return localStorage.getItem('ai_custom_prompt') || ''
  })
  
  // Save personality settings
  useEffect(() => {
    localStorage.setItem('ai_personality', selectedPersonality)
    if (selectedPersonality === 'custom') {
      localStorage.setItem('ai_custom_prompt', customPrompt)
    }
  }, [selectedPersonality, customPrompt])

  const { data: aiStatus, isLoading, isError, refetch } = useQuery({
    queryKey: ['ai-status'],
    queryFn: aiService.checkStatus,
    retry: 2,
  })

  if (isError) {
    return (
      <div className="max-w-3xl">
        <h1 className="text-3xl font-bold mb-6">Settings</h1>
        <div className="flex flex-col items-center justify-center h-64">
          <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
          <h2 className="text-xl font-semibold mb-2">Failed to load settings</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Unable to check AI service status
          </p>
          <button onClick={() => refetch()} className="btn-primary flex items-center gap-2">
            <RefreshCw className="w-4 h-4" />
            Retry
          </button>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="max-w-3xl">
        <h1 className="text-3xl font-bold mb-6">Settings</h1>

        {/* Appearance Skeleton */}
        <div className="card p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <Skeleton className="w-5 h-5" />
            <Skeleton className="h-6 w-32" />
          </div>
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <Skeleton className="h-5 w-24 mb-2" />
              <Skeleton className="h-4 w-48" />
            </div>
            <Skeleton className="h-10 w-20" />
          </div>
        </div>

        {/* AI Settings Skeleton */}
        <div className="card p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <Skeleton className="w-5 h-5" />
            <Skeleton className="h-6 w-32" />
          </div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex-1">
              <Skeleton className="h-5 w-24 mb-2" />
              <Skeleton className="h-4 w-48" />
            </div>
            <Skeleton className="h-8 w-20 rounded-full" />
          </div>
          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-3/4 mb-2" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        </div>

        {/* About Skeleton */}
        <div className="card p-6">
          <div className="flex items-center gap-3 mb-4">
            <Skeleton className="w-5 h-5" />
            <Skeleton className="h-6 w-24" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-4 w-56" />
            <Skeleton className="h-4 w-40" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-3xl">
      <h1 className="text-3xl font-bold mb-6">Settings</h1>

      {/* Appearance */}
      <div className="card p-6 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <Palette className="w-5 h-5 text-kit-green" />
          <h2 className="text-xl font-semibold">Appearance</h2>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Color Scheme</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Choose your preferred appearance
              </p>
            </div>
            <button
              onClick={toggleTheme}
              className="btn-secondary px-6"
            >
              {theme === 'light' ? 'Light' : 'Dark'}
            </button>
          </div>
        </div>
      </div>

      {/* AI Settings */}
      <div className="card p-6 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <Bot className="w-5 h-5 text-kit-green" />
          <h2 className="text-xl font-semibold">K0npanion AI</h2>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">K0npanion Status</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {aiStatus?.available 
                  ? `Connected - ${aiStatus.provider}`
                  : 'Not available'
                }
              </p>
            </div>
            <div className={`px-3 py-1 rounded-full text-sm ${
              aiStatus?.available
                ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300'
                : 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300'
            }`}>
              {aiStatus?.available ? 'Online' : 'Offline'}
            </div>
          </div>

          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-4 h-4 text-purple-500" />
              <p className="font-medium">K0npanion's Personality</p>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
              Customize how K0npanion interacts with you
            </p>
            
            <div className="grid grid-cols-2 gap-2 mb-3">
              {PERSONALITY_PRESETS.filter(p => p.id !== 'custom').map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => {
                    setSelectedPersonality(preset.id)
                    toast.success(`K0npanion is now ${preset.name}`, { duration: 2000 })
                  }}
                  className={`p-3 rounded-lg border-2 transition-all text-left ${
                    selectedPersonality === preset.id
                      ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-700'
                  }`}
                >
                  <div className="text-2xl mb-1">{preset.icon}</div>
                  <div className="font-medium text-sm">{preset.name}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {preset.description}
                  </div>
                </button>
              ))}
            </div>
            
            {/* Custom personality option */}
            <div className="mb-3">
              <button
                onClick={() => setSelectedPersonality('custom')}
                className={`w-full p-3 rounded-lg border-2 transition-all text-left ${
                  selectedPersonality === 'custom'
                    ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-700'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-2xl">✨</span>
                  <div className="flex-1">
                    <div className="font-medium text-sm">Custom Personality</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Define your own system prompt
                    </div>
                  </div>
                </div>
              </button>
              
              {selectedPersonality === 'custom' && (
                <div className="mt-2">
                  <textarea
                    value={customPrompt}
                    onChange={(e) => setCustomPrompt(e.target.value)}
                    placeholder="e.g., You are a creative and humorous tutor who uses pop culture references..."
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm"
                    rows={3}
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    This prompt will be prepended to all AI requests
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              K0npanion AI features include:
            </p>
            <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-400 mt-2 space-y-1">
              <li>Text summarization</li>
              <li>Outline generation</li>
              <li>Quiz generation</li>
              <li>Flashcard creation</li>
              <li>Tag suggestions</li>
              <li>Grammar checking</li>
              <li>Math problem solving</li>
              <li>Diagram generation</li>
            </ul>
          </div>
        </div>
      </div>

      {/* About */}
      <div className="card p-6">
        <div className="flex items-center gap-3 mb-4">
          <Info className="w-5 h-5 text-kit-green" />
          <h2 className="text-xl font-semibold">About</h2>
        </div>
        
        <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
          <p><strong>Version:</strong> 2.0.0</p>
          <p><strong>Built with:</strong> React + FastAPI + Tauri</p>
          <p><strong>AI:</strong> K0npanion powered by Groq</p>
          <p className="pt-2 border-t border-gray-200 dark:border-gray-700">
            Modern note-taking app with AI-powered features for students.
          </p>
        </div>
      </div>
    </div>
  )
}
