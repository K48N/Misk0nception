import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { flashcardService, DeckCreate } from '../services/flashcardService'
import { Plus, BookOpen, Calendar, AlertCircle, RefreshCw } from 'lucide-react'

import AnimatedCounter from '../components/AnimatedCounter'
import { useState, useEffect } from 'react'

import Modal from '../components/Modal'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import { FlashcardDeckSkeleton } from '../components/Skeleton'
import FlashcardStudyModal from '../components/FlashcardStudyModal'
import KITAsyncSpinner from '../components/KITAsyncSpinner'
import '../components/KITAsyncSpinner.css'

interface Flashcard {
  front: string
  back: string
}

export default function Flashcards() {
  const queryClient = useQueryClient()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false)
  const [generatedFlashcards, setGeneratedFlashcards] = useState<Flashcard[]>([])
  const [saveMode, setSaveMode] = useState<'new' | 'existing'>('new')
  const [deckName, setDeckName] = useState('')
  const [deckDescription, setDeckDescription] = useState('')
  const [selectedExistingDeckId, setSelectedExistingDeckId] = useState<number | null>(null)
  const [formData, setFormData] = useState<DeckCreate>({
    name: '',
    description: '',
  })
  const [studyModalOpen, setStudyModalOpen] = useState(false)
  const [studyDeckId, setStudyDeckId] = useState<number | null>(null)

  // Load generated flashcards from session storage on mount
  useEffect(() => {
    const stored = sessionStorage.getItem('generatedFlashcards')
    if (stored) {
      try {
        const cards = JSON.parse(stored)
        setGeneratedFlashcards(cards)
        setIsSaveModalOpen(true)
        sessionStorage.removeItem('generatedFlashcards')
      } catch (e) {
        console.error('Failed to parse flashcards from session storage:', e)
      }
    }
  }, [])

  const { data: decks, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['flashcard-decks'],
    queryFn: flashcardService.getDecks,
    retry: 2,
  })

  const createMutation = useMutation({
    mutationFn: flashcardService.createDeck,
    onSuccess: () => {
      toast.success('Deck created successfully!')
      queryClient.invalidateQueries({ queryKey: ['flashcard-decks'] })
      setIsModalOpen(false)
      setFormData({ name: '', description: '' })
    },
    onError: () => {
      toast.error('Failed to create deck')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: flashcardService.deleteDeck,
    onSuccess: () => {
      toast.success('Deck deleted successfully!')
      queryClient.invalidateQueries({ queryKey: ['flashcard-decks'] })
    },
    onError: () => {
      toast.error('Failed to delete deck')
    },
  })

  const saveFlashcardsMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('http://localhost:8000/api/ai/flashcards/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          flashcards: generatedFlashcards,
          ...(saveMode === 'new'
            ? { deck_name: deckName, description: deckDescription }
            : { deck_id: selectedExistingDeckId }
          ),
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.detail || 'Failed to save flashcards')
      }

      return response.json()
    },
    onSuccess: () => {
      toast.success('Flashcards saved successfully!')
      setGeneratedFlashcards([])
      setIsSaveModalOpen(false)
      setDeckName('')
      setDeckDescription('')
      setSelectedExistingDeckId(null)
      setSaveMode('new')
      queryClient.invalidateQueries({ queryKey: ['flashcard-decks'] })
    },
    onError: (error: any) => {
      const message = error instanceof Error ? error.message : 'Failed to save flashcards'
      toast.error(message)
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim()) {
      toast.error('Please enter a deck name')
      return
    }
    createMutation.mutate(formData)
  }

  const handleDelete = (id: number) => {
    if (confirm('Are you sure you want to delete this deck?')) {
      deleteMutation.mutate(id)
    }
  }

  const handleSaveFlashcards = () => {
    if (saveMode === 'new' && !deckName.trim()) {
      toast.error('Please enter a deck name')
      return
    }
    if (saveMode === 'existing' && !selectedExistingDeckId) {
      toast.error('Please select a deck')
      return
    }
    saveFlashcardsMutation.mutate()
  }

  if (isLoading) {
    return (
      <div>
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Flashcards</h1>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <FlashcardDeckSkeleton key={i} />
          ))}
        </div>
      </div>
    )
  }

  if (isError) {
    return (
      <div>
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Flashcards</h1>
        </div>
        <div className="flex flex-col items-center justify-center h-64">
          <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
          <h2 className="text-xl font-semibold mb-2">Failed to load flashcard decks</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {error instanceof Error ? error.message : 'An error occurred'}
          </p>
          <button onClick={() => refetch()} className="btn-primary flex items-center gap-2">
            <RefreshCw className="w-4 h-4" />
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Flashcards</h1>
        <button
          onClick={() => setIsModalOpen(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          New Deck
        </button>
      </div>

      {decks && decks.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {decks.map((deck) => (
            <div key={deck.id} className="card bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm p-6 transition-shadow transition-transform hover:shadow-xl hover:scale-[1.03] hover:border-kit-green/40 hover:bg-kit-green/5 transition-colors">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold mb-1">{deck.name}</h3>
                  {deck.description && (
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {deck.description}
                    </p>
                  )}
                </div>
                <BookOpen className="w-5 h-5 text-kit-green" />
              </div>

              <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-300 mb-4">
                <span>
                  <AnimatedCounter value={deck.card_count} className="font-bold text-kit-green" /> cards
                </span>
                <span className="text-gray-400">•</span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {format(new Date(deck.created_at), 'MMM d')}
                </span>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setStudyDeckId(deck.id)
                    setStudyModalOpen(true)
                  }}
                  className="btn-primary flex-1 text-sm py-2"
                >
                  Study
                </button>
                <button
                  onClick={() => handleDelete(deck.id)}
                  className="btn-secondary text-sm py-2 px-4 text-red-600 dark:text-red-400"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
  <div className="card p-12 text-center text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm transition-shadow transition-transform hover:shadow-xl hover:scale-[1.03] transition-colors">
          <BookOpen className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <p className="text-lg mb-2">No flashcard decks yet</p>
          <p className="text-sm">Create your first deck to start studying</p>
        </div>
      )}

      {/* Create New Deck Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create New Deck"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Deck Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="input-field"
              placeholder="e.g., Linear Algebra Formulas"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="input-field"
              rows={3}
              placeholder="Optional description..."
            />
          </div>

          <div className="flex gap-2 pt-4">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="btn-secondary flex-1"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="btn-primary flex-1 flex items-center justify-center gap-2"
            >
              {createMutation.isPending ? (
                <>
                  <KITAsyncSpinner />
                  <span className="ml-2">Creating...</span>
                </>
              ) : 'Create Deck'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Save Generated Flashcards Modal */}
      <Modal
        isOpen={isSaveModalOpen}
        onClose={() => {
          setIsSaveModalOpen(false)
          setGeneratedFlashcards([])
          setDeckName('')
          setDeckDescription('')
          setSelectedExistingDeckId(null)
          setSaveMode('new')
        }}
        title="Save Generated Flashcards"
      >
        <div className="space-y-6">
          <div className="bg-kit-green/10 border border-kit-green/30 rounded-lg p-4">
            <p className="text-sm text-kit-green font-medium">
              <AnimatedCounter value={generatedFlashcards.length} className="font-bold" /> flashcards ready to save
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
                  setSelectedExistingDeckId(null)
                }}
                className={`py-2 px-3 rounded-lg border-2 font-medium transition-all ${
                  saveMode === 'new'
                    ? 'border-kit-green bg-kit-green/10 text-kit-green'
                    : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300'
                }`}
              >
                New Deck
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
                Existing Deck
              </button>
            </div>
          </div>

          {saveMode === 'new' ? (
            <>
              <div>
                <label className="block text-sm font-medium mb-2">Deck Name *</label>
                <input
                  type="text"
                  value={deckName}
                  onChange={(e) => setDeckName(e.target.value)}
                  className="input-field"
                  placeholder="e.g., New Flashcard Deck"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Description (Optional)</label>
                <textarea
                  value={deckDescription}
                  onChange={(e) => setDeckDescription(e.target.value)}
                  className="input-field"
                  rows={2}
                  placeholder="Brief description..."
                />
              </div>
            </>
          ) : (
            <div>
              <label className="block text-sm font-medium mb-2">Select Deck *</label>
              {decks && decks.length > 0 ? (
                <select
                  value={selectedExistingDeckId || ''}
                  onChange={(e) => setSelectedExistingDeckId(e.target.value ? parseInt(e.target.value) : null)}
                  className="input-field"
                  autoFocus
                >
                  <option value="">-- Choose a deck --</option>
                  {decks.map((deck) => (
                    <option key={deck.id} value={deck.id}>
                      {deck.name} ({deck.card_count} cards)
                    </option>
                  ))}
                </select>
              ) : (
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 text-center text-gray-600 dark:text-gray-400">
                  No existing decks. Please create a new deck instead.
                </div>
              )}
            </div>
          )}

          {/* Preview */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
            <h4 className="text-sm font-semibold mb-2">Preview:</h4>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {generatedFlashcards.slice(0, 5).map((card, idx) => (
                <div key={idx} className="text-sm border-l-2 border-kit-green pl-2">
                  <p className="font-medium text-gray-700 dark:text-gray-300">{card.front}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    → {card.back.substring(0, 40)}{card.back.length > 40 ? '...' : ''}
                  </p>
                </div>
              ))}
              {generatedFlashcards.length > 5 && (
                <p className="text-xs text-gray-500 italic">...and {generatedFlashcards.length - 5} more</p>
              )}
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <button
              type="button"
              onClick={() => {
                setIsSaveModalOpen(false)
                setGeneratedFlashcards([])
                setDeckName('')
                setDeckDescription('')
                setSelectedExistingDeckId(null)
                setSaveMode('new')
              }}
              className="btn-secondary flex-1"
              disabled={saveFlashcardsMutation.isPending}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSaveFlashcards}
              disabled={saveFlashcardsMutation.isPending}
              className="btn-primary flex-1 flex items-center justify-center gap-2"
            >
              {saveFlashcardsMutation.isPending ? (
                <>
                  <KITAsyncSpinner />
                  <span className="ml-2">Saving...</span>
                </>
              ) : 'Save Flashcards'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Study Modal */}
      <FlashcardStudyModal
        isOpen={studyModalOpen}
        onClose={() => setStudyModalOpen(false)}
        deckId={studyDeckId ?? 0}
      />

    </div>
  )
}
