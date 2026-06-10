import api from './api'

export interface SearchResult {
  type: 'note' | 'course'
  id: number
  title: string
  content?: string
  course_name?: string
  course_id?: number
  relevance: number
}

export const searchService = {
  searchNotes: async (query: string): Promise<SearchResult[]> => {
    const response = await api.get('/api/search/notes', { params: { q: query } })
    return response.data
  },

  searchCourses: async (query: string): Promise<SearchResult[]> => {
    const response = await api.get('/api/search/courses', { params: { q: query } })
    return response.data
  },

  searchAll: async (query: string): Promise<SearchResult[]> => {
    const response = await api.get('/api/search/all', { params: { q: query } })
    return response.data
  },
}
