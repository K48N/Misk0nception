import { useState } from 'react'
import { Network, Copy, X, Eye } from 'lucide-react'
import toast from 'react-hot-toast'

interface DiagramGeneratorProps {
  isOpen: boolean
  onClose: () => void
}

export default function DiagramGenerator({ isOpen, onClose }: DiagramGeneratorProps) {
  const [description, setDescription] = useState('')
  const [diagramCode, setDiagramCode] = useState('')
  const [showPreview, setShowPreview] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  if (!isOpen) return null

  const handleGenerate = async () => {
    if (!description.trim()) {
      toast.error('Please enter a description')
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch('http://localhost:8000/api/ai/generate-diagram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description }),
      })
      
      const data = await response.json()
      setDiagramCode(data.diagram_code)
      toast.success('Diagram generated!')
    } catch (error) {
      toast.error('Failed to generate diagram')
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(diagramCode)
    toast.success('Diagram code copied!')
  }

  const handleCopyMarkdown = () => {
    const markdown = `\`\`\`mermaid\n${diagramCode}\n\`\`\``
    navigator.clipboard.writeText(markdown)
    toast.success('Markdown copied! Paste into notes.')
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-full max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <Network className="w-6 h-6 text-kit-green" />
            <h2 className="text-xl font-bold">Visual Diagram Generator</h2>
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
              Describe what you want to visualize:
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Example: Create a flowchart showing the process of photosynthesis, or make a mind map of machine learning algorithms"
              className="w-full min-h-[100px] p-3 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-sm"
            />
          </div>

          <button
            onClick={handleGenerate}
            disabled={isLoading || !description.trim()}
            className="btn-primary w-full py-3 font-semibold"
          >
            {isLoading ? (
              <div className="flex items-center justify-center gap-2">
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                Generating Diagram...
              </div>
            ) : (
              'Generate Diagram'
            )}
          </button>

          {diagramCode && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowPreview(!showPreview)}
                  className="btn-secondary flex items-center gap-2"
                >
                  <Eye className="w-4 h-4" />
                  {showPreview ? 'Hide Preview' : 'Show Preview'}
                </button>
                <button
                  onClick={handleCopy}
                  className="btn-secondary flex items-center gap-2"
                >
                  <Copy className="w-4 h-4" />
                  Copy Code
                </button>
                <button
                  onClick={handleCopyMarkdown}
                  className="btn-primary flex items-center gap-2"
                >
                  <Copy className="w-4 h-4" />
                  Copy as Markdown
                </button>
              </div>

              <div className="card p-4">
                <h3 className="font-semibold mb-2">Mermaid.js Code:</h3>
                <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
                  {diagramCode}
                </pre>
              </div>

              {showPreview && (
                <div className="card p-4">
                  <h3 className="font-semibold mb-3">Preview:</h3>
                  <div className="bg-white rounded-lg p-6 border border-gray-300">
                    <div
                      className="mermaid"
                      dangerouslySetInnerHTML={{ __html: diagramCode }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Note: Preview requires Mermaid.js library loaded
                  </p>
                </div>
              )}

              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  <strong>How to use:</strong> Copy as Markdown and paste into your notes. Most Markdown viewers (including GitHub, Notion, Obsidian) support Mermaid diagrams!
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
          <p className="text-xs text-gray-600 dark:text-gray-400">
            💡 Supports: Flowcharts, Mind Maps, Sequence Diagrams, Class Diagrams, State Diagrams, Gantt Charts
          </p>
        </div>
      </div>
    </div>
  )
}
