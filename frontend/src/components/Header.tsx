import { Moon, Sun, Search, MessageSquare } from 'lucide-react'
import { useThemeStore } from '../store/themeStore'
import { useState } from 'react'
import { searchService } from '../services/searchService'
import { useNavigate } from 'react-router-dom'
import AIChatPanel from './AIChatPanel'
import { useQuery } from '@tanstack/react-query'

export default function Header() {
  const { theme, toggleTheme } = useThemeStore()
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearchFocused, setIsSearchFocused] = useState(false)
  const [isChatOpen, setIsChatOpen] = useState(false)

  const { data: searchResults } = useQuery({
    queryKey: ['search', searchQuery],
    queryFn: () => searchService.searchAll(searchQuery),
    enabled: searchQuery.length > 2,
  })

  const handleResultClick = (result: any) => {
    if (result.type === 'note' && result.course_id) {
      navigate(`/courses/${result.course_id}/notes/${result.id}`)
    } else if (result.type === 'course') {
      navigate(`/courses/${result.id}`)
    }
    setSearchQuery('')
    setIsSearchFocused(false)
  }

  return (
    <>
      <header className="h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-6">
        {/* Search Bar */}
        <div className="flex-1 max-w-xl relative">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
              placeholder="Search notes and courses..."
              className="w-full pl-10 pr-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-kit-green"
            />
          </div>

          {/* Search Results Dropdown */}
          {isSearchFocused && searchResults && searchResults.length > 0 && (
            <div className="absolute top-full mt-2 w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 max-h-96 overflow-y-auto z-50">
              {searchResults.map((result, index) => (
                <div
                  key={`${result.type}-${result.id}-${index}`}
                  onClick={() => handleResultClick(result)}
                  className="p-3 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer border-b border-gray-200 dark:border-gray-700 last:border-b-0"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs px-2 py-1 rounded-full bg-kit-green/10 text-kit-green">
                          {result.type}
                        </span>
                        <h4 className="font-semibold">{result.title}</h4>
                      </div>
                      {result.course_name && (
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                          {result.course_name}
                        </p>
                      )}
                      {result.content && (
                        <p className="text-sm text-gray-600 dark:text-gray-300 mt-1 line-clamp-2">
                          {result.content.substring(0, 100)}...
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsChatOpen(!isChatOpen)}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            aria-label="AI Chat"
          >
            <MessageSquare className="w-5 h-5 text-gray-700 dark:text-gray-300" />
          </button>
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            aria-label="Toggle theme"
          >
            {theme === 'light' ? (
              <Moon className="w-5 h-5 text-gray-700 dark:text-gray-300" />
            ) : (
              <Sun className="w-5 h-5 text-gray-700 dark:text-gray-300" />
            )}
          </button>
        </div>
      </header>

      <AIChatPanel isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
    </>
  )
}
