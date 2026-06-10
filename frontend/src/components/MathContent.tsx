import { InlineMath, BlockMath } from 'react-katex'
import 'katex/dist/katex.min.css'
import { useState } from 'react'

interface MathContentProps {
  content: string
  onContentChange?: (newContent: string) => void
}

export default function MathContent({ content, onContentChange }: MathContentProps) {
  // Parse content for inline $...$ and display $$...$$ math, plus markdown formatting
  const parseContent = (text: string) => {
    const parts: (string | JSX.Element)[] = []
    let key = 0

    // Split by lines to handle headings - use single \n to avoid duplication
    const lines = text.split('\n')
    
    lines.forEach((line, lineIdx) => {
      let lineRemaining = line
      const lineParts: (string | JSX.Element)[] = []
      let lineKey = 0

      // Check for headings
      const h1Match = lineRemaining.match(/^#\s+(.+)$/)
      const h2Match = lineRemaining.match(/^##\s+(.+)$/)
      
      if (h1Match) {
        parts.push(
          <h1 key={`h1-${key++}`} className="text-3xl font-bold mt-4 mb-2">
            {parseInlineFormatting(h1Match[1], key)}
          </h1>
        )
        // Don't add extra br for headings
        return
      }
      
      if (h2Match) {
        parts.push(
          <h2 key={`h2-${key++}`} className="text-2xl font-bold mt-3 mb-2">
            {parseInlineFormatting(h2Match[1], key)}
          </h2>
        )
        // Don't add extra br for headings
        return
      }

      // Parse inline formatting (math, bold, italic, etc.)
      while (lineRemaining.length > 0) {
        // Check for display math $$...$$
        const displayMatch = lineRemaining.match(/\$\$(.*?)\$\$/s)
        if (displayMatch && displayMatch.index !== undefined) {
          if (displayMatch.index > 0) {
            lineParts.push(...parseInlineFormatting(lineRemaining.substring(0, displayMatch.index), lineKey))
          }
          
          const mathContent = displayMatch[1].trim()
          const fullMatch = displayMatch[0]
          
          lineParts.push(
            <div 
              key={`display-${key++}`} 
              className="math-display my-4 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 rounded p-2 transition-colors"
              onDoubleClick={() => {
                if (onContentChange) {
                  // Find and replace this specific math block with editable version
                  const newContent = text.replace(fullMatch, `\n\n${fullMatch}\n\n`)
                  onContentChange(newContent)
                }
              }}
              title="Double-click to edit"
            >
              <BlockMath math={mathContent} />
            </div>
          )
          lineRemaining = lineRemaining.substring(displayMatch.index + displayMatch[0].length)
          continue
        }

        // Check for inline math $...$
        const inlineMatch = lineRemaining.match(/\$([^\$]+?)\$/)
        if (inlineMatch && inlineMatch.index !== undefined) {
          if (inlineMatch.index > 0) {
            lineParts.push(...parseInlineFormatting(lineRemaining.substring(0, inlineMatch.index), lineKey))
          }
          
          const mathContent = inlineMatch[1].trim()
          const fullMatch = inlineMatch[0]
          
          lineParts.push(
            <span 
              key={`inline-${key++}`} 
              className="math-inline cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 rounded px-1 transition-colors"
              onDoubleClick={(e) => {
                e.stopPropagation()
                if (onContentChange) {
                  // For inline math, just keep it inline but make it stand out
                  // User can click into the textarea to edit
                  const textarea = document.querySelector('textarea')
                  if (textarea) {
                    const matchIndex = text.indexOf(fullMatch)
                    if (matchIndex !== -1) {
                      textarea.focus()
                      textarea.setSelectionRange(matchIndex, matchIndex + fullMatch.length)
                    }
                  }
                }
              }}
              title="Double-click to edit"
            >
              <InlineMath math={mathContent} />
            </span>
          )
          lineRemaining = lineRemaining.substring(inlineMatch.index + inlineMatch[0].length)
          continue
        }

        // No more math, parse remaining inline formatting
        lineParts.push(...parseInlineFormatting(lineRemaining, lineKey))
        break
      }

      parts.push(...lineParts)
      // Only add line break if not the last line and line has content
      if (lineIdx < lines.length - 1) {
        parts.push('\n')
      }
    })

    return parts
  }

  // Helper function to parse bold, italic, strikethrough, underline
  const parseInlineFormatting = (text: string, baseKey: number): (string | JSX.Element)[] => {
    const parts: (string | JSX.Element)[] = []
    let remaining = text
    let key = baseKey * 1000

    while (remaining.length > 0) {
      // Bold **text**
      const boldMatch = remaining.match(/\*\*(.*?)\*\*/)
      if (boldMatch && boldMatch.index !== undefined) {
        if (boldMatch.index > 0) {
          parts.push(remaining.substring(0, boldMatch.index))
        }
        parts.push(
          <strong key={`bold-${key++}`}>{boldMatch[1]}</strong>
        )
        remaining = remaining.substring(boldMatch.index + boldMatch[0].length)
        continue
      }

      // Italic *text*
      const italicMatch = remaining.match(/\*(.*?)\*/)
      if (italicMatch && italicMatch.index !== undefined) {
        if (italicMatch.index > 0) {
          parts.push(remaining.substring(0, italicMatch.index))
        }
        parts.push(
          <em key={`italic-${key++}`}>{italicMatch[1]}</em>
        )
        remaining = remaining.substring(italicMatch.index + italicMatch[0].length)
        continue
      }

      // Strikethrough ~~text~~
      const strikeMatch = remaining.match(/~~(.*?)~~/)
      if (strikeMatch && strikeMatch.index !== undefined) {
        if (strikeMatch.index > 0) {
          parts.push(remaining.substring(0, strikeMatch.index))
        }
        parts.push(
          <del key={`strike-${key++}`}>{strikeMatch[1]}</del>
        )
        remaining = remaining.substring(strikeMatch.index + strikeMatch[0].length)
        continue
      }

      // Underline __text__
      const underlineMatch = remaining.match(/__(.*?)__/)
      if (underlineMatch && underlineMatch.index !== undefined) {
        if (underlineMatch.index > 0) {
          parts.push(remaining.substring(0, underlineMatch.index))
        }
        parts.push(
          <u key={`underline-${key++}`}>{underlineMatch[1]}</u>
        )
        remaining = remaining.substring(underlineMatch.index + underlineMatch[0].length)
        continue
      }

      // No more formatting, add remaining text
      parts.push(remaining)
      break
    }

    return parts
  }

  const renderedContent = parseContent(content)

  return (
    <div className="prose prose-sm dark:prose-invert max-w-none">
      {renderedContent.map((part, idx) => (
        typeof part === 'string' ? (
          <span key={`text-${idx}`}>{part}</span>
        ) : part
      ))}
    </div>
  )
}
