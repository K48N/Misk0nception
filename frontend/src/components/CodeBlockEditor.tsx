import { useRef } from 'react'
import { Play, Copy, ChevronDown, ChevronUp, Plus, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'

interface CodeBlock {
  id: string
  name: string
  code: string
  language: string
  output?: string
}

interface CodeBlockEditorProps {
  blocks: CodeBlock[]
  currentBlockId: string
  onSelectBlock: (id: string) => void
  onAddBlock: () => void
  onNameChange: (id: string, name: string) => void
  onCodeChange: (id: string, code: string) => void
  onLanguageChange: (id: string, language: string) => void
  onExecute: (id: string) => void
  onDeleteBlock: (id: string) => void
  isCollapsed?: boolean
  onToggleCollapse: () => void
  isExecuting?: boolean
}

const LANGUAGES = [
  'python',
  'javascript',
  'typescript',
  'java',
  'cpp',
  'c',
  'csharp',
  'go',
  'rust',
  'ruby',
  'php',
  'html',
  'css',
  'sql',
]

export default function CodeBlockEditor({
  blocks,
  currentBlockId,
  onSelectBlock,
  onAddBlock,
  onNameChange,
  onCodeChange,
  onLanguageChange,
  onExecute,
  onDeleteBlock,
  isCollapsed = false,
  onToggleCollapse,
  isExecuting = false,
}: CodeBlockEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  
  const currentBlock = blocks.find(b => b.id === currentBlockId) || blocks[0]
  if (!currentBlock) return null

  const handleCopy = () => {
    navigator.clipboard.writeText(currentBlock.code)
    toast.success('Code copied to clipboard!')
  }

  const handleRun = () => {
    if (currentBlock.language === 'python' || currentBlock.language === 'javascript') {
      onExecute(currentBlock.id)
    } else {
      toast.error(`Execution not supported for ${currentBlock.language}`)
    }
  }

  const handleDelete = () => {
    // Allow deleting any block, including the last one
    if (confirm(`Delete code block "${currentBlock.name}"?`)) {
      onDeleteBlock(currentBlock.id)
      toast.success('Code block deleted')
    }
  }

  return (
    <div className="card mb-4 overflow-hidden">
      {/* Header */}
      <div className="bg-gray-100 dark:bg-gray-700 px-4 py-3 flex items-center justify-between border-b border-gray-200 dark:border-gray-600">
        <div className="flex items-center gap-3 flex-1">
          {/* Block Selector Dropdown */}
          <select
            value={currentBlockId}
            onChange={(e) => onSelectBlock(e.target.value)}
            className="text-base font-medium bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded px-3 py-1.5 min-w-[200px]"
          >
            {blocks.map((block) => (
              <option key={block.id} value={block.id}>
                {block.name}
              </option>
            ))}
          </select>
          
          <button
            onClick={onAddBlock}
            className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
            title="Add New Block"
          >
            <Plus className="w-4 h-4" />
          </button>
          
          <input
            type="text"
            value={currentBlock.name}
            onChange={(e) => onNameChange(currentBlock.id, e.target.value)}
            placeholder="Block Name"
            className="bg-transparent font-medium outline-none border-none focus:ring-0 px-2 text-base"
          />
          
          <select
            value={currentBlock.language}
            onChange={(e) => onLanguageChange(currentBlock.id, e.target.value)}
            className="text-sm bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded px-2 py-1"
          >
            {LANGUAGES.map((lang) => (
              <option key={lang} value={lang}>
                {lang}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={handleCopy}
            className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
            title="Copy Code"
          >
            <Copy className="w-4 h-4" />
          </button>
          {(currentBlock.language === 'python' || currentBlock.language === 'javascript') && (
            <button
              onClick={handleRun}
              disabled={isExecuting}
              className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-600 rounded disabled:opacity-50"
              title="Run Code"
            >
              <Play className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onToggleCollapse}
            className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
            title={isCollapsed ? 'Expand' : 'Collapse'}
          >
            {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
          {blocks.length > 1 && (
            <button
              onClick={handleDelete}
              className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-600 rounded text-red-600"
              title="Delete Block"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Code Editor */}
      {!isCollapsed && (
        <>
          <textarea
            ref={textareaRef}
            value={currentBlock.code}
            onChange={(e) => onCodeChange(currentBlock.id, e.target.value)}
            className="w-full min-h-[250px] p-4 font-mono text-base bg-white dark:bg-gray-800 outline-none resize-none"
            placeholder="Write your code here..."
            spellCheck={false}
          />

          {/* Output Panel */}
          {currentBlock.output && (
            <div className="border-t border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 p-4">
              <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">
                OUTPUT:
              </div>
              <pre className="text-sm font-mono whitespace-pre-wrap">{currentBlock.output}</pre>
            </div>
          )}

          {isExecuting && (
            <div className="border-t border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 p-4">
              <div className="text-sm text-gray-500 animate-pulse">Executing...</div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
