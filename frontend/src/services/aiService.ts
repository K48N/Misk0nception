import api from './api'

export interface AISummaryRequest {
  text: string
}

export interface AIQuizRequest {
  text: string
  num_questions?: number
}

export interface AIFlashcardsRequest {
  text: string
  num_cards?: number
}

export interface AIOutlineRequest {
  text: string
}

export interface AITagsRequest {
  text: string
}

export interface AIChatRequest {
  message: string
  context?: string
}

export interface AIResponse {
  result: string
  [key: string]: any
}

export const aiService = {
  checkStatus: async (): Promise<{ available: boolean; provider: string; message: string }> => {
    const response = await api.get('/api/ai/status')
    return response.data
  },

  summarize: async (text: string): Promise<string> => {
    const response = await api.post('/api/ai/summarize', { text })
    return response.data.summary
  },

  summarizeWithStyle: async (text: string, style: string): Promise<string> => {
    const response = await api.post('/api/ai/summarize', { text, style })
    return response.data.summary
  },

  smartFormat: async (text: string): Promise<string> => {
    const response = await api.post('/api/ai/format', { text })
    return response.data.formatted_text
  },

  highlightConcepts: async (text: string): Promise<string> => {
    const response = await api.post('/api/ai/highlight', { text })
    return response.data.highlighted_text
  },

  generateQuiz: async (text: string, numQuestions: number = 5): Promise<any[]> => {
    const response = await api.post('/api/ai/quiz', { text, num_questions: numQuestions })
    return response.data.questions
  },

  generateFlashcards: async (text: string, numCards: number = 10): Promise<any[]> => {
    const response = await api.post('/api/ai/flashcards', { text, num_cards: numCards })
    return response.data.flashcards
  },

  generateOutline: async (text: string): Promise<string> => {
    const response = await api.post('/api/ai/outline', { text })
    return response.data.outline
  },

  suggestTags: async (text: string): Promise<string[]> => {
    const response = await api.post('/api/ai/tags', { text })
    return response.data.tags
  },

  chat: async (message: string, context?: string): Promise<string> => {
    const response = await api.post('/api/ai/chat', { message, context })
    return response.data.response
  },

  checkGrammar: async (text: string): Promise<{ corrected_text: string; suggestions: any[]; has_errors: boolean }> => {
    const response = await api.post('/api/ai/grammar', { text })
    return response.data
  },

  transcribeAudio: async (audioFile: File): Promise<string> => {
    console.log('📤 Sending audio to transcription API:', audioFile.name, audioFile.size, 'bytes')
    
    const formData = new FormData()
    formData.append('file', audioFile)
    
    const response = await api.post('/api/ai/transcribe', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    
    console.log('📥 Transcription API response:', response.data)
    return response.data.transcript
  },
}
