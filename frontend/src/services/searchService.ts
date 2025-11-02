import api from './api'

export interface EntryFilter {
  content_type?: 'link' | 'repo' | 'note'
  tags?: string[]
  date_from?: string
  date_to?: string
  has_summary?: boolean
  has_url?: boolean
}

export interface SearchRequest {
  q: string
  filters?: EntryFilter
  sort?: 'relevance' | 'newest' | 'oldest'
  page?: number
  limit?: number
}

export interface SearchHistory {
  id: string
  query: string
  filters?: Record<string, unknown>
  result_count: string
  created_at: string
}

export interface SavedFilter {
  id: string
  user_id: string
  name: string
  filters: EntryFilter
  created_at: string
  updated_at: string
}

export interface SavedFilterCreate {
  name: string
  filters: EntryFilter
}

export interface SavedFilterUpdate {
  name?: string
  filters?: EntryFilter
}

export interface SearchSuggestionResponse {
  suggestions: string[]
}

export const searchService = {
  async advancedSearch(request: SearchRequest) {
    const response = await api.post('/entries/search', request)
    return response.data
  },

  async getSuggestions(query: string, limit?: number): Promise<SearchSuggestionResponse> {
    const response = await api.get('/search/suggestions', {
      params: { q: query, limit },
    })
    return response.data
  },

  async getSearchHistory(limit?: number): Promise<SearchHistory[]> {
    const response = await api.get('/search/history', {
      params: { limit },
    })
    return response.data
  },

  async clearSearchHistory(): Promise<void> {
    await api.delete('/search/history')
  },

  async getSavedFilters(): Promise<SavedFilter[]> {
    const response = await api.get('/filters')
    return response.data
  },

  async getSavedFilter(id: string): Promise<SavedFilter> {
    const response = await api.get(`/filters/${id}`)
    return response.data
  },

  async createSavedFilter(data: SavedFilterCreate): Promise<SavedFilter> {
    const response = await api.post('/filters', data)
    return response.data
  },

  async updateSavedFilter(id: string, data: SavedFilterUpdate): Promise<SavedFilter> {
    const response = await api.put(`/filters/${id}`, data)
    return response.data
  },

  async deleteSavedFilter(id: string): Promise<void> {
    await api.delete(`/filters/${id}`)
  },
}

