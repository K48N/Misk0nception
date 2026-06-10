import { useState } from 'react'
import { Calculator, Copy, X } from 'lucide-react'
import toast from 'react-hot-toast'

interface MathSolverProps {
  isOpen: boolean
  onClose: () => void
}

export default function MathSolver({ isOpen, onClose }: MathSolverProps) {
  const [problem, setProblem] = useState('')
  const [solution, setSolution] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  if (!isOpen) return null

  const handleSolve = async () => {
    if (!problem.trim()) {
      toast.error('Please enter a math problem')
      return
    }

    setIsLoading(true)
    try {
      // Call AI service for step-by-step solution
      const response = await fetch('http://localhost:8000/api/ai/math-solve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ problem }),
      })
      
      const data = await response.json()
      setSolution(data.solution)
      toast.success('Problem solved!')
    } catch (error) {
      toast.error('Failed to solve problem')
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(solution)
    toast.success('Solution copied!')
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <Calculator className="w-6 h-6 text-kit-green" />
            <h2 className="text-xl font-bold">Math Problem Solver</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Enter your math problem (supports LaTeX):
            </label>
            <textarea
              value={problem}
              onChange={(e) => setProblem(e.target.value)}
              placeholder="Example: Solve: ∫(2x + 3)dx or Find derivative: f(x) = x^2 + 3x + 2"
              className="w-full min-h-[100px] p-3 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg font-mono text-sm"
            />
          </div>

          <button
            onClick={handleSolve}
            disabled={isLoading || !problem.trim()}
            className="btn-primary w-full py-3 font-semibold"
          >
            {isLoading ? (
              <div className="flex items-center justify-center gap-2">
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                Solving...
              </div>
            ) : (
              'Solve Problem'
            )}
          </button>

          {solution && (
            <div className="card p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Step-by-Step Solution:</h3>
                <button
                  onClick={handleCopy}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  title="Copy solution"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
              <div className="prose dark:prose-invert max-w-none">
                <pre className="whitespace-pre-wrap text-sm">{solution}</pre>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
          <p className="text-xs text-gray-600 dark:text-gray-400">
            💡 Supports: Calculus, Algebra, Trigonometry, Linear Algebra, Differential Equations
          </p>
        </div>
      </div>
    </div>
  )
}
