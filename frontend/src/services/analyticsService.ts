import api from './api'

export interface AnalyticsOverview {
  total_entries: number
  entries_by_type: Record<string, number>
  top_tags: Array<{ name: string; count: number }>
  recent_entries: Array<{
    id: string
    title: string
    content_type: string
    created_at: string
  }>
}

export const analyticsService = {
  async getOverview(): Promise<AnalyticsOverview> {
    const response = await api.get('/analytics/overview')
    return response.data
  },
}

