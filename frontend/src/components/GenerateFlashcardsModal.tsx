import { useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { aiService } from '../services/aiService'
import { noteService } from '../services/noteService'
import Modal from './Modal'
import toast from 'react-hot-toast'
import { Sparkles, Loader, Save, CheckCircle, Plus } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

interface Flashcard {
  front: string
  back: string
}

interface ExistingDeck {
  id: number
  title: string
  card_count: number
  description?: string
}

interface GenerateFlashcardsModalProps {
  isOpen: boolean
  onClose: () => void
  noteIds: number[]
}

export default function GenerateFlashcardsModal({ isOpen, onClose, noteIds }: GenerateFlashcardsModalProps) {
  const navigate = useNavigate()
  const [step, setStep] = useState<'config' | 'generating' | 'save'>('config')
  const [numCards, setNumCards] = useState(10)
  const [generatedCards, setGeneratedCards] = useState<Flashcard[]>([])
  const [deckName, setDeckName] = useState('')
  const [deckDescription, setDeckDescription] = useState('')
  const [saveMode, setSaveMode] = useState<'new' | 'existing'>('new')
  const [selectedDeckId, setSelectedDeckId] = useState<number | null>(null)

  // Fetch existing decks
  const { data: existingDecks = [] } = useQuery({
    queryKey: ['ai-flashcard-decks'],
    queryFn: async () => {
      const response = await fetch('http://localhost:8000/api/ai/flashcards/list-decks')
      if (!response.ok) throw new Error('Failed to fetch decks')
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
      
      // Generate flashcards
      const cards = await aiService.generateFlashcards(combinedContent, numCards)
      
      return cards
    },
    onSuccess: (cards: Flashcard[]) => {
      setGeneratedCards(cards)
      
      // Auto-generate name from first note
      noteService.getById(noteIds[0]).then(note => {
        setDeckName(`${note.title} Flashcards`)
      })
      
      setStep('save')
      toast.success('Flashcards generated successfully!')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to generate flashcards')
      setStep('config')
    },
  })

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (saveMode === 'new' && !deckName.trim()) {
        throw new Error('Please enter a deck name')
      }
      if (saveMode === 'existing' && !selectedDeckId) {
        throw new Error('Please select a deck')
      }

      const response = await fetch('http://localhost:8000/api/ai/flashcards/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          flashcards: generatedCards,
          ...(saveMode === 'new' 
            ? { deck_name: deckName, description: deckDescription }
            : { deck_id: selectedDeckId }
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
      toast.success('Flashcard deck saved successfully!')
      onClose()
      navigate('/flashcards')
    },
    onError: (error: any) => {
      const message = error instanceof Error ? error.message : error.response?.data?.detail || 'Failed to save flashcards'
      toast.error(message)
    },
  })

  const handleGenerate = () => {
    setStep('generating')
    generateMutation.mutate()
  }

  const handleSave = () => {
    if (saveMode === 'new' && !deckName.trim()) {
      toast.error('Please enter a deck name')
      return
    }
    if (saveMode === 'existing' && !selectedDeckId) {
      toast.error('Please select a deck')
      return
    }

    saveMutation.mutate()
  }

  const handleClose = () => {
    setStep('config')
    setGeneratedCards([])
    setDeckName('')
    setDeckDescription('')
    setSaveMode('new')
    setSelectedDeckId(null)
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Generate Flashcards from Notes">
      {step === 'config' && (
        <div className="space-y-6">
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Generating flashcards from <span className="font-semibold text-kit-green">{noteIds.length}</span> selected note{noteIds.length > 1 ? 's' : ''}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Number of Cards
            </label>
            <input
              type="number"
              value={numCards}
              onChange={(e) => setNumCards(Math.max(1, Math.min(50, parseInt(e.target.value) || 10)))}
              min={1}
              max={50}
              className="input-field"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Between 1 and 50 cards
            </p>
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
              Generate Flashcards
            </button>
          </div>
        </div>
      )}

      {step === 'generating' && (
        <div className="flex flex-col items-center justify-center py-12">
          <Loader className="w-12 h-12 text-kit-green animate-spin mb-4" />
          <p className="text-lg font-medium mb-2">Generating Flashcards...</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            AI is creating {numCards} flashcards from your notes
          </p>
        </div>
      )}

      {step === 'save' && (
        <div className="space-y-6">
          <div className="bg-kit-green/10 border border-kit-green/30 rounded-lg p-4 flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-kit-green flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-kit-green mb-1">Flashcards Generated Successfully!</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Created {generatedCards.length} flashcards. Choose to save to a new or existing deck.
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
                  setSelectedDeckId(null)
                }}
                className={`py-2 px-3 rounded-lg border-2 font-medium transition-all flex items-center justify-center gap-2 ${
                  saveMode === 'new'
                    ? 'border-kit-green bg-kit-green/10 text-kit-green'
                    : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-kit-green/50'
                }`}
              >
                <Plus className="w-4 h-4" />
                New Deck
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
                Existing Deck
              </button>
            </div>
          </div>

          {saveMode === 'new' ? (
            <>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Deck Name *
                </label>
                <input
                  type="text"
                  value={deckName}
                  onChange={(e) => setDeckName(e.target.value)}
                  className="input-field"
                  placeholder="e.g., Linear Algebra Key Concepts"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Description (Optional)
                </label>
                <textarea
                  value={deckDescription}
                  onChange={(e) => setDeckDescription(e.target.value)}
                  className="input-field"
                  rows={2}
                  placeholder="Brief description of this deck..."
                />
              </div>
            </>
          ) : (
            <div>
              <label className="block text-sm font-medium mb-2">
                Select Deck *
              </label>
              {existingDecks.length > 0 ? (
                <select
                  value={selectedDeckId || ''}
                  onChange={(e) => setSelectedDeckId(e.target.value ? parseInt(e.target.value) : null)}
                  className="input-field"
                  autoFocus
                >
                  <option value="">-- Choose a deck --</option>
                  {existingDecks.map((deck: ExistingDeck) => (
                    <option key={deck.id} value={deck.id}>
                      {deck.title} ({deck.card_count} cards)
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

          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
            <h4 className="text-sm font-semibold mb-2">Preview:</h4>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {generatedCards.slice(0, 5).map((card, idx) => (
                <div key={idx} className="text-sm border-l-2 border-kit-green pl-2">
                  <p className="font-medium text-gray-700 dark:text-gray-300">
                    {card.front}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    → {card.back.substring(0, 50)}{card.back.length > 50 ? '...' : ''}
                  </p>
                </div>
              ))}
              {generatedCards.length > 5 && (
                <p className="text-xs text-gray-500 dark:text-gray-400 italic">
                  ...and {generatedCards.length - 5} more cards
                </p>
              )}
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
                  Save Flashcards
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </Modal>
  )
}
