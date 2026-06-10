// --- QuizPlay component ---
import React from 'react'
import AnimatedCounter from '../components/AnimatedCounter'
import AnimatedProgressBar from '../components/AnimatedProgressBar'

function QuizPlay({ quizId, onClose }: { quizId: number, onClose: () => void }) {
  const [questions, setQuestions] = React.useState<any[]>([])
  const [current, setCurrent] = React.useState(0)
  const [selected, setSelected] = React.useState<number | null>(null)
  const [showAnswer, setShowAnswer] = React.useState(false)
  const [correct, setCorrect] = React.useState(0)
  const [finished, setFinished] = React.useState(false)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState('')

  React.useEffect(() => {
    setLoading(true)
    fetch(`http://localhost:8000/api/ai/quiz/list-quizzes`)
      .then(res => res.json())
      .then(data => {
        const quiz = data.find((q: any) => q.id === quizId)
        if (!quiz) throw new Error('Quiz not found')
        setQuestions(quiz.questions ? JSON.parse(quiz.questions) : [])
        setLoading(false)
      })
      .catch(e => {
        setError(e.message)
        setLoading(false)
      })
  }, [quizId])

  if (loading) return <div className="p-6 text-center">Loading quiz...</div>;
  if (error) return <div className="p-6 text-center text-red-500">{error}</div>;
  if (finished) {
    return (
      <div className="p-6 text-center">
        <h2 className="text-2xl font-bold mb-4">Quiz Complete!</h2>
        <div className="mb-2 flex flex-col items-center justify-center">
          <span className="text-4xl font-extrabold text-kit-green flex items-end gap-2">
            <AnimatedCounter value={correct} duration={1200} className="inline-block" />
            <span className="text-2xl font-bold text-gray-500">/ {questions.length}</span>
          </span>
          <span className="text-lg text-gray-500 mt-1">Score</span>
          <div className="w-full max-w-xs mt-4">
            <AnimatedProgressBar value={questions.length > 0 ? correct / questions.length : 0} duration={1200} />
          </div>
        </div>
        <button className="btn-primary mt-4" onClick={onClose}>Close</button>
      </div>
    );
  }
  // Guard: if no questions or current index is out of bounds
  if (!questions.length || !questions[current]) {
    return <div className="p-6 text-center text-gray-500">No questions found for this quiz.</div>;
  }
  const q = questions[current];
  return (
    <div className="p-6">
      <h3 className="text-lg font-semibold mb-2">Question {current + 1} of {questions.length}</h3>
      <div className="mb-4 font-medium">{q.question}</div>
      <div className="space-y-2 mb-4">
        {q.options.map((opt: string, idx: number) => (
          <button
            key={idx}
            className={`w-full text-left px-4 py-2 rounded-lg border transition-all ${selected === idx ? (showAnswer ? (opt === q.correct_answer ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50') : 'border-kit-green bg-kit-green/10') : 'border-gray-300 dark:border-gray-600'}`}
            disabled={showAnswer}
            onClick={() => setSelected(idx)}
          >
            {opt}
          </button>
        ))}
      </div>
      {showAnswer ? (
        <div className="mb-4">
          {q.options[selected!] === q.correct_answer ? (
            <span className="text-green-600 font-semibold">Correct!</span>
          ) : (
            <span className="text-red-600 font-semibold">Incorrect.</span>
          )}
          <div className="text-sm mt-2 text-gray-500">Explanation: {q.explanation || 'No explanation provided.'}</div>
        </div>
      ) : null}
      <div className="flex gap-2">
        {!showAnswer ? (
          <button
            className="btn-primary flex-1"
            disabled={selected === null}
            onClick={() => {
              setShowAnswer(true)
              if (q.options[selected!] === q.correct_answer) setCorrect(c => c + 1)
            }}
          >
            Submit
          </button>
        ) : (
          <button
            className="btn-primary flex-1"
            onClick={() => {
              setShowAnswer(false)
              setSelected(null)
              if (current + 1 < questions.length) setCurrent(c => c + 1)
              else setFinished(true)
            }}
          >
            {current + 1 < questions.length ? 'Next' : 'Finish'}
          </button>
        )}
      </div>
    </div>
  );
}
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { quizService } from '../services/quizService'
import { Trophy, Target, Clock, TrendingUp, AlertCircle, RefreshCw, Plus } from 'lucide-react'
import { format } from 'date-fns'
import Skeleton from '../components/Skeleton'
import { useState, useEffect } from 'react'

import Modal from '../components/Modal'
import toast from 'react-hot-toast'
import KITAsyncSpinner from '../components/KITAsyncSpinner'
import '../components/KITAsyncSpinner.css'

interface QuizQuestion {
  question: string
  options: string[]
  correct_answer: string
  explanation?: string
}

export default function Quiz() {
  const queryClient = useQueryClient()
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false)
  const [saveMode, setSaveMode] = useState<'new' | 'existing'>('new')
  const [quizTitle, setQuizTitle] = useState('')
  const [selectedQuizId, setSelectedQuizId] = useState<number | null>(null)
  const [generatedQuestions, setGeneratedQuestions] = useState<QuizQuestion[]>([])
  const [savedQuizzes, setSavedQuizzes] = useState<any[]>([])
  const [showCreateQuizModal, setShowCreateQuizModal] = useState(false)

  // Add state for quiz play modal
  const [playQuizId, setPlayQuizId] = useState<number | null>(null)

  // Load generated questions from session storage on mount
  useEffect(() => {
    const stored = sessionStorage.getItem('generatedQuestions')
    if (stored) {
      try {
        const questions = JSON.parse(stored)
        setGeneratedQuestions(questions)
        setIsSaveModalOpen(true)
        sessionStorage.removeItem('generatedQuestions')
      } catch (e) {
        console.error('Failed to parse questions from session storage:', e)
      }
    }
  }, [])

  // Fetch saved quizzes on mount and when refetched
  const fetchQuizzes = () => quizService.getSavedQuizzes().then(setSavedQuizzes)
  useEffect(() => {
    fetchQuizzes()
  }, [])

  const { data: stats, isLoading: statsLoading, isError: statsError, refetch: refetchStats } = useQuery({
    queryKey: ['quiz-stats'],
    queryFn: quizService.getStats,
    retry: 2,
  })

  const { data: attempts, isLoading: attemptsLoading, isError: attemptsError, refetch: refetchAttempts } = useQuery({
    queryKey: ['quiz-attempts'],
    queryFn: quizService.getAttempts,
    retry: 2,
  })

  const { data: achievements, isLoading: achievementsLoading } = useQuery({
    queryKey: ['quiz-achievements'],
    queryFn: quizService.getAchievements,
    retry: 2,
  })

  const { data: existingQuizzes = [] } = useQuery({
    queryKey: ['ai-quizzes-list'],
    queryFn: async () => {
      const response = await fetch('http://localhost:8000/api/ai/quiz/list-quizzes')
      if (!response.ok) throw new Error('Failed to fetch quizzes')
      return response.json()
    },
    enabled: isSaveModalOpen && saveMode === 'existing',
  })

  const saveQuizMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('http://localhost:8000/api/ai/quiz/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questions: generatedQuestions,
          ...(saveMode === 'new'
            ? { quiz_title: quizTitle, note_ids: [] }
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
      setGeneratedQuestions([])
      setIsSaveModalOpen(false)
      setQuizTitle('')
      setSelectedQuizId(null)
      setSaveMode('new')
      fetchQuizzes()
      queryClient.invalidateQueries({ queryKey: ['quiz-stats'] })
      queryClient.invalidateQueries({ queryKey: ['quiz-attempts'] })
    },
    onError: (error: any) => {
      const message = error instanceof Error ? error.message : 'Failed to save quiz'
      toast.error(message)
    },
  })

  const isLoading = statsLoading || attemptsLoading || achievementsLoading
  const isError = statsError || attemptsError

  const handleSaveQuiz = () => {
    if (saveMode === 'new' && !quizTitle.trim()) {
      toast.error('Please enter a quiz title')
      return
    }
    if (saveMode === 'existing' && !selectedQuizId) {
      toast.error('Please select a quiz')
      return
    }
    saveQuizMutation.mutate()
  }

  if (isError) {
    return (
      <div>
        <h1 className="text-3xl font-bold mb-6">Quiz</h1>
        <div className="flex flex-col items-center justify-center h-64">
          <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
          <h2 className="text-xl font-semibold mb-2">Failed to load quiz data</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Unable to fetch quiz statistics and attempts
          </p>
          <button 
            onClick={() => { 
              refetchStats(); 
              refetchAttempts(); 
            }} 
            className="btn-primary flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Retry
          </button>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div>
        <h1 className="text-3xl font-bold mb-6">Quiz</h1>
        
        {/* Stats Grid Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="card p-6">
              <div className="flex items-center gap-3 mb-2">
                <Skeleton className="w-10 h-10 rounded-lg" />
                <Skeleton className="h-4 w-24" />
              </div>
              <Skeleton className="h-9 w-16" />
            </div>
          ))}
        </div>

        {/* Recent Attempts Skeleton */}
        <h2 className="text-xl font-semibold mb-4">Recent Attempts</h2>
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="card p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <Skeleton className="h-8 w-16 mb-2" />
                  <Skeleton className="h-4 w-48" />
                </div>
                <Skeleton className="h-5 w-20" />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Quiz</h1>
        <button
          onClick={() => setShowCreateQuizModal(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          New Quiz
        </button>
      </div>

      {/* Saved Quizzes List */}
      {savedQuizzes.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {savedQuizzes.map((quiz) => (
            <div key={quiz.id} className="card bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm p-6 transition-shadow transition-transform hover:shadow-xl hover:scale-[1.03] hover:border-kit-blue/40 hover:bg-kit-blue/5 transition-colors">
              <h3 className="text-lg font-semibold mb-2">{quiz.title}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                {quiz.question_count} questions
              </p>
              <p className="text-xs text-gray-400 mb-4">
                Created {format(new Date(quiz.created_at), 'MMM d, yyyy')}
              </p>
              <div className="flex gap-2">
                <button className="btn-primary flex-1" onClick={() => setPlayQuizId(quiz.id)}>Play</button>
                <button
                  onClick={async () => {
                    if (window.confirm('Are you sure you want to delete this quiz?')) {
                      await quizService.deleteSavedQuiz(quiz.id);
                      fetchQuizzes();
                    }
                  }}
                  className="btn-secondary text-sm py-2 px-4 text-red-600 dark:text-red-400"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
  <div className="card p-12 text-center text-gray-500 dark:text-gray-400 mb-8 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm transition-shadow transition-transform hover:shadow-xl hover:scale-[1.03] transition-colors">
          <Target className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <p className="text-lg mb-2">No saved quizzes yet</p>
          <p className="text-sm">Create your first quiz to get started</p>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
  <div className="card p-8 bg-gradient-to-br from-kit-green/10 via-white to-blue-100 dark:from-kit-green/20 dark:via-gray-900 dark:to-blue-900 border border-kit-green/20 dark:border-kit-green/30 rounded-2xl shadow-lg transition-shadow transition-transform hover:shadow-2xl hover:scale-105">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 bg-kit-green/20 shadow-inner rounded-xl">
              <Target className="w-5 h-5 text-kit-green" />
            </div>
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Total Attempts
            </h3>
          </div>
          <p className="text-3xl font-bold">{stats?.total_attempts || 0}</p>
        </div>

  <div className="card p-8 bg-gradient-to-br from-kit-green/10 via-white to-blue-100 dark:from-kit-green/20 dark:via-gray-900 dark:to-blue-900 border border-kit-green/20 dark:border-kit-green/30 rounded-2xl shadow-lg transition-shadow transition-transform hover:shadow-2xl hover:scale-105">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 bg-kit-blue/20 shadow-inner rounded-xl">
              <TrendingUp className="w-5 h-5 text-kit-blue" />
            </div>
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Average Score
            </h3>
          </div>
          <p className="text-3xl font-bold">
            {stats?.average_score?.toFixed(1) || 0}%
          </p>
        </div>

  <div className="card p-8 bg-gradient-to-br from-kit-green/10 via-white to-blue-100 dark:from-kit-green/20 dark:via-gray-900 dark:to-blue-900 border border-kit-green/20 dark:border-kit-green/30 rounded-2xl shadow-lg transition-shadow transition-transform hover:shadow-2xl hover:scale-105">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 bg-kit-orange/20 shadow-inner rounded-xl">
              <Trophy className="w-5 h-5 text-kit-orange" />
            </div>
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Best Score
            </h3>
          </div>
          <p className="text-3xl font-bold">{stats?.best_score || 0}%</p>
        </div>

  <div className="card p-8 bg-gradient-to-br from-kit-green/10 via-white to-blue-100 dark:from-kit-green/20 dark:via-gray-900 dark:to-blue-900 border border-kit-green/20 dark:border-kit-green/30 rounded-2xl shadow-lg transition-shadow transition-transform hover:shadow-2xl hover:scale-105">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 bg-kit-green-light/20 shadow-inner rounded-xl">
              <Clock className="w-5 h-5 text-kit-green-light" />
            </div>
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Total Time
            </h3>
          </div>
          <p className="text-3xl font-bold">
            {Math.floor((stats?.total_time || 0) / 60)}m
          </p>
        </div>
      </div>

      {/* Achievements */}
      {achievements && achievements.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Achievements</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {achievements.map((achievement) => (
              <div
                key={achievement.id}
                className={`card p-4 ${
                  achievement.unlocked
                    ? 'border-kit-green dark:border-kit-green-light'
                    : 'opacity-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Trophy
                    className={`w-8 h-8 ${
                      achievement.unlocked
                        ? 'text-kit-orange'
                        : 'text-gray-400'
                    }`}
                  />
                  <div className="flex-1">
                    <h3 className="font-semibold">{achievement.name}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {achievement.description}
                    </p>
                    {achievement.unlocked && achievement.unlocked_at && (
                      <p className="text-xs text-kit-green mt-1">
                        Unlocked {format(new Date(achievement.unlocked_at), 'MMM d, yyyy')}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Attempts */}
      {attempts && attempts.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Recent Attempts</h2>
          <div className="space-y-3">
            {attempts.slice(0, 10).map((attempt) => (
              <div key={attempt.id} className="card p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-3">
                      <span className="text-2xl font-bold text-kit-green">
                        {Math.round((attempt.score / attempt.total_questions) * 100)}%
                      </span>
                      <span className="text-gray-500 dark:text-gray-400">
                        {attempt.score}/{attempt.total_questions} correct
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      {format(new Date(attempt.created_at), 'MMM d, yyyy h:mm a')}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                    <Clock className="w-4 h-4" />
                    <span>{Math.floor(attempt.time_taken / 60)}m {attempt.time_taken % 60}s</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {(!attempts || attempts.length === 0) && (
        <div className="card p-12 text-center text-gray-500 dark:text-gray-400">
          <Target className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <p className="text-lg mb-2">No quiz attempts yet</p>
          <p className="text-sm">Take your first quiz to see your progress here</p>
        </div>
      )}

      {/* Save Generated Quiz Modal */}
      <Modal
        isOpen={isSaveModalOpen}
        onClose={() => {
          setIsSaveModalOpen(false)
          setGeneratedQuestions([])
          setQuizTitle('')
          setSelectedQuizId(null)
          setSaveMode('new')
        }}
        title="Save Generated Quiz"
      >
        <div className="space-y-6">
          <div className="bg-kit-green/10 border border-kit-green/30 rounded-lg p-4">
            <p className="text-sm text-kit-green font-medium">
              {generatedQuestions.length} questions ready to save
            </p>
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
                className={`py-2 px-3 rounded-lg border-2 font-medium transition-all ${
                  saveMode === 'new'
                    ? 'border-kit-green bg-kit-green/10 text-kit-green'
                    : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300'
                }`}
              >
                New Quiz
              </button>
              <button
                type="button"
                onClick={() => setSaveMode('existing')}
                className={`py-2 px-3 rounded-lg border-2 font-medium transition-all ${
                  saveMode === 'existing'
                    ? 'border-kit-green bg-kit-green/10 text-kit-green'
                    : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300'
                }`}
              >
                Existing Quiz
              </button>
            </div>
          </div>

          {saveMode === 'new' ? (
            <div>
              <label className="block text-sm font-medium mb-2">Quiz Title *</label>
              <input
                type="text"
                value={quizTitle}
                onChange={(e) => setQuizTitle(e.target.value)}
                className="input-field"
                placeholder="e.g., Photosynthesis Quiz"
                autoFocus
              />
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium mb-2">Select Quiz *</label>
              {existingQuizzes && existingQuizzes.length > 0 ? (
                <select
                  value={selectedQuizId || ''}
                  onChange={(e) => setSelectedQuizId(e.target.value ? parseInt(e.target.value) : null)}
                  className="input-field"
                  autoFocus
                >
                  <option value="">-- Choose a quiz --</option>
                  {existingQuizzes.map((quiz: any) => (
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

          {/* Preview */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
            <h4 className="text-sm font-semibold mb-2">Preview:</h4>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {generatedQuestions.slice(0, 5).map((q, idx) => (
                <div key={idx} className="text-sm">
                  <p className="font-medium text-gray-700 dark:text-gray-300">
                    {idx + 1}. {q.question}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 ml-4">
                    {q.options.length} options
                  </p>
                </div>
              ))}
              {generatedQuestions.length > 5 && (
                <p className="text-xs text-gray-500 italic">...and {generatedQuestions.length - 5} more</p>
              )}
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <button
              type="button"
              onClick={() => {
                setIsSaveModalOpen(false)
                setGeneratedQuestions([])
                setQuizTitle('')
                setSelectedQuizId(null)
                setSaveMode('new')
              }}
              className="btn-secondary flex-1"
              disabled={saveQuizMutation.isPending}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSaveQuiz}
              disabled={saveQuizMutation.isPending}
              className="btn-primary flex-1 flex items-center justify-center gap-2"
            >
              {saveQuizMutation.isPending ? (
                <>
                  <KITAsyncSpinner />
                  <span className="ml-2">Saving...</span>
                </>
              ) : 'Save Quiz'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Create New Quiz Modal */}
      <Modal
        isOpen={showCreateQuizModal}
        onClose={() => setShowCreateQuizModal(false)}
        title="Create New Quiz"
      >
        <div className="p-6">
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            This feature is coming soon! Stay tuned.
          </p>
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setShowCreateQuizModal(false)}
              className="btn-secondary"
            >
              Close
            </button>
          </div>
        </div>
      </Modal>

      {/* Quiz Play Modal */}
      <Modal isOpen={!!playQuizId} onClose={() => {
        setPlayQuizId(null)
      }} title="Play Quiz">
        {playQuizId && (
          <QuizPlay quizId={playQuizId} onClose={() => setPlayQuizId(null)} />
        )}
      </Modal>
    </div>
  )
}
