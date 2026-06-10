import { useEffect, useState, useRef } from 'react'
import AnimatedCounter from './AnimatedCounter'
import { X, Sparkles, MessageCircle, Loader2 } from 'lucide-react'
import { aiService } from '../services/aiService'
import toast from 'react-hot-toast'
import { withPersonality } from '../utils/aiPersonality'

interface IntelligentListeningProps {
  transcript: string
  recordingTime: number
  onClose: () => void
  isVisible?: boolean
  onQuestionGenerated?: (question: Question) => void
}

export interface Question {
  id: string
  text: string
  timestamp: number
  type?: 'question' | 'answer'
  relatedTo?: string
  dismissed?: boolean
}

export default function IntelligentListening({ 
  transcript, 
  recordingTime, 
  onClose, 
  isVisible = true,
  onQuestionGenerated 
}: IntelligentListeningProps) {
  const [questions, setQuestions] = useState<Question[]>([])
  const [answeredQuestions, setAnsweredQuestions] = useState<Question[]>([])  // Track answered questions
  const [dismissedQuestions, setDismissedQuestions] = useState<Question[]>([])  // Track dismissed questions
  const [isGenerating, setIsGenerating] = useState(false)
  const [isCheckingAnswers, setIsCheckingAnswers] = useState(false)
  const lastQuestionTimestamp = useRef(Date.now())
  const lastTranscriptLength = useRef(0)
  const lastAnalyzedTranscript = useRef('')  // Track what we last analyzed for questions
  const lastAnswerCheckLength = useRef(0)  // Track when we last checked for answers
  
  // Detect language from transcript
  const detectLanguage = (text: string): 'en' | 'de' => {
    // Simple heuristic: check for common German words
    const germanWords = /\b(und|der|die|das|ist|sind|war|waren|hat|haben|wird|werden|kann|können|mit|auf|für|von|zu|im|am|ein|eine|einen|dem|den|dieser|diese|dieses|nicht|auch|aber|oder|als|wenn|wie|nur|noch|mehr|sehr|schon|jetzt|hier|da|so|was|wer|wo|warum|wieso)\b/gi
    const germanMatches = (text.match(germanWords) || []).length
    const wordCount = text.split(/\s+/).length
    
    // If more than 20% of words are common German words, assume German
    return germanMatches / wordCount > 0.2 ? 'de' : 'en'
  }
  
  // Dismiss a question or answer
  const dismissQuestion = (questionId: string) => {
    const question = questions.find(q => q.id === questionId)
    if (question) {
      setDismissedQuestions(prev => [...prev, { ...question, dismissed: true }])
      setQuestions(prev => prev.filter(q => q.id !== questionId))
      toast.success(question.type === 'answer' ? 'Answer dismissed' : 'Question dismissed', {
        duration: 2000,
        position: 'bottom-right',
      })
    }
  }
  
  // Detect if lecturer is asking for questions from the audience
  const detectLecturerAskingForQuestions = (text: string): boolean => {
    const recentText = text.slice(-300).toLowerCase()
    
    const patterns = [
      // English
      /\b(any|do\s+you\s+have|are\s+there|does\s+anyone\s+have)\s+(any\s+)?(questions|question)\??/i,
      /\b(questions|question)\s*\??$/i,  // Ending with "questions?"
      /\bfeel\s+free\s+to\s+ask/i,
      /\bif\s+you\s+have\s+(any\s+)?questions/i,
      /\bany\s+doubts/i,
      /\bwhat\s+would\s+you\s+like\s+to\s+know/i,
      
      // German
      /\b(gibt\s+es|habt\s+ihr|haben\s+sie|hat\s+jemand)\s+(noch\s+)?(fragen|eine\s+frage)\??/i,
      /\b(fragen|frage)\s*\??$/i,  // Ending with "Fragen?"
      /\b(irgendwelche|noch)\s+fragen/i,
      /\bwas\s+(möchtet|möchten|wollt|wollen)\s+(ihr|sie)\s+(noch\s+)?wissen/i,
      /\bunklarheiten/i,
    ]
    
    return patterns.some(pattern => pattern.test(recentText))
  }
  
  // Advanced question detection with semantic understanding
  const detectUserQuestion = (text: string): string | null => {
    // First, look for sentences ending with question marks
    const questionsWithMarks = text.slice(-600).match(/[^.!?\n]+\?/g) || []
    
    // If we found question marks, analyze those
    for (const potentialQuestion of questionsWithMarks) {
      const cleaned = potentialQuestion.trim()
      if (cleaned.length < 10 || cleaned.length > 200) continue
      
      // Smart filtering without AI: check if it's meaningful
      const lowerCleaned = cleaned.toLowerCase()
      
      // Skip rhetorical/filler questions
      const rhetoricalPatterns = [
        /^(nicht wahr|right|oder|or)\?$/i,
        /^(ja|yes|nein|no)\?$/i,
        /^(okay|ok)\?$/i,
      ]
      
      if (rhetoricalPatterns.some(p => p.test(cleaned))) continue
      
      // Must contain actual question words or be factual query
      const hasQuestionIndicators = 
        // Question words
        /\b(was|wie|wer|wo|wann|warum|wieso|weshalb|welche[rs]?|what|why|how|who|where|when|which)\b/i.test(lowerCleaned) ||
        // Or is asking for ideas/answers
        /\b(idee|idea|antwort|answer|meinung|opinion|gedanke|thought)\b/i.test(lowerCleaned) ||
        // Or is arithmetic
        /\d+\s*(plus|\+|minus|-|mal|\*|times|geteilt|divided|\/)\s*\d+/i.test(lowerCleaned)
      
      if (hasQuestionIndicators) {
        return cleaned
      }
    }
    
    // Fallback to pattern matching for questions without marks
    const questionPatterns = [
      // Simple arithmetic: "Was ist 7 plus 2", "What is 5 + 3"
      /\b(what|was)\s+(is|ist)\s+(\d+|\w+)\s*(plus|\+|minus|-|times|mal|\*|divided|geteilt|\/)\s*(\d+|\w+)/i,
      
      // Direct factual questions: "Wie lang ist der Äquator"
      /\b(wie\s+lang|wie\s+groß|wie\s+viel|how\s+long|how\s+big|how\s+much|how\s+many)\s+(ist|is|sind|are)\s+.{5,}/i,
      
      // Lecturer to audience: "Hat jemand eine Idee"
      /\b(hat|has|does)\s+(jemand|irgendwer|anyone|anybody|someone)\s+(eine\s+)?(idee|ahnung|idea|know)\b/i,
    ]
    
    const sentences = text.slice(-400).split(/[.!?\n]+/).filter(s => s.trim().length > 5)
    
    for (const pattern of questionPatterns) {
      const match = text.slice(-400).match(pattern)
      if (match) {
        for (const sentence of sentences) {
          if (pattern.test(sentence) && sentence.length >= 10) {
            return sentence.trim() + '?'
          }
        }
      }
    }
    
    return null
  }
  
  // Check if recent content answers any pending questions
  const checkIfQuestionAnswered = async (question: Question, newContent: string): Promise<boolean> => {
    if (question.type !== 'question') return false
    
    try {
      // Use AI to determine if the new content answers the question
      const checkPrompt = `Question: "${question.text}"

Recent lecture content: "${newContent}"

Has this question been directly answered or addressed in the recent content? Reply with ONLY "YES" or "NO".`
      
      const response = await aiService.chat(checkPrompt)
      const answered = response.trim().toUpperCase().startsWith('YES')
      
      if (answered) {
        console.log(`✅ Question answered: "${question.text}"`)
      }
      
      return answered
    } catch (error) {
      console.error('Error checking if question answered:', error)
      return false
    }
  }
  
  // Analyze transcript for content density and topics
  const analyzeContent = (text: string): { density: 'low' | 'medium' | 'high', topics: string[] } => {
    const words = text.split(/\s+/).filter(w => w.length > 3)
    const uniqueWords = new Set(words.map(w => w.toLowerCase()))
    const density = uniqueWords.size / Math.max(words.length, 1)
    
    // Extract potential topics (capitalized words, repeated terms)
    const wordFreq: { [key: string]: number } = {}
    words.forEach(word => {
      const lower = word.toLowerCase()
      if (lower.length > 4) {
        wordFreq[lower] = (wordFreq[lower] || 0) + 1
      }
    })
    
    const topics = Object.entries(wordFreq)
      .filter(([_, count]) => count >= 2)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([word]) => word)
    
    return {
      density: density > 0.7 ? 'high' : density > 0.4 ? 'medium' : 'low',
      topics
    }
  }
  
  // Generate questions intelligently (not spammy)
  useEffect(() => {
    const generateQuestion = async () => {
      const now = Date.now()
      const timeSinceLastQuestion = (now - lastQuestionTimestamp.current) / 1000
      
      console.log('🤔 Question check:', {
        transcriptLength: transcript.length,
        timeSinceLastQuestion: timeSinceLastQuestion.toFixed(1) + 's',
        isGenerating,
        lastTranscriptLength: lastTranscriptLength.current
      })
      
      // Don't generate if already generating
      if (isGenerating) {
        console.log('⏭️ Skip: Already generating')
        return
      }
      
      // Need at least 100 chars of transcript
      if (transcript.length < 100) {
        console.log('⏭️ Skip: Transcript too short (<100 chars)')
        return
      }
      
      // Check if lecturer is asking for questions - generate thoughtful questions immediately!
      const lecturerAskingForQuestions = detectLecturerAskingForQuestions(transcript)
      if (lecturerAskingForQuestions && transcript !== lastAnalyzedTranscript.current) {
        console.log('🎓 Lecturer asking for questions - generating unanswered questions!')
        setIsGenerating(true)
        lastAnalyzedTranscript.current = transcript
        
        try {
          const language = detectLanguage(transcript)
          const languageInstruction = language === 'de'
            ? 'Stelle die Fragen auf Deutsch.'
            : 'Ask the questions in English.'
          
          const prompt = withPersonality(
            `${languageInstruction} The lecturer just asked if there are any questions. Based on this lecture content, generate 2-3 important questions that students might have but haven't asked yet:

Lecture content: "${transcript.slice(-800)}"

Generate questions that:
- Address key concepts that might need clarification
- Are specific and relevant to the content
- Would genuinely help students understand better
- Are concise (10-15 words each)

Format: Just list the questions, one per line, no numbering.`
          )
          
          const response = await aiService.chat(prompt)
          
          if (response && response.trim().length > 0) {
            const generatedQuestions = response.trim().split('\n').filter(q => q.trim().length > 10)
            
            for (const questionText of generatedQuestions.slice(0, 3)) {
              const cleanQuestion = questionText.trim().replace(/^[-•\d.)\s]+/, '').replace(/^["']|["']$/g, '')
              
              // Check if similar question already exists
              const normalizedNewQuestion = cleanQuestion.toLowerCase().trim().replace(/[?.!]/g, '')
              const isDuplicate = [...questions, ...answeredQuestions, ...dismissedQuestions].some(q => {
                const normalizedExisting = q.text.toLowerCase().trim().replace(/[?.!]/g, '')
                if (normalizedNewQuestion.length < 15 || normalizedExisting.length < 15) return false
                return normalizedNewQuestion.includes(normalizedExisting.slice(0, 15)) || 
                       normalizedExisting.includes(normalizedNewQuestion.slice(0, 15))
              })
              
              if (!isDuplicate) {
                const newQuestion: Question = {
                  id: `q-${Date.now()}-${Math.random()}`,
                  text: cleanQuestion,
                  timestamp: recordingTime,
                  type: 'question'
                }
                
                setQuestions(prev => [...prev, newQuestion])
                
                if (onQuestionGenerated) {
                  onQuestionGenerated(newQuestion)
                }
              }
            }
            
            lastQuestionTimestamp.current = now
            lastTranscriptLength.current = transcript.length
            
            if (!isVisible && generatedQuestions.length > 0) {
              toast((t) => (
                <div 
                  onClick={() => {
                    toast.dismiss(t.id)
                    onClose()
                  }}
                  className="cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-purple-500" />
                    <div>
                      <p className="font-medium text-sm">💭 K0npanion generated {generatedQuestions.length} questions</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Click to view all</p>
                    </div>
                  </div>
                </div>
              ), {
                duration: 6000,
                position: 'bottom-right',
                style: {
                  background: 'linear-gradient(to right, rgb(168, 85, 247), rgb(236, 72, 153))',
                  color: 'white',
                  padding: '12px',
                  borderRadius: '8px',
                }
              })
            }
          }
        } catch (error) {
          console.error('❌ Failed to generate questions:', error)
        } finally {
          setIsGenerating(false)
        }
        return // Skip regular generation after handling this
      }
      
      // Check if user asked a question - answer immediately!
      const userQuestion = detectUserQuestion(transcript)
      if (userQuestion && transcript !== lastAnalyzedTranscript.current) {
        console.log('❓ Question detected:', userQuestion)
        
        // Check if this question was already answered
        const normalizedQuestion = userQuestion.toLowerCase().trim().replace(/[?.!]/g, '')
        const alreadyAnswered = [...questions, ...answeredQuestions, ...dismissedQuestions].some(q => {
          if (q.type !== 'answer') return false
          const normalizedExisting = q.text.toLowerCase().trim().replace(/[?.!]/g, '')
          // Check if questions are very similar (allowing for minor variations)
          return normalizedQuestion.includes(normalizedExisting.slice(0, 15)) || 
                 normalizedExisting.includes(normalizedQuestion.slice(0, 15))
        })
        
        // Also check if the question text itself appears in our history
        const questionAlreadyAsked = [...questions, ...answeredQuestions, ...dismissedQuestions].some(q => {
          const normalizedExisting = q.text.toLowerCase().trim().replace(/[?.!]/g, '')
          return normalizedQuestion === normalizedExisting ||
                 (normalizedQuestion.length > 10 && normalizedExisting.length > 10 &&
                  (normalizedQuestion.includes(normalizedExisting) || normalizedExisting.includes(normalizedQuestion)))
        })
        
        if (alreadyAnswered || questionAlreadyAsked) {
          console.log('⏭️ Skip: Question already answered or asked before')
          lastAnalyzedTranscript.current = transcript
          
          // Show a subtle toast to let user know we're not ignoring them
          toast('✓ Already answered this question!', {
            duration: 2000,
            position: 'bottom-right',
            icon: '💡',
            style: {
              background: 'rgba(34, 197, 94, 0.9)',
              color: 'white',
              fontSize: '14px',
              padding: '8px 12px',
              borderRadius: '8px',
            }
          })
          return
        }
        
        setIsGenerating(true)
        lastAnalyzedTranscript.current = transcript
        
        try {
          // Detect language and respond in the same language
          const language = detectLanguage(transcript)
          const languageInstruction = language === 'de' 
            ? 'Antworte auf Deutsch.' 
            : 'Answer in English.'
          
          // Determine if we need web search or can answer from context
          const lectureContext = transcript.slice(-1000)
          const needsWebSearch = lectureContext.length < 200 || 
                                 !lectureContext.toLowerCase().includes(userQuestion.toLowerCase().split(' ')[0])
          
          let answerPrompt
          if (needsWebSearch) {
            // Use AI's knowledge + tie back to context
            answerPrompt = withPersonality(
              `${languageInstruction} A question was asked in the lecture: "${userQuestion}"
              
Lecture context (if relevant): "${lectureContext}"

Provide a clear, accurate answer that:
1. Directly answers the question using your knowledge (be factual and precise)
2. Ties back to the lecture context if relevant
3. Is concise but complete (2-4 sentences)
4. Uses simple, educational language

For factual questions (like math, geography, science), give the exact answer first.

Answer:`
            )
          } else {
            // Answer primarily from lecture context
            answerPrompt = withPersonality(
              `${languageInstruction} Based on the lecture: "${lectureContext}"

Question asked: "${userQuestion}"

Provide a helpful answer that:
1. Uses information from the lecture transcript above
2. Supplements with additional context if needed
3. Is concise (2-4 sentences)
4. Helps understand the topic better

Answer:`
            )
          }
          
          const answer = await aiService.chat(answerPrompt)
          
          if (answer && answer.trim().length > 0) {
            const newAnswer: Question = {
              id: `a-${Date.now()}`,
              text: answer.trim(),
              timestamp: recordingTime,
              type: 'answer'
            }
            
            console.log('✨ Answer generated:', answer.trim())
            setQuestions(prev => [...prev, newAnswer])
            lastQuestionTimestamp.current = now
            lastTranscriptLength.current = transcript.length
            
            if (onQuestionGenerated) {
              onQuestionGenerated(newAnswer)
            }
            
            if (!isVisible) {
              toast((t) => (
                <div 
                  onClick={() => {
                    toast.dismiss(t.id)
                    onClose()
                  }}
                  className="cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-green-500" />
                    <div>
                      <p className="font-medium text-sm">💡 K0npanion answered your question</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{answer.trim().slice(0, 80)}...</p>
                      <p className="text-xs text-green-600 dark:text-green-400 mt-1">Click to view</p>
                    </div>
                  </div>
                </div>
              ), {
                duration: 8000,
                position: 'bottom-right',
                style: {
                  background: 'linear-gradient(to right, rgb(34, 197, 94), rgb(59, 130, 246))',
                  color: 'white',
                  padding: '12px',
                  borderRadius: '8px',
                }
              })
            }
          }
        } catch (error) {
          console.error('❌ Failed to answer question:', error)
        } finally {
          setIsGenerating(false)
        }
        return // Skip regular question generation
      }
      
      // Analyze content to determine if it's worth asking a question
      const { density, topics } = analyzeContent(transcript.slice(lastTranscriptLength.current))
      const newContentLength = transcript.length - lastTranscriptLength.current
      
      // Dynamic timing based on content density (more conservative to save tokens)
      const minTimeBetweenQuestions = density === 'high' ? 25 : density === 'medium' ? 35 : 50
      
      console.log('📊 Content analysis:', { density, topics, minTimeBetweenQuestions })
      
      // Wait appropriate time between questions based on content
      if (timeSinceLastQuestion < minTimeBetweenQuestions) {
        console.log(`⏭️ Skip: Too soon since last question (<${minTimeBetweenQuestions}s)`)
        return
      }
      
      // Need enough new content (varies by density) - lower thresholds for faster response
      const minNewContent = density === 'high' ? 60 : density === 'medium' ? 80 : 120
      if (newContentLength < minNewContent) {
        console.log(`⏭️ Skip: Not enough new content (<${minNewContent} chars)`)
        return
      }
      
      console.log('✅ Generating contextual question...')
      setIsGenerating(true)
      lastAnalyzedTranscript.current = transcript
      
      try {
        // Detect language and generate question in the same language
        const language = detectLanguage(transcript)
        const languageInstruction = language === 'de'
          ? 'Stelle die Frage auf Deutsch.'
          : 'Ask the question in English.'
        
        // Generate high-quality, thought-provoking questions
        const topicsContext = topics.length > 0 ? ` Key topics: ${topics.join(', ')}.` : ''
        const basePrompt = `${languageInstruction} You are an intelligent study assistant analyzing a lecture in real-time. Generate ONE highly specific, insightful question that:

✓ Addresses a CONCRETE concept or mechanism (not vague "why" questions)
✓ Asks HOW something works, WHAT the relationship is, or WHEN/WHERE it applies
✓ Is specific enough that it couldn't apply to any other topic
✓ Tests understanding of a particular detail or process
✓ Encourages analytical thinking about the material
✓ Is concise (10-15 words maximum)

✗ AVOID generic questions like "Warum ist das wichtig?" or "Why is this important?"
✗ AVOID vague "why" questions without specific context
✗ NO statements, observations, or comments
✗ NO yes/no questions unless they require explanation${topicsContext}

Lecture excerpt: "${transcript.slice(-600)}"

Generate ONE specific, detailed question that addresses a concrete aspect of the content:`
        
        const prompt = withPersonality(basePrompt)
        const question = await aiService.chat(prompt)
        
        if (question && question.trim().length > 0) {
          const cleanQuestion = question.trim().replace(/^["']|["']$/g, '') // Remove quotes
          
          // Check if similar question already exists
          const normalizedNewQuestion = cleanQuestion.toLowerCase().trim().replace(/[?.!]/g, '')
          const isDuplicate = [...questions, ...answeredQuestions, ...dismissedQuestions].some(q => {
            const normalizedExisting = q.text.toLowerCase().trim().replace(/[?.!]/g, '')
            // Check for very similar questions (at least 60% overlap)
            if (normalizedNewQuestion.length < 15 || normalizedExisting.length < 15) return false
            return normalizedNewQuestion.includes(normalizedExisting.slice(0, 15)) || 
                   normalizedExisting.includes(normalizedNewQuestion.slice(0, 15)) ||
                   normalizedNewQuestion === normalizedExisting
          })
          
          if (isDuplicate) {
            console.log('⏭️ Skip: Similar question already exists')
            lastTranscriptLength.current = transcript.length
            return
          }
          
          const newQuestion: Question = {
            id: `q-${Date.now()}`,
            text: cleanQuestion,
            timestamp: recordingTime,
            type: 'question'
          }
          
          console.log('✨ Question generated:', cleanQuestion)
          setQuestions(prev => [...prev, newQuestion])
          lastQuestionTimestamp.current = now
          lastTranscriptLength.current = transcript.length
          
          if (onQuestionGenerated) {
            onQuestionGenerated(newQuestion)
          }
          
          if (!isVisible) {
            toast((t) => (
              <div 
                onClick={() => {
                  toast.dismiss(t.id)
                  onClose()
                }}
                className="cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-500" />
                  <div>
                    <p className="font-medium text-sm">💭 New Question from K0npanion</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{cleanQuestion}</p>
                    <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">Click to view all questions</p>
                  </div>
                </div>
              </div>
            ), {
              duration: 8000,
              position: 'bottom-right',
              style: {
                background: 'linear-gradient(to right, rgb(168, 85, 247), rgb(236, 72, 153))',
                color: 'white',
                padding: '12px',
                borderRadius: '8px',
              }
            })
          }
        }
      } catch (error) {
        console.error('❌ Failed to generate question:', error)
      } finally {
        setIsGenerating(false)
      }
    }
    
    // Check every 5 seconds (balanced - not too aggressive on API)
    const interval = setInterval(generateQuestion, 5000)
    
    // Also check immediately when transcript updates significantly
    if (transcript.length - lastTranscriptLength.current >= 100) {
      generateQuestion()
    }
    
    return () => clearInterval(interval)
  }, [transcript, recordingTime, isGenerating, isVisible, onClose, onQuestionGenerated])
  
  // Periodically check if pending questions have been answered
  useEffect(() => {
    const checkForAnsweredQuestions = async () => {
      // Only check if we have pending questions and enough new content
      const pendingQuestions = questions.filter(q => q.type === 'question')
      if (pendingQuestions.length === 0 || isCheckingAnswers || isGenerating) {
        return
      }
      
      const newContentLength = transcript.length - lastAnswerCheckLength.current
      if (newContentLength < 150) {
        return // Not enough new content to check
      }
      
      console.log('🔍 Checking if questions have been answered...')
      setIsCheckingAnswers(true)
      
      try {
        const newContent = transcript.slice(lastAnswerCheckLength.current)
        const questionIds: string[] = []
        
        // Check each pending question
        for (const question of pendingQuestions) {
          const isAnswered = await checkIfQuestionAnswered(question, newContent)
          if (isAnswered) {
            questionIds.push(question.id)
            
            // Move to answered list with note
            const answeredQuestion: Question = {
              ...question,
              text: `✓ ${question.text} (Answered by lecture content)`,
              type: 'answer'
            }
            
            setAnsweredQuestions(prev => [...prev, answeredQuestion])
          }
        }
        
        // Remove answered questions from active list
        if (questionIds.length > 0) {
          setQuestions(prev => prev.filter(q => !questionIds.includes(q.id)))
          
          toast.success(
            `✓ ${questionIds.length} question${questionIds.length > 1 ? 's' : ''} answered by lecture content!`,
            {
              duration: 4000,
              position: 'bottom-right',
            }
          )
        }
        
        lastAnswerCheckLength.current = transcript.length
      } catch (error) {
        console.error('Error checking for answered questions:', error)
      } finally {
        setIsCheckingAnswers(false)
      }
    }
    
    // Check every 20 seconds for answered questions (less aggressive to save tokens)
    const interval = setInterval(checkForAnsweredQuestions, 20000)
    
    // Also check when significant new content appears
    if (transcript.length - lastAnswerCheckLength.current >= 150) {
      checkForAnsweredQuestions()
    }
    
    return () => clearInterval(interval)
  }, [transcript, questions, isCheckingAnswers, isGenerating])
  
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }
  
  // If not visible, just run the question generation in background (no UI)
  if (!isVisible) {
    return null
  }
  
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-5xl h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                KITelligent Listening
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Live transcription with intelligent questioning · {formatTime(recordingTime)}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-gray-600 dark:text-gray-400" />
          </button>
        </div>
        
        {/* Content Grid */}
        <div className="flex-1 grid grid-cols-3 gap-4 p-6 overflow-hidden">
          {/* Transcript Column (2/3 width) */}
          <div className="col-span-2 flex flex-col">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Live Transcript
              </h3>
            </div>
            <div className="flex-1 bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4 overflow-y-auto border border-gray-200 dark:border-gray-700">
              {transcript ? (
                <p className="text-gray-800 dark:text-gray-200 leading-relaxed whitespace-pre-wrap">
                  {transcript}
                </p>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400 dark:text-gray-600">
                  <div className="text-center">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
                    <p>Listening...</p>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Questions Column (1/3 width) */}
          <div className="flex flex-col h-full">
            <div className="flex items-center gap-2 mb-3">
              <MessageCircle className="w-5 h-5 text-purple-500" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Active Questions ({questions.filter(q => q.type === 'question').length})
              </h3>
            </div>
            <div className="flex-1 flex flex-col bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
              {questions.length === 0 && !isGenerating && (
                <div className="flex items-center justify-center h-full text-gray-400 dark:text-gray-600 text-center text-sm p-4">
                  <p>K0npanion will ask thoughtful questions as you speak...</p>
                </div>
              )}
              
              <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                <div className="space-y-3">
                {questions.map((question, index) => (
                  <div
                    key={question.id}
                    className={`group relative rounded-lg p-3 shadow-sm border animate-fade-in transition-all cursor-pointer hover:shadow-md ${
                      question.type === 'answer'
                        ? 'bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700 hover:border-green-500 dark:hover:border-green-500'
                        : 'bg-white dark:bg-gray-800 border-purple-200 dark:border-purple-800 hover:border-purple-400 dark:hover:border-purple-600'
                    }`}
                    style={{ animationDelay: `${index * 0.1}s` }}
                    onClick={() => dismissQuestion(question.id)}
                    title={`Click to dismiss this ${question.type === 'answer' ? 'answer' : 'question'}`}
                  >
                    <div className="flex items-start gap-2">
                      <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold ${
                        question.type === 'answer'
                          ? 'bg-gradient-to-br from-green-500 to-blue-500'
                          : 'bg-gradient-to-br from-purple-500 to-pink-500'
                      }`}>
                        {question.type === 'answer' ? '💡' : (index + 1 - questions.filter(q => q.type === 'answer').length)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-1 mb-1">
                          <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">
                            {question.type === 'answer' ? 'K0npanion Answered:' : `Question ${index + 1 - questions.filter((q, i) => i < index && q.type === 'answer').length}:`}
                          </span>
                          <span className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity text-xs text-red-500 dark:text-red-400">
                            Click to dismiss
                          </span>
                        </div>
                        <p className="text-sm text-gray-800 dark:text-gray-200 font-medium">
                          {question.text}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {formatTime(question.timestamp)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
                
                {isGenerating && (
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-3 shadow-sm border border-purple-200 dark:border-purple-800 animate-pulse">
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 text-purple-500 animate-spin" />
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        K0npanion is thinking...
                      </p>
                    </div>
                  </div>
                )}
                
                {isCheckingAnswers && (
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 shadow-sm border border-blue-200 dark:border-blue-800 animate-pulse">
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Checking if questions were answered...
                      </p>
                    </div>
                  </div>
                )}
                </div>
              </div>
              
              {/* Answered Questions Section */}
              {answeredQuestions.length > 0 && (
                <div className="mt-4 pt-4 border-t border-purple-200 dark:border-purple-800">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="text-xs font-semibold text-green-600 dark:text-green-400 uppercase tracking-wide flex items-center gap-1">
                      ✓ Answered (<AnimatedCounter value={answeredQuestions.length} duration={700} />)
                    </div>
                  </div>
                  <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
                    {answeredQuestions.map((question) => (
                      <div
                        key={question.id}
                        className="bg-green-50 dark:bg-green-900/10 rounded-lg p-2 shadow-sm border border-green-200 dark:border-green-800 opacity-75"
                      >
                        <p className="text-xs text-gray-700 dark:text-gray-300 line-through">
                          {question.text.replace('✓ ', '').replace(' (Answered by lecture content)', '')}
                        </p>
                        <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                          {formatTime(question.timestamp)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Dismissed Questions Section */}
              {dismissedQuestions.length > 0 && (
                <div className="mt-4 pt-4 border-t border-purple-200 dark:border-purple-800">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                      ✕ Dismissed ({dismissedQuestions.length})
                    </div>
                  </div>
                  <div className="space-y-2 max-h-32 overflow-y-auto custom-scrollbar">
                    {dismissedQuestions.map((question) => (
                      <div
                        key={question.id}
                        className="bg-gray-100 dark:bg-gray-800/50 rounded-lg p-2 shadow-sm border border-gray-300 dark:border-gray-700 opacity-50"
                      >
                        <p className="text-xs text-gray-600 dark:text-gray-400 line-through">
                          {question.text}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                          {formatTime(question.timestamp)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Footer Info */}
        <div className="px-6 py-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
          <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
            💡 <strong>Ultra-Smart K0npanion:</strong> Smart question detection (question marks + context) • Generates deep questions • Token-efficient • Never repeats • Scrollable sections
          </p>
        </div>
      </div>
      
      <style>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fade-in {
          animation: fade-in 0.3s ease-out forwards;
        }
        
        /* Custom scrollbar styles */
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.05);
          border-radius: 4px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(168, 85, 247, 0.3);
          border-radius: 4px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(168, 85, 247, 0.5);
        }
        
        /* Dark mode scrollbar */
        .dark .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
        }
        
        .dark .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(168, 85, 247, 0.4);
        }
        
        .dark .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(168, 85, 247, 0.6);
        }
      `}</style>
    </div>
  )
}
