import api from './api'

export interface PomodoroSession {
  id: number
  duration: number
  completed: boolean
  created_at: string
}

export interface StudySession {
  date: string
  total_time: number
  note_count: number
  quiz_count: number
}

export interface UsageData {
  notes_created: number
  courses_created: number
  total_study_time: number
  quiz_attempts: number
}

export interface PomodoroCreate {
  duration: number
  completed: boolean
}

export const analyticsService = {
  createPomodoro: async (data: PomodoroCreate): Promise<PomodoroSession> => {
    const response = await api.post('/api/analytics/pomodoro', data)
    return response.data
  },

  getPomodoroSessions: async (): Promise<PomodoroSession[]> => {
    const response = await api.get('/api/analytics/pomodoro')
    return response.data
  },

  getStudySessions: async (days?: number): Promise<StudySession[]> => {
    const params = days ? { days } : {}
    const response = await api.get('/api/analytics/study-sessions', { params })
    return response.data
  },

  getUsageData: async (): Promise<UsageData> => {
    const response = await api.get('/api/analytics/usage-data')
    return response.data
  },

  getSummary: async (): Promise<any> => {
    const response = await api.get('/api/analytics/summary')
    return response.data
  },
}
