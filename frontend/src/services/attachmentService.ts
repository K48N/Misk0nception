import api from './api'

export interface Attachment {
  id: number
  note_id: number
  filename: string
  filepath: string
  filesize: number
  filesize_str: string
  mimetype: string
  created_at: string
}

export const attachmentService = {
  uploadAttachment: async (noteId: number, file: File): Promise<Attachment> => {
    const formData = new FormData()
    formData.append('file', file)

    const response = await api.post(`/api/attachments/${noteId}/upload`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data
  },

  getAttachment: async (id: number): Promise<Attachment> => {
    const response = await api.get(`/api/attachments/${id}`)
    return response.data
  },

  deleteAttachment: async (id: number): Promise<void> => {
    await api.delete(`/api/attachments/${id}`)
  },

  downloadAttachment: async (id: number): Promise<Blob> => {
    const response = await api.get(`/api/attachments/${id}/download`, {
      responseType: 'blob',
    })
    return response.data
  },

  getNoteAttachments: async (noteId: number): Promise<Attachment[]> => {
    const response = await api.get(`/api/attachments/note/${noteId}`)
    return response.data
  },
}
