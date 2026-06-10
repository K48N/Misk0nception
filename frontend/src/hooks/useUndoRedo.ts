import { useState, useCallback, useRef } from 'react'

interface UseUndoRedoOptions {
  maxHistory?: number
}

interface UseUndoRedoReturn<T> {
  state: T
  setState: (newState: T) => void
  undo: () => void
  redo: () => void
  canUndo: boolean
  canRedo: boolean
  clear: () => void
}

/**
 * Hook for undo/redo functionality with configurable history length
 * @param initialState Initial state value
 * @param options Configuration options (maxHistory defaults to 100)
 */
export function useUndoRedo<T>(
  initialState: T,
  options: UseUndoRedoOptions = {}
): UseUndoRedoReturn<T> {
  const { maxHistory = 100 } = options

  const [history, setHistory] = useState<T[]>([initialState])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [currentState, setCurrentState] = useState<T>(initialState)
  const isUpdatingRef = useRef(false)
  const historyTimerRef = useRef<number | null>(null)

  const state = currentState
  const canUndo = currentIndex > 0
  const canRedo = currentIndex < history.length - 1

  const setState = useCallback(
    (newState: T) => {
      if (isUpdatingRef.current) return

      // Update current state immediately for instant typing
      setCurrentState(newState)

      // Debounce history updates (save to history after 500ms of no changes)
      if (historyTimerRef.current) {
        clearTimeout(historyTimerRef.current)
      }

      historyTimerRef.current = window.setTimeout(() => {
        setHistory((prev) => {
          // Remove any future states after current index
          const newHistory = prev.slice(0, currentIndex + 1)
          
          // Add new state
          newHistory.push(newState)
          
          // Trim history if it exceeds max length
          if (newHistory.length > maxHistory) {
            return newHistory.slice(newHistory.length - maxHistory)
          }
          
          return newHistory
        })
        
        setCurrentIndex((prev) => {
          const newIndex = prev + 1
          return newIndex >= maxHistory ? maxHistory - 1 : newIndex
        })
      }, 500)
    },
    [currentIndex, maxHistory]
  )

  const undo = useCallback(() => {
    if (canUndo) {
      isUpdatingRef.current = true
      const newIndex = currentIndex - 1
      setCurrentIndex(newIndex)
      setCurrentState(history[newIndex])
      setTimeout(() => {
        isUpdatingRef.current = false
      }, 0)
    }
  }, [canUndo, currentIndex, history])

  const redo = useCallback(() => {
    if (canRedo) {
      isUpdatingRef.current = true
      const newIndex = currentIndex + 1
      setCurrentIndex(newIndex)
      setCurrentState(history[newIndex])
      setTimeout(() => {
        isUpdatingRef.current = false
      }, 0)
    }
  }, [canRedo, currentIndex, history])

  const clear = useCallback(() => {
    setHistory([currentState])
    setCurrentIndex(0)
  }, [currentState])

  return {
    state,
    setState,
    undo,
    redo,
    canUndo,
    canRedo,
    clear,
  }
}
