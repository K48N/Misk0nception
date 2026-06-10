import { useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { aiService } from '../services/aiService'
import { noteService } from '../services/noteService'
import Modal from './Modal'
import toast from 'react-hot-toast'
import { Sparkles, Loader, Save, CheckCircle, Plus } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

interface QuizQuestion {
  question: string
  options: string[]
  correct_answer: string
  explanation?: string
}

interface ExistingQuiz {
  id: number
  title: string
  question_count: number
}

interface GenerateQuizModalProps {
  isOpen: boolean
  onClose: () => void
  noteIds: number[]
}

export default function GenerateQuizModal({ isOpen, onClose, noteIds }: GenerateQuizModalProps) {
  const navigate = useNavigate()
  const [step, setStep] = useState<'config' | 'generating' | 'save'>('config')
  const [numQuestions, setNumQuestions] = useState(5)
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium')
  const [generatedQuestions, setGeneratedQuestions] = useState<QuizQuestion[]>([])
  const [quizTitle, setQuizTitle] = useState('')
  const [saveMode, setSaveMode] = useState<'new' | 'existing'>('new')
  const [selectedQuizId, setSelectedQuizId] = useState<number | null>(null)

  // Fetch existing quizzes
  const { data: existingQuizzes = [] } = useQuery({
    queryKey: ['ai-quizzes-list'],
    queryFn: async () => {
      const response = await fetch('http://localhost:8000/api/ai/quiz/list-quizzes')
      if (!response.ok) throw new Error('Failed to fetch quizzes')
      return response.json()
    },
    enabled: isOpen,
  })

  const generateMutation = useMutation({
    mutationFn: async () => {
      // Fetch all selected notes
      const notes = await Promise.all(noteIds.map(id => noteService.getById(id)))
      
      // Combine content
      const combinedContent = notes.map(note => `# ${note.title}\n\n${note.content}`).join('\n\n---\n\n')
      
      // Generate quiz
      const questions = await aiService.generateQuiz(combinedContent, numQuestions)
      
      return questions
    },
    onSuccess: (questions: QuizQuestion[]) => {
      setGeneratedQuestions(questions)
      
      // Auto-generate title from first note
      noteService.getById(noteIds[0]).then(note => {
        setQuizTitle(`${note.title} Quiz`)
      })
      
      setStep('save')
      toast.success('Quiz generated successfully!')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to generate quiz')
      setStep('config')
    },
  })

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (saveMode === 'new' && !quizTitle.trim()) {
        throw new Error('Please enter a quiz title')
      }
      if (saveMode === 'existing' && !selectedQuizId) {
        throw new Error('Please select a quiz')
      }

      const response = await fetch('http://localhost:8000/api/ai/quiz/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questions: generatedQuestions,
          ...(saveMode === 'new' 
            ? { quiz_title: quizTitle, note_ids: noteIds }
            : { quiz_id: selectedQuizId }
          ),
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.detail || 'Failed to save quiz')
      }

      return response.json()
    },
    onSuccess: () => {
      toast.success('Quiz saved successfully!')
      onClose()
      navigate('/quiz')
    },
    onError: (error: any) => {
      const message = error instanceof Error ? error.message : error.response?.data?.detail || 'Failed to save quiz'
      toast.error(message)
    },
  })

  const handleGenerate = () => {
    setStep('generating')
    generateMutation.mutate()
  }

  const handleSave = () => {
    if (saveMode === 'new' && !quizTitle.trim()) {
      toast.error('Please enter a quiz title')
      return
    }
    if (saveMode === 'existing' && !selectedQuizId) {
      toast.error('Please select a quiz')
      return
    }

    saveMutation.mutate()
  }

  const handleClose = () => {
    setStep('config')
    setGeneratedQuestions([])
    setQuizTitle('')
    setSaveMode('new')
    setSelectedQuizId(null)
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Generate Quiz from Notes">
      {step === 'config' && (
        <div className="space-y-6">
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Generating quiz from <span className="font-semibold text-kit-green">{noteIds.length}</span> selected note{noteIds.length > 1 ? 's' : ''}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Number of Questions
            </label>
            <input
              type="number"
              value={numQuestions}
              onChange={(e) => setNumQuestions(Math.max(1, Math.min(20, parseInt(e.target.value) || 5)))}
              min={1}
              max={20}
              className="input-field bg-white dark:bg-gray-800"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Between 1 and 20 questions
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Difficulty Level
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['easy', 'medium', 'hard'] as const).map((level) => (
                <button
                  key={level}
                  type="button"
                  onClick={() => setDifficulty(level)}
                  className={`py-2 px-4 rounded-lg border-2 font-medium transition-all ${
                    difficulty === level
                      ? 'border-kit-green bg-kit-green/10 text-kit-green'
                      : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-kit-green/50'
                  }`}
                >
                  {level.charAt(0).toUpperCase() + level.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <button
              type="button"
              onClick={handleClose}
              className="btn-secondary flex-1"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleGenerate}
              disabled={generateMutation.isPending}
              className="btn-primary flex-1 flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              Generate Quiz
            </button>
          </div>
        </div>
      )}

      {step === 'generating' && (
        <div className="flex flex-col items-center justify-center py-12">
          <Loader className="w-12 h-12 text-kit-green animate-spin mb-4" />
          <p className="text-lg font-medium mb-2">Generating Quiz...</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            AI is creating {numQuestions} questions from your notes
          </p>
        </div>
      )}

      {step === 'save' && (
        <div className="space-y-6">
          <div className="bg-kit-green/10 border border-kit-green/30 rounded-lg p-4 flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-kit-green flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-kit-green mb-1">Quiz Generated Successfully!</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Created {generatedQuestions.length} questions. Choose to save to a new or existing quiz.
              </p>
            </div>
          </div>

          {/* Save Mode Selection */}
          <div>
            <label className="block text-sm font-medium mb-3">Save Mode</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setSaveMode('new')
                  setSelectedQuizId(null)
                }}
                className={`py-2 px-3 rounded-lg border-2 font-medium transition-all flex items-center justify-center gap-2 ${
                  saveMode === 'new'
                    ? 'border-kit-green bg-kit-green/10 text-kit-green'
                    : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-kit-green/50'
                }`}
              >
                <Plus className="w-4 h-4" />
                New Quiz
              </button>
              <button
                type="button"
                onClick={() => setSaveMode('existing')}
                className={`py-2 px-3 rounded-lg border-2 font-medium transition-all ${
                  saveMode === 'existing'
                    ? 'border-kit-green bg-kit-green/10 text-kit-green'
                    : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-kit-green/50'
                }`}
              >
                Existing Quiz
              </button>
            </div>
          </div>

          {saveMode === 'new' ? (
            <div>
              <label className="block text-sm font-medium mb-2">
                Quiz Title *
              </label>
              <input
                type="text"
                value={quizTitle}
                onChange={(e) => setQuizTitle(e.target.value)}
                className="input-field"
                placeholder="e.g., Linear Algebra Midterm Review"
                autoFocus
              />
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium mb-2">
                Select Quiz *
              </label>
              {existingQuizzes.length > 0 ? (
                <select
                  value={selectedQuizId || ''}
                  onChange={(e) => setSelectedQuizId(e.target.value ? parseInt(e.target.value) : null)}
                  className="input-field"
                  autoFocus
                >
                  <option value="">-- Choose a quiz --</option>
                  {existingQuizzes.map((quiz: ExistingQuiz) => (
                    <option key={quiz.id} value={quiz.id}>
                      {quiz.title} ({quiz.question_count} questions)
                    </option>
                  ))}
                </select>
              ) : (
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 text-center text-gray-600 dark:text-gray-400">
                  No existing quizzes. Please create a new quiz instead.
                </div>
              )}
            </div>
          )}

          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
            <h4 className="text-sm font-semibold mb-2">Preview:</h4>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {generatedQuestions.map((q, idx) => (
                <div key={idx} className="text-sm">
                  <p className="font-medium text-gray-700 dark:text-gray-300">
                    {idx + 1}. {q.question}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 ml-4">
                    {q.options.length} options
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <button
              type="button"
              onClick={handleClose}
              className="btn-secondary flex-1"
              disabled={saveMutation.isPending}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saveMutation.isPending}
              className="btn-primary flex-1 flex items-center justify-center gap-2"
            >
              {saveMutation.isPending ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save Quiz
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </Modal>
  )
}
