import { Check, Loader2, AlertCircle } from 'lucide-react'

type SaveStatus = 'saved' | 'saving' | 'error' | 'idle'

interface AutoSaveIndicatorProps {
  status: SaveStatus
  lastSavedAt?: Date
  error?: string
}

export default function AutoSaveIndicator({ status, lastSavedAt, error }: AutoSaveIndicatorProps) {
  const getStatusDisplay = () => {
    switch (status) {
      case 'saving':
        return (
          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm">Saving...</span>
          </div>
        )
      
      case 'saved':
        return (
          <div className="flex items-center gap-2 text-kit-green">
            <Check className="w-4 h-4" />
            <span className="text-sm">
              {lastSavedAt ? `Saved at ${formatTime(lastSavedAt)}` : 'Saved'}
            </span>
          </div>
        )
      
      case 'error':
        return (
          <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
            <AlertCircle className="w-4 h-4" />
            <span className="text-sm" title={error}>
              Failed to save
            </span>
          </div>
        )
      
      default:
        return null
    }
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    })
  }

  return (
    <div className="fixed bottom-4 right-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg px-4 py-2 border border-gray-200 dark:border-gray-700 z-30">
      {getStatusDisplay()}
    </div>
  )
}
