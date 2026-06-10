// TypeScript interface for AIToolsModal props
// TypeScript interface for AIToolsModal props
interface AIToolsModalProps {
  isOpen: boolean;
  onClose: () => void;
  noteContent: string;
  onInsertText: (text: string) => void;
  onCreateNewNote?: (content: string) => void;
  onReplaceContent?: (content: string) => void;
  attachments?: Array<{ filename: string; text?: string; type?: string }>;
}

import { useState } from 'react';
import { X, Loader2, FileText, List, Sparkles, Highlighter, HelpCircle, CreditCard, CheckCircle, Tag, Plus, FileEdit, RefreshCw, Bot } from 'lucide-react';
import { aiService } from '../services/aiService';
import toast from 'react-hot-toast';


export default function AIToolsModal({ isOpen, onClose, noteContent, onInsertText, onCreateNewNote, onReplaceContent, attachments }: AIToolsModalProps) {
  // New: Toggle for including PDF attachments in summaries
  const [includePDFs, setIncludePDFs] = useState(false);
  const [activeTab, setActiveTab] = useState<'summarize' | 'quiz' | 'flashcards' | 'outline' | 'tags' | 'grammar' | 'format' | 'highlight'>('summarize')
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState('')
  const [numQuestions, setNumQuestions] = useState(5)
  const [numCards, setNumCards] = useState(10)
  const [summaryStyle, setSummaryStyle] = useState<'comprehensive' | 'bullet' | 'exam' | 'beginner' | 'advanced' | 'lecture'>('comprehensive')

  if (!isOpen) return null

  const handleGenerate = async () => {
    if (!noteContent.trim()) {
      toast.error('No content to process')
      return
    }

    setIsLoading(true)
    setResult('')

    try {
      let resultText = ''
      switch (activeTab) {
        case 'summarize': {
          let fullText = noteContent;
          if (includePDFs && attachments && attachments.length > 0) {
            const pdfTexts = attachments
              .filter(att => att.type === 'pdf' && att.text)
              .map(att => `\n\n[PDF: ${att.filename}]\n${att.text}`)
              .join('\n\n');
            if (pdfTexts) {
              fullText += '\n\n' + pdfTexts;
            }
          }
          const summary = await aiService.summarizeWithStyle(fullText, summaryStyle)
          const styleLabels = {
            comprehensive: 'Comprehensive Summary',
            bullet: 'Bullet Points Summary',
            exam: 'Exam-Focused Summary',
            beginner: 'Beginner-Friendly Explanation',
            advanced: 'Advanced Review',
            lecture: 'Lecture Transcript Cleanup'
          }
          resultText = `## ${styleLabels[summaryStyle]}\n\n${summary}`
          setResult(resultText)
          toast.success('Summary generated!')
          break
        }
        case 'format':
          const formatted = await aiService.smartFormat(noteContent)
          resultText = formatted
          setResult(resultText)
          toast.success('Text formatted!')
          break
        case 'highlight':
          const highlights = await aiService.highlightConcepts(noteContent)
          resultText = highlights
          setResult(resultText)
          toast.success('Key concepts highlighted!')
          break
        case 'quiz':
          const questions = await aiService.generateQuiz(noteContent, numQuestions)
          resultText = `## Quiz Questions\n\n${questions.map((q: any, i: number) => 
            `**${i + 1}. ${q.question}**\n${q.options.map((opt: string, j: number) => 
              `${String.fromCharCode(65 + j)}. ${opt}`).join('\n')}\n\n*Answer: ${q.correct_answer}*\n${q.explanation ? `*Explanation: ${q.explanation}*\n` : ''}`
          ).join('\n')}`
          setResult(resultText)
          toast.success('Quiz generated!')
          break
        case 'flashcards':
          const flashcards = await aiService.generateFlashcards(noteContent, numCards)
          resultText = `## Flashcards\n\n${flashcards.map((card: any, i: number) => 
            `**Card ${i + 1}**\n**Front:** ${card.front}\n**Back:** ${card.back}\n`
          ).join('\n')}`
          setResult(resultText)
          toast.success('Flashcards generated!')
          break
        case 'outline':
          const outline = await aiService.generateOutline(noteContent)
          resultText = outline
          setResult(resultText)
          toast.success('Outline generated!')
          break
        case 'tags':
          const tags = await aiService.suggestTags(noteContent)
          resultText = `## Suggested Tags\n\n${tags.map((tag: string) => `- ${tag}`).join('\n')}`
          setResult(resultText)
          toast.success('Tags suggested!')
          break
        case 'grammar':
          const grammarResult = await aiService.checkGrammar(noteContent)
          if (grammarResult.has_errors) {
            resultText = `## Grammar Corrections\n\n**Corrected Text:**\n${grammarResult.corrected_text}\n\n**Issues Found:**\n${grammarResult.suggestions.map((s: any, i: number) => 
              `${i + 1}. ${s.message || JSON.stringify(s)}`
            ).join('\n')}`
          } else {
            resultText = '## Grammar Check\n\nNo errors found! Your text looks great.'
          // ...existing code...
        }
      }
      setIsLoading(false);
    } catch (e) {
      setIsLoading(false);
      toast.error('An error occurred while generating AI output.');
      console.error(e);
    }
  }

  const handleReplaceContent = () => {
    if (result && onReplaceContent) {
      onReplaceContent(result)
      onClose()
      toast.success('Note content replaced!')
    }
  }

  // Render markdown to HTML for display
  const renderResultAsHTML = (text: string): string => {
    if (!text) return ''
    
    let html = text
    
    // Headers
    html = html.replace(/^### (.*$)/gim, '<h3 class="text-lg font-bold mt-4 mb-2">$1</h3>')
    html = html.replace(/^## (.*$)/gim, '<h2 class="text-xl font-bold mt-6 mb-3">$1</h2>')
    html = html.replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold mt-8 mb-4">$1</h1>')
    
    // Bold
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong class="font-bold">$1</strong>')
    
    // Italic
    html = html.replace(/\*(.+?)\*/g, '<em class="italic">$1</em>')
    
    // Highlight (yellow background)
    html = html.replace(/==(.+?)==/g, '<mark class="bg-yellow-200 dark:bg-yellow-500/30 px-1 rounded">$1</mark>')
    
    // Code inline
    html = html.replace(/`([^`]+)`/g, '<code class="bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded text-sm font-mono">$1</code>')
    
    // Line breaks
    html = html.replace(/\n/g, '<br />')
    
    return html
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col border border-gray-200/50 dark:border-gray-700/50">
        {/* Header */}
        <div className="flex items-center justify-between px-8 py-6 border-b border-gray-200/80 dark:border-gray-700/80 bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-900">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">AI Tools</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Transform your content with AI-powered features</p>
          </div>
          <button
            onClick={onClose}
            className="p-2.5 hover:bg-gray-200/60 dark:hover:bg-gray-700/60 rounded-xl transition-all"
          >
            <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
        </div>

        {/* Tabs - Grouped by Category */}
        <div className="px-8 py-6 border-b border-gray-200/80 dark:border-gray-700/80 space-y-4 bg-gray-50/50 dark:bg-gray-900/50">
          {/* Content Generation */}
          <div>
            <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-kit-green"></span>
              Content Generation
            </p>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => { setActiveTab('summarize'); setResult(''); }}
                className={`px-5 py-2.5 rounded-xl transition-all flex items-center gap-2.5 font-medium text-sm ${
                  activeTab === 'summarize'
                    ? 'bg-kit-green text-white shadow-lg shadow-kit-green/30 scale-105'
                    : 'bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-750 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300'
                }`}
              >
                <FileText className="w-4 h-4" />
                <span>Summarize</span>
              </button>
              <button
                onClick={() => { setActiveTab('outline'); setResult(''); }}
                className={`px-5 py-2.5 rounded-xl transition-all flex items-center gap-2.5 font-medium text-sm ${
                  activeTab === 'outline'
                    ? 'bg-kit-green text-white shadow-lg shadow-kit-green/30 scale-105'
                    : 'bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-750 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300'
                }`}
              >
                <List className="w-4 h-4" />
                <span>Outline</span>
              </button>
              <button
                onClick={() => { setActiveTab('format'); setResult(''); }}
                className={`px-5 py-2.5 rounded-xl transition-all flex items-center gap-2.5 font-medium text-sm ${
                  activeTab === 'format'
                    ? 'bg-kit-green text-white shadow-lg shadow-kit-green/30 scale-105'
                    : 'bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-750 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300'
                }`}
              >
                <Sparkles className="w-4 h-4" />
                <span>Format</span>
              </button>
              <button
                onClick={() => { setActiveTab('highlight'); setResult(''); }}
                className={`px-5 py-2.5 rounded-xl transition-all flex items-center gap-2.5 font-medium text-sm ${
                  activeTab === 'highlight'
                    ? 'bg-kit-green text-white shadow-lg shadow-kit-green/30 scale-105'
                    : 'bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-750 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300'
                }`}
              >
                <Highlighter className="w-4 h-4" />
                <span>Highlight</span>
              </button>
            </div>
          </div>

          {/* Study Tools */}
          <div>
            <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span>
              Study Tools
            </p>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => { setActiveTab('quiz'); setResult(''); }}
                className={`px-5 py-2.5 rounded-xl transition-all flex items-center gap-2.5 font-medium text-sm ${
                  activeTab === 'quiz'
                    ? 'bg-kit-green text-white shadow-lg shadow-kit-green/30 scale-105'
                    : 'bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-750 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300'
                }`}
              >
                <HelpCircle className="w-4 h-4" />
                <span>Quiz</span>
              </button>
              <button
                onClick={() => { setActiveTab('flashcards'); setResult(''); }}
                className={`px-5 py-2.5 rounded-xl transition-all flex items-center gap-2.5 font-medium text-sm ${
                  activeTab === 'flashcards'
                    ? 'bg-kit-green text-white shadow-lg shadow-kit-green/30 scale-105'
                    : 'bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-750 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300'
                }`}
              >
                <CreditCard className="w-4 h-4" />
                <span>Flashcards</span>
              </button>
            </div>
          </div>

          {/* Enhancement */}
          <div>
            <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
              Enhancement
            </p>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => { setActiveTab('grammar'); setResult(''); }}
                className={`px-5 py-2.5 rounded-xl transition-all flex items-center gap-2.5 font-medium text-sm ${
                  activeTab === 'grammar'
                    ? 'bg-kit-green text-white shadow-lg shadow-kit-green/30 scale-105'
                    : 'bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-750 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300'
                }`}
              >
                <CheckCircle className="w-4 h-4" />
                <span>Grammar</span>
              </button>
              <button
                onClick={() => { setActiveTab('tags'); setResult(''); }}
                className={`px-5 py-2.5 rounded-xl transition-all flex items-center gap-2.5 font-medium text-sm ${
                  activeTab === 'tags'
                    ? 'bg-kit-green text-white shadow-lg shadow-kit-green/30 scale-105'
                    : 'bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-750 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300'
                }`}
              >
                <Tag className="w-4 h-4" />
                <span>Tags</span>
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8">
          {/* Options for specific tools */}
          {activeTab === 'summarize' && (
            <div className="mb-6 bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700 shadow-sm">
              <label className="block text-sm font-bold mb-3 text-gray-700 dark:text-gray-300">
                Summary Style
              </label>
              <select
                value={summaryStyle}
                onChange={(e) => setSummaryStyle(e.target.value as any)}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:ring-2 focus:ring-kit-green focus:border-transparent transition-all"
              >
                <option value="comprehensive">📚 Comprehensive - Detailed overview</option>
                <option value="bullet">📋 Bullet Points - Quick highlights</option>
                <option value="exam">📝 Exam-Focused - Key facts for tests</option>
                <option value="beginner">👨‍🎓 Beginner-Friendly - Simple explanation</option>
                <option value="advanced">🎓 Advanced Review - Deep analysis</option>
                <option value="lecture">🎤 Lecture Cleanup - Transcript to notes</option>
              </select>
            </div>
          )}
          
          {activeTab === 'quiz' && (
            <div className="mb-6 bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700 shadow-sm">
              <label className="block text-sm font-bold mb-3 text-gray-700 dark:text-gray-300">
                Number of Questions
              </label>
              <input
                type="number"
                min="1"
                max="20"
                value={numQuestions}
                onChange={(e) => setNumQuestions(Number(e.target.value))}
                className="w-32 px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:ring-2 focus:ring-kit-green focus:border-transparent transition-all"
              />
            </div>
          )}

          {activeTab === 'flashcards' && (
            <div className="mb-6 bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700 shadow-sm">
              <label className="block text-sm font-bold mb-3 text-gray-700 dark:text-gray-300">
                Number of Cards
              </label>
              <input
                type="number"
                min="1"
                max="50"
                value={numCards}
                onChange={(e) => setNumCards(Number(e.target.value))}
                className="w-32 px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:ring-2 focus:ring-kit-green focus:border-transparent transition-all"
              />
            </div>
          )}

          {/* Result Display */}
          {result ? (
            <div className="bg-white dark:bg-gray-800 rounded-xl p-8 border border-gray-200 dark:border-gray-700 shadow-sm">
              <div 
                className="prose prose-sm dark:prose-invert max-w-none text-sm leading-relaxed text-gray-700 dark:text-gray-300"
                dangerouslySetInnerHTML={{ __html: renderResultAsHTML(result) }}
              />
            </div>
          ) : (
            <div className="flex items-center justify-center py-24">
              {isLoading ? (
                <div className="flex flex-col items-center gap-4">
                  <Loader2 className="w-12 h-12 animate-spin text-kit-green" />
                  <p className="text-gray-600 dark:text-gray-400 font-medium text-lg">Generating with AI...</p>
                  <p className="text-gray-400 dark:text-gray-500 text-sm">This may take a few moments</p>
                </div>
              ) : (
                <div className="text-center max-w-md">
                  <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-kit-green/20 to-kit-green/5 flex items-center justify-center">
                    <Bot className="w-10 h-10 text-kit-green" />
                  </div>
                  <p className="text-gray-500 dark:text-gray-400 text-lg mb-2">Ready to generate AI content</p>
                  <p className="text-gray-400 dark:text-gray-500 text-sm">Click <span className="font-semibold text-kit-green">"Generate"</span> below to start</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex flex-col gap-3 p-6 border-t border-gray-200/80 dark:border-gray-700/80 bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-900">
          {/* Generate Button - Full Width */}
          <button
            onClick={handleGenerate}
            disabled={isLoading || !noteContent.trim()}
            className="w-full py-4 px-6 bg-gradient-to-r from-kit-green to-emerald-600 hover:from-kit-green/90 hover:to-emerald-600/90 text-white rounded-xl font-bold text-base shadow-lg shadow-kit-green/30 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none transition-all transform hover:scale-[1.02] active:scale-[0.98]"
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-3">
                <Loader2 className="w-5 h-5 animate-spin" />
                Generating...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <Sparkles className="w-4 h-4" />
                Generate with AI
              </span>
            )}
          </button>
          
          {/* Action Buttons - Only show when result is available */}
          {result && (
            <div>
              {/* Special buttons for flashcards and quiz */}
              {activeTab === 'flashcards' && (
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <button
                    onClick={() => {
                      const flashcards = result
                        .split('**Card ')
                        .slice(1)
                        .map((card: string) => {
                          const frontMatch = card.match(/\*\*Front:\*\*\s*(.+?)(?=\n\*\*Back:\*\*)/s)
                          const backMatch = card.match(/\*\*Back:\*\*\s*(.+?)(?=\n|$)/s)
                          return {
                            front: frontMatch ? frontMatch[1].trim() : '',
                            back: backMatch ? backMatch[1].trim() : ''
                          }
                        })
                        .filter((card: any) => card.front && card.back)
                      
                      if (flashcards.length > 0) {
                        // Store in session to pass to next page
                        sessionStorage.setItem('generatedFlashcards', JSON.stringify(flashcards))
                        window.location.href = '/flashcards?save=true'
                      } else {
                        toast.error('Could not parse flashcards')
                      }
                    }}
                    className="py-3 px-4 bg-kit-green/20 hover:bg-kit-green/30 border-2 border-kit-green text-kit-green rounded-xl font-semibold text-sm transition-all flex flex-col items-center justify-center gap-1"
                    title="Save these flashcards to your deck"
                  >
                    <CreditCard className="w-5 h-5" />
                    <span>Save to Deck</span>
                  </button>
                  <button
                    onClick={handleInsert}
                    className="py-3 px-4 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-750 border-2 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-semibold text-sm transition-all flex flex-col items-center justify-center gap-1 hover:border-kit-green hover:text-kit-green"
                    title="Add to current note"
                  >
                    <Plus className="w-5 h-5" />
                    <span>Insert</span>
                  </button>
                </div>
              )}
              {activeTab === 'quiz' && (
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <button
                    onClick={() => {
                      const questions = result
                        .split(/^\*\*\d+\.\s+/m)
                        .slice(1)
                        .map((q: string) => {
                          const lines = q.split('\n').filter((l: string) => l.trim())
                          if (lines.length < 2) return null
                          
                          const question = lines[0]
                          const options: string[] = []
                          let correctAnswer = ''
                          let explanation = ''
                          
                          for (let line of lines.slice(1)) {
                            if (/^[A-D]\./.test(line)) {
                              options.push(line.replace(/^[A-D]\.\s*/, '').trim())
                            } else if (line.includes('Answer:')) {
                              correctAnswer = line.replace(/.*Answer:\s*/, '').trim()
                            } else if (line.includes('Explanation:')) {
                              explanation = line.replace(/.*Explanation:\s*/, '').trim()
                            }
                          }
                          
                          return { question, options, correct_answer: correctAnswer, explanation }
                        })
                        .filter((q: any) => q && q.question && q.options.length > 0)
                      
                      if (questions.length > 0) {
                        sessionStorage.setItem('generatedQuestions', JSON.stringify(questions))
                        window.location.href = '/quiz?save=true'
                      } else {
                        toast.error('Could not parse quiz questions')
                      }
                    }}
                    className="py-3 px-4 bg-kit-green/20 hover:bg-kit-green/30 border-2 border-kit-green text-kit-green rounded-xl font-semibold text-sm transition-all flex flex-col items-center justify-center gap-1"
                    title="Save this quiz"
                  >
                    <HelpCircle className="w-5 h-5" />
                    <span>Save Quiz</span>
                  </button>
                  <button
                    onClick={handleInsert}
                    className="py-3 px-4 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-750 border-2 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-semibold text-sm transition-all flex flex-col items-center justify-center gap-1 hover:border-kit-green hover:text-kit-green"
                    title="Add to current note"
                  >
                    <Plus className="w-5 h-5" />
                    <span>Insert</span>
                  </button>
                </div>
              )}
              
              {/* Regular buttons for other tools */}
              {activeTab !== 'flashcards' && activeTab !== 'quiz' && (
                <div className="grid grid-cols-3 gap-3 mb-3">
                  <button
                    onClick={handleInsert}
                    className="py-3 px-4 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-750 border-2 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-semibold text-sm transition-all flex flex-col items-center justify-center gap-1 hover:border-kit-green hover:text-kit-green"
                    title="Add generated content to the end of current note"
                  >
                    <Plus className="w-5 h-5" />
                    <span>Insert</span>
                  </button>
                  {onCreateNewNote && (
                    <button
                      onClick={handleCreateNewNote}
                      className="py-3 px-4 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-750 border-2 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-semibold text-sm transition-all flex flex-col items-center justify-center gap-1 hover:border-kit-green hover:text-kit-green"
                      title="Create a new note with this content"
                    >
                      <FileEdit className="w-5 h-5" />
                      <span>New Note</span>
                    </button>
                  )}
                  {onReplaceContent && (
                    <button
                      onClick={handleReplaceContent}
                      className="py-3 px-4 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-750 border-2 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-semibold text-sm transition-all flex flex-col items-center justify-center gap-1 hover:border-kit-green hover:text-kit-green"
                      title="Replace current note content with generated text"
                    >
                      <RefreshCw className="w-5 h-5" />
                      <span>Replace</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
          
          {/* Close Button */}
          <button
            onClick={onClose}
            className="w-full py-3 px-6 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-semibold text-sm transition-all border border-gray-200 dark:border-gray-700"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
