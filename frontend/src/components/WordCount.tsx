import { FileText, Clock } from 'lucide-react'

interface WordCountProps {
  text: string
}

export default function WordCount({ text }: WordCountProps) {
  const getStats = () => {
    const trimmedText = (text || '').trim()
    
    // Count words (split by whitespace, filter empty strings)
    const words = trimmedText ? trimmedText.split(/\s+/).length : 0
    
    // Count characters (excluding whitespace)
    const characters = trimmedText.replace(/\s/g, '').length
    
    // Estimate reading time (average 200 words per minute)
    const readingTimeMinutes = Math.ceil(words / 200)
    
    return { words, characters, readingTimeMinutes }
  }

  const { words, characters, readingTimeMinutes } = getStats()

  return (
    <div className="flex items-center gap-4 text-xs text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700">
      <div className="flex items-center gap-1">
        <FileText className="w-3 h-3" />
        <span>{words} word{words !== 1 ? 's' : ''}</span>
      </div>
      
      <div className="w-px h-4 bg-gray-300 dark:bg-gray-600" />
      
      <div className="flex items-center gap-1">
        <span>{characters} char{characters !== 1 ? 's' : ''}</span>
      </div>
      
      {words > 0 && (
        <>
          <div className="w-px h-4 bg-gray-300 dark:bg-gray-600" />
          
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            <span>{readingTimeMinutes} min read</span>
          </div>
        </>
      )}
    </div>
  )
}
