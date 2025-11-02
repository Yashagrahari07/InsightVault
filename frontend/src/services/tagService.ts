import api from './api'
import { Tag } from './entryService'

export interface TagCreate {
  name: string
  color?: string
}

export const tagService = {
  async getTags(): Promise<Tag[]> {
    const response = await api.get('/tags')
    return response.data
  },

  async createTag(data: TagCreate): Promise<Tag> {
    const response = await api.post('/tags', data)
    return response.data
  },

  async assignTag(entryId: string, tagId: string): Promise<void> {
    await api.post(`/entries/${entryId}/tags/${tagId}`)
  },

  async removeTag(entryId: string, tagId: string): Promise<void> {
    await api.delete(`/entries/${entryId}/tags/${tagId}`)
  },
}

