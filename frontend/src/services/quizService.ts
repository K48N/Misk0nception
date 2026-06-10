import api from './api'

export interface QuizQuestion {
  question: string
  options: string[]
  correct_answer: string
  explanation?: string
}

export interface SavedQuiz {
  id: number
  title: string
  course_id?: number
  note_ids: number[]
  questions: QuizQuestion[]
  created_at: string
  updated_at: string
}

export interface SavedQuizListItem {
  id: number
  title: string
  course_id?: number
  question_count: number
  created_at: string
}

export interface SavedQuizCreate {
  title: string
  course_id?: number
  note_ids: number[]
  questions: QuizQuestion[]
}

export interface QuizAttempt {
  id: number
  score: number
  total_questions: number
  time_taken: number
  created_at: string
}

export interface QuizStats {
  total_attempts: number
  average_score: number
  total_time: number
  best_score: number
}

export interface Achievement {
  id: string
  name: string
  description: string
  unlocked: boolean
  unlocked_at?: string
}

export interface QuizAttemptCreate {
  score: number
  total_questions: number
  time_taken: number
}

export const quizService = {
  // Saved Quizzes
  getSavedQuizzes: async (courseId?: number): Promise<SavedQuizListItem[]> => {
    const params = courseId ? { course_id: courseId } : {}
    const response = await api.get('/api/ai-quizzes/', { params })
    return response.data
  },

  getSavedQuizById: async (id: number): Promise<SavedQuiz> => {
    const response = await api.get(`/api/ai-quizzes/${id}`)
    return response.data
  },

  saveQuiz: async (data: SavedQuizCreate): Promise<SavedQuiz> => {
    const response = await api.post('/api/ai-quizzes/', data)
    return response.data
  },

  deleteSavedQuiz: async (id: number): Promise<void> => {
    await api.delete(`/api/ai-quizzes/${id}`)
  },

  // Quiz Attempts
  getAttempts: async (): Promise<QuizAttempt[]> => {
    const response = await api.get('/api/quiz/attempts')
    return response.data
  },

  createAttempt: async (data: QuizAttemptCreate): Promise<QuizAttempt> => {
    const response = await api.post('/api/quiz/attempts', data)
    return response.data
  },

  getStats: async (): Promise<QuizStats> => {
    const response = await api.get('/api/quiz/stats')
    return response.data
  },

  getAchievements: async (): Promise<Achievement[]> => {
    const response = await api.get('/api/quiz/achievements')
    return response.data
  },
}
