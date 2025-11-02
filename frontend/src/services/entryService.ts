import api from './api'

export interface Entry {
  id: string
  user_id: string
  title: string
  content_type: 'link' | 'repo' | 'note'
  url?: string
  content?: string
  metadata?: Record<string, any>
  ai_summary?: string
  summary_status: 'pending' | 'processing' | 'completed' | 'failed'
  created_at: string
  updated_at: string
  tags?: Tag[]
}

export interface Tag {
  id: string
  user_id: string
  name: string
  color?: string
  created_at: string
}

export interface EntryCreate {
  title: string
  content_type: 'link' | 'repo' | 'note'
  url?: string
  content?: string
  metadata?: Record<string, any>
}

export interface EntryListResponse {
  data: Entry[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

export const entryService = {
  async getEntries(params?: {
    page?: number
    limit?: number
    content_type?: 'link' | 'repo' | 'note'
    sort?: 'newest' | 'oldest'
  }): Promise<EntryListResponse> {
    const response = await api.get('/entries', { params })
    return response.data
  },

  async getEntry(id: string): Promise<Entry> {
    const response = await api.get(`/entries/${id}`)
    return response.data
  },

  async createEntry(data: EntryCreate): Promise<Entry> {
    const response = await api.post('/entries', data)
    return response.data
  },

  async updateEntry(id: string, data: Partial<EntryCreate>): Promise<Entry> {
    const response = await api.put(`/entries/${id}`, data)
    return response.data
  },

  async deleteEntry(id: string): Promise<void> {
    await api.delete(`/entries/${id}`)
  },

  async searchEntries(query: string, page?: number, limit?: number): Promise<EntryListResponse> {
    const response = await api.get('/entries/search', {
      params: { q: query, page, limit },
    })
    return response.data
  },

  async summarizeEntry(id: string): Promise<{ summary?: string; status: string }> {
    const response = await api.post(`/entries/${id}/summarize`)
    return response.data
  },

  async getSummaryStatus(id: string): Promise<{ summary?: string; status: string }> {
    const response = await api.get(`/entries/${id}/summary`)
    return response.data
  },
}

