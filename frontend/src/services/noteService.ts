import api from './api'

export interface Note {
  id: number
  title: string
  content: string
  course_id: number
  created_at: string
  updated_at: string
  tags: Array<{
    id: number
    name: string
    color: string
  }>
  attachment_count: number
}

export interface NoteCreate {
  title: string
  content: string
  course_id: number
  tag_ids?: number[]
}

export const noteService = {
  getAll: async (courseId?: number): Promise<Note[]> => {
    const params = courseId ? { course_id: courseId } : {}
    const response = await api.get('/api/notes/', { params })
    return response.data
  },

  getById: async (id: number): Promise<Note> => {
    const response = await api.get(`/api/notes/${id}`)
    return response.data
  },

  create: async (data: NoteCreate): Promise<Note> => {
    const response = await api.post('/api/notes/', data)
    return response.data
  },

  update: async (id: number, data: Partial<NoteCreate>): Promise<Note> => {
    const response = await api.put(`/api/notes/${id}`, data)
    return response.data
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/api/notes/${id}`)
  },

  getRelated: async (id: number): Promise<Note[]> => {
    const response = await api.get(`/api/notes/${id}/related`)
    return response.data
  },
}
