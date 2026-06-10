import { useState, useEffect, useRef } from 'react'
import { X, ChevronUp, ChevronDown, Search } from 'lucide-react'

interface SearchDialogProps {
  isOpen: boolean
  onClose: () => void
  content: string
  onHighlight: (matches: { start: number; end: number }[], currentIndex: number) => void
}

export default function SearchDialog({ isOpen, onClose, content, onHighlight }: SearchDialogProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [matches, setMatches] = useState<{ start: number; end: number }[]>([])
  const [currentMatch, setCurrentMatch] = useState(0)
  const [caseSensitive, setCaseSensitive] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen])

  useEffect(() => {
    if (!searchTerm) {
      setMatches([])
      setCurrentMatch(0)
      onHighlight([], 0)
      return
    }

    const searchRegex = new RegExp(
      searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
      caseSensitive ? 'g' : 'gi'
    )
    
    const foundMatches: { start: number; end: number }[] = []
    let match

    while ((match = searchRegex.exec(content)) !== null) {
      foundMatches.push({
        start: match.index,
        end: match.index + match[0].length,
      })
    }

    setMatches(foundMatches)
    setCurrentMatch(foundMatches.length > 0 ? 0 : -1)
    onHighlight(foundMatches, 0)
  }, [searchTerm, content, caseSensitive, onHighlight])

  const handlePrevious = () => {
    if (matches.length === 0) return
    const newIndex = currentMatch > 0 ? currentMatch - 1 : matches.length - 1
    setCurrentMatch(newIndex)
    onHighlight(matches, newIndex)
  }

  const handleNext = () => {
    if (matches.length === 0) return
    const newIndex = currentMatch < matches.length - 1 ? currentMatch + 1 : 0
    setCurrentMatch(newIndex)
    onHighlight(matches, newIndex)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (e.shiftKey) {
        handlePrevious()
      } else {
        handleNext()
      }
    } else if (e.key === 'Escape') {
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed top-20 right-4 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 p-4 z-50 min-w-[320px]">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Search className="w-4 h-4 text-gray-500" />
          <h3 className="font-semibold">Find in Note</h3>
        </div>
        <button
          onClick={onClose}
          className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search..."
            className="flex-1 px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-kit-green text-sm"
          />
          <button
            onClick={handlePrevious}
            disabled={matches.length === 0}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Previous (Shift+Enter)"
          >
            <ChevronUp className="w-4 h-4" />
          </button>
          <button
            onClick={handleNext}
            disabled={matches.length === 0}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Next (Enter)"
          >
            <ChevronDown className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center justify-between text-sm">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={caseSensitive}
              onChange={(e) => setCaseSensitive(e.target.checked)}
              className="rounded border-gray-300 text-kit-green focus:ring-kit-green"
            />
            <span className="text-gray-700 dark:text-gray-300">Case sensitive</span>
          </label>
          
          <span className="text-gray-500">
            {matches.length === 0 ? (
              searchTerm ? 'No matches' : ''
            ) : (
              `${currentMatch + 1} of ${matches.length}`
            )}
          </span>
        </div>

        <div className="text-xs text-gray-500 pt-2 border-t border-gray-200 dark:border-gray-700">
          Press <kbd className="px-1 py-0.5 bg-gray-200 dark:bg-gray-700 rounded">Enter</kbd> for next, 
          <kbd className="px-1 py-0.5 bg-gray-200 dark:bg-gray-700 rounded ml-1">Shift+Enter</kbd> for previous, 
          <kbd className="px-1 py-0.5 bg-gray-200 dark:bg-gray-700 rounded ml-1">Esc</kbd> to close
        </div>
      </div>
    </div>
  )
}
