interface MarkdownPreviewProps {
  content: string
}

export default function MarkdownPreview({ content }: MarkdownPreviewProps) {
  const parseMarkdownToHTML = (text: string): string => {
    let html = text
    
    // Escape HTML first
    html = html.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    
    // Parse line by line for better formatting
    const lines = html.split('\n')
    const parsed: string[] = []
    let inCodeBlock = false
    let codeBlockContent: string[] = []
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      
      // Code blocks ```
      if (line.trim().startsWith('```')) {
        if (!inCodeBlock) {
          inCodeBlock = true
          codeBlockContent = []
        } else {
          inCodeBlock = false
          const code = codeBlockContent.join('\n')
          parsed.push(`<pre class="bg-gray-900 dark:bg-gray-950 text-gray-100 rounded-lg p-4 overflow-x-auto my-4"><code class="text-sm font-mono">${code}</code></pre>`)
          codeBlockContent = []
        }
        continue
      }
      
      if (inCodeBlock) {
        codeBlockContent.push(line)
        continue
      }
      
      // Headers (must be at start of line)
      if (line.startsWith('### ')) {
        parsed.push(`<h3 class="text-xl font-bold mt-6 mb-2 text-gray-900 dark:text-gray-100">${line.substring(4)}</h3>`)
      } else if (line.startsWith('## ')) {
        parsed.push(`<h2 class="text-2xl font-bold mt-8 mb-3 text-gray-900 dark:text-gray-100">${line.substring(3)}</h2>`)
      } else if (line.startsWith('# ')) {
        parsed.push(`<h1 class="text-3xl font-bold mt-10 mb-4 text-gray-900 dark:text-gray-100">${line.substring(2)}</h1>`)
      }
      // Unordered lists
      else if (line.match(/^\s*[-*]\s/)) {
        const indent = line.search(/\S/)
        const content = line.replace(/^\s*[-*]\s/, '')
        parsed.push(`<li class="ml-${Math.floor(indent / 2) * 4} mb-1 flex items-start gap-2"><span class="text-kit-green mt-1">•</span><span>${content}</span></li>`)
      }
      // Numbered lists
      else if (line.match(/^\s*\d+\.\s/)) {
        const indent = line.search(/\S/)
        const content = line.replace(/^\s*\d+\.\s/, '')
        const num = line.match(/\d+/)?.[0] || '1'
        parsed.push(`<li class="ml-${Math.floor(indent / 2) * 4} mb-1 flex items-start gap-2"><span class="text-kit-green font-semibold min-w-[1.5rem]">${num}.</span><span>${content}</span></li>`)
      }
      // Blockquotes
      else if (line.startsWith('> ')) {
        parsed.push(`<blockquote class="border-l-4 border-kit-green bg-gray-50 dark:bg-gray-800/50 pl-4 py-2 my-2 italic text-gray-700 dark:text-gray-300">${line.substring(2)}</blockquote>`)
      }
      // Horizontal rule
      else if (line.trim() === '---' || line.trim() === '***') {
        parsed.push(`<hr class="my-6 border-gray-300 dark:border-gray-700" />`)
      }
      // Empty line
      else if (line.trim() === '') {
        parsed.push('<br/>')
      }
      // Regular paragraph
      else {
        parsed.push(line)
      }
    }
    
    html = parsed.join('\n')
    
    // Display math $$...$$ (must be before inline math)
    html = html.replace(/\$\$([^\$]+?)\$\$/gs, '<div class="math-display my-6 text-center text-blue-600 dark:text-blue-400 font-serif text-xl py-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg">\\[$1\\]</div>')
    
    // Inline math $...$
    html = html.replace(/\$([^\$\n]+?)\$/g, '<span class="math-inline text-blue-600 dark:text-blue-400 font-serif italic bg-blue-50 dark:bg-blue-950/30 px-1 rounded">\\($1\\)</span>')
    
    // Bold **text** (must be before italic)
    html = html.replace(/\*\*([^\*\n]+?)\*\*/g, '<strong class="font-bold text-gray-900 dark:text-white">$1</strong>')
    
    // Italic *text* (single asterisk, not part of bold)
    html = html.replace(/(?<!\*)\*(?!\*)([^\*\n]+?)\*(?!\*)/g, '<em class="italic text-gray-800 dark:text-gray-200">$1</em>')
    
    // Strikethrough ~~text~~
    html = html.replace(/~~([^~\n]+?)~~/g, '<del class="line-through opacity-70">$1</del>')
    
    // Underline __text__
    html = html.replace(/__([^_\n]+?)__/g, '<u class="underline decoration-2 decoration-kit-green underline-offset-2">$1</u>')
    
    // Highlight ==text==
    html = html.replace(/==([^=\n]+?)==/g, '<mark class="bg-yellow-200 dark:bg-yellow-900/50 px-1 py-0.5 rounded">$1</mark>')
    
    // Inline code `code`
    html = html.replace(/`([^`\n]+?)`/g, '<code class="bg-gray-100 dark:bg-gray-800 text-kit-green px-2 py-0.5 rounded font-mono text-sm">$1</code>')
    
    // Links [text](url)
    html = html.replace(/\[([^\]]+?)\]\(([^)]+?)\)/g, '<a href="$2" class="text-kit-green hover:underline" target="_blank" rel="noopener noreferrer">$1</a>')
    
    return html
  }

  return (
    <div 
      className="prose prose-lg dark:prose-invert max-w-none prose-headings:text-gray-900 dark:prose-headings:text-gray-100 prose-p:text-gray-700 dark:prose-p:text-gray-300 prose-code:text-kit-green prose-code:bg-gray-100 dark:prose-code:bg-gray-800"
      dangerouslySetInnerHTML={{ __html: parseMarkdownToHTML(content) }}
    />
  )
}
