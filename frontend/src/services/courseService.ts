import api from './api'

export interface Course {
  id: number
  name: string
  code: string
  color: string
  icon: string
  description: string
  created_at: string
  note_count: number
}

export interface CourseCreate {
  name: string
  code: string
  color?: string
  icon?: string
  description?: string
}

export const courseService = {
  getAll: async (): Promise<Course[]> => {
    const response = await api.get('/api/courses/')
    return response.data
  },

  getById: async (id: number): Promise<Course> => {
    const response = await api.get(`/api/courses/${id}`)
    return response.data
  },

  create: async (data: CourseCreate): Promise<Course> => {
    const response = await api.post('/api/courses/', data)
    return response.data
  },

  update: async (id: number, data: Partial<CourseCreate>): Promise<Course> => {
    const response = await api.put(`/api/courses/${id}`, data)
    return response.data
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/api/courses/${id}`)
  },
}
