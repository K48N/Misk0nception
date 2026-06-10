import api from './api'

export interface Tag {
  id: number
  name: string
  color: string
  icon?: string
}

export interface TagCreate {
  name: string
  color?: string
  icon?: string
}

export const tagService = {
  getAll: async (): Promise<Tag[]> => {
    const response = await api.get('/api/tags/')
    return response.data
  },

  getById: async (id: number): Promise<Tag> => {
    const response = await api.get(`/api/tags/${id}`)
    return response.data
  },

  create: async (data: TagCreate): Promise<Tag> => {
    const response = await api.post('/api/tags/', data)
    return response.data
  },

  update: async (id: number, data: Partial<TagCreate>): Promise<Tag> => {
    const response = await api.put(`/api/tags/${id}`, data)
    return response.data
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/api/tags/${id}`)
  },
}
