import { 
  Bold, Italic, Underline, Strikethrough, Highlighter, Type, 
  List, ListOrdered, CheckSquare, Heading1, Heading2, Heading,
  Quote, Code, FileCode, Link, Image, Table, Minus, 
  Calculator, Sigma
} from 'lucide-react'
import { useState } from 'react'

interface RichTextToolbarProps {
  onFormat: (command: string, value?: string) => void
  onHighlight: (color: string) => void
  onTextSize: (size: string) => void
}

export default function RichTextToolbar({ onFormat, onHighlight, onTextSize }: RichTextToolbarProps) {
  const [showHighlightPicker, setShowHighlightPicker] = useState(false)
  const [showHeadingPicker, setShowHeadingPicker] = useState(false)
  
  const highlightColors = [
    { name: 'Yellow', color: '#ffd93d' },
    { name: 'Green', color: '#00b894' },
    { name: 'Blue', color: '#6bcff6' },
    { name: 'Pink', color: '#ff6b9d' },
    { name: 'Orange', color: '#ff8a5b' },
    { name: 'Purple', color: '#a29bfe' },
  ]

  return (
    <div className="flex items-center gap-1 p-2 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 mb-4 flex-wrap">
      {/* Text Formatting */}
      <button
        onClick={() => onFormat('bold')}
        className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
        title="Bold (**text**)"
      >
        <Bold className="w-4 h-4" />
      </button>
      
      <button
        onClick={() => onFormat('italic')}
        className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
        title="Italic (*text*)"
      >
        <Italic className="w-4 h-4" />
      </button>
      
      <button
        onClick={() => onFormat('underline')}
        className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
        title="Underline (__text__)"
      >
        <Underline className="w-4 h-4" />
      </button>

      <button
        onClick={() => onFormat('strikethrough')}
        className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
        title="Strikethrough (~~text~~)"
      >
        <Strikethrough className="w-4 h-4" />
      </button>

      {/* Highlight */}
      <div className="relative">
        <button
          onClick={() => setShowHighlightPicker(!showHighlightPicker)}
          className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
          title="Highlight (==text==)"
        >
          <Highlighter className="w-4 h-4" />
        </button>
        
        {showHighlightPicker && (
          <div className="absolute top-full left-0 mt-1 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-600 p-2 z-10">
            <div className="grid grid-cols-3 gap-2">
              {highlightColors.map((color) => (
                <button
                  key={color.color}
                  onClick={() => {
                    onHighlight(color.color)
                    setShowHighlightPicker(false)
                  }}
                  style={{ backgroundColor: color.color }}
                  className="w-8 h-8 rounded border-2 border-gray-300 dark:border-gray-600 hover:border-gray-500 transition-colors"
                  title={color.name}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      <button
        onClick={() => onFormat('code')}
        className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
        title="Inline Code (`code`)"
      >
        <Code className="w-4 h-4" />
      </button>

      <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1" />

      {/* Headings */}
      <div className="relative">
        <button
          onClick={() => setShowHeadingPicker(!showHeadingPicker)}
          className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors flex items-center gap-1"
          title="Headings"
        >
          <Heading className="w-4 h-4" />
          <span className="text-xs">▾</span>
        </button>
        
        {showHeadingPicker && (
          <div className="absolute top-full left-0 mt-1 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-600 py-1 z-10 min-w-[140px]">
            <button
              onClick={() => { onFormat('heading1'); setShowHeadingPicker(false); }}
              className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-2xl font-bold"
            >
              Heading 1
            </button>
            <button
              onClick={() => { onFormat('heading2'); setShowHeadingPicker(false); }}
              className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-xl font-bold"
            >
              Heading 2
            </button>
            <button
              onClick={() => { onFormat('heading3'); setShowHeadingPicker(false); }}
              className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-lg font-bold"
            >
              Heading 3
            </button>
          </div>
        )}
      </div>

      <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1" />

      {/* Lists */}
      <button
        onClick={() => onFormat('bulletList')}
        className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
        title="Bullet List (- item)"
      >
        <List className="w-4 h-4" />
      </button>
      
      <button
        onClick={() => onFormat('numberedList')}
        className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
        title="Numbered List (1. item)"
      >
        <ListOrdered className="w-4 h-4" />
      </button>

      <button
        onClick={() => onFormat('checkList')}
        className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
        title="Checklist (- [ ] item)"
      >
        <CheckSquare className="w-4 h-4" />
      </button>

      <button
        onClick={() => onFormat('quote')}
        className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
        title="Blockquote (> quote)"
      >
        <Quote className="w-4 h-4" />
      </button>

      <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1" />

      {/* Code & Media */}
      <button
        onClick={() => onFormat('codeBlock')}
        className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
        title="Code Block (```code```)"
      >
        <FileCode className="w-4 h-4" />
      </button>

      <button
        onClick={() => onFormat('link')}
        className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
        title="Link ([text](url))"
      >
        <Link className="w-4 h-4" />
      </button>

      <button
        onClick={() => onFormat('image')}
        className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
        title="Image (![alt](url))"
      >
        <Image className="w-4 h-4" />
      </button>

      <button
        onClick={() => onFormat('table')}
        className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
        title="Table"
      >
        <Table className="w-4 h-4" />
      </button>

      <button
        onClick={() => onFormat('divider')}
        className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
        title="Horizontal Rule (---)"
      >
        <Minus className="w-4 h-4" />
      </button>

      <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1" />

      {/* Math */}
      <button
        onClick={() => onFormat('inlineMath')}
        className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
        title="Inline Math ($x^2$)"
      >
        <Calculator className="w-4 h-4" />
      </button>

      <button
        onClick={() => onFormat('displayMath')}
        className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
        title="Display Math ($$...$$)"
      >
        <Sigma className="w-4 h-4" />
      </button>
    </div>
  )
}

