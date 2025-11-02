import { useQuery } from '@tanstack/react-query'
import { analyticsService } from '../services/analyticsService'
import { Link } from 'react-router-dom'
import { Plus, BookOpen, Code, FileText } from 'lucide-react'

export default function DashboardPage() {
  const { data: analytics, isLoading } = useQuery({
    queryKey: ['analytics'],
    queryFn: () => analyticsService.getOverview(),
  })

  if (isLoading) {
    return <div>Loading...</div>
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Dashboard</h1>
        <Link
          to="/entries/new"
          className="btn btn-primary inline-flex items-center w-full sm:w-auto justify-center"
        >
          <Plus className="h-4 w-4 mr-2" />
          New Entry
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="card">
          <div className="flex items-center">
            <BookOpen className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600 flex-shrink-0" />
            <div className="ml-3 sm:ml-4 min-w-0">
              <p className="text-xs sm:text-sm font-medium text-gray-500 truncate">Total Entries</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900">{analytics?.total_entries || 0}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <FileText className="h-6 w-6 sm:h-8 sm:w-8 text-green-600 flex-shrink-0" />
            <div className="ml-3 sm:ml-4 min-w-0">
              <p className="text-xs sm:text-sm font-medium text-gray-500 truncate">Links</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900">
                {analytics?.entries_by_type?.link || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <Code className="h-6 w-6 sm:h-8 sm:w-8 text-purple-600 flex-shrink-0" />
            <div className="ml-3 sm:ml-4 min-w-0">
              <p className="text-xs sm:text-sm font-medium text-gray-500 truncate">Repositories</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900">
                {analytics?.entries_by_type?.repo || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <FileText className="h-6 w-6 sm:h-8 sm:w-8 text-orange-600 flex-shrink-0" />
            <div className="ml-3 sm:ml-4 min-w-0">
              <p className="text-xs sm:text-sm font-medium text-gray-500 truncate">Notes</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900">
                {analytics?.entries_by_type?.note || 0}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <div className="card">
          <h2 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4">Top Tags</h2>
          <div className="space-y-2">
            {analytics?.top_tags?.length ? (
              analytics.top_tags.map((tag) => (
                <div key={tag.name} className="flex justify-between items-center">
                  <span className="text-sm font-medium">{tag.name}</span>
                  <span className="text-sm text-gray-500">{tag.count} entries</span>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500">No tags yet</p>
            )}
          </div>
        </div>

        <div className="card">
          <h2 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4">Recent Entries</h2>
          <div className="space-y-2">
            {analytics?.recent_entries?.length ? (
              analytics.recent_entries.map((entry) => (
                <Link
                  key={entry.id}
                  to={`/entries/${entry.id}`}
                  className="block p-2 hover:bg-gray-50 rounded"
                >
                  <p className="text-sm font-medium">{entry.title}</p>
                  <p className="text-xs text-gray-500">
                    {new Date(entry.created_at).toLocaleDateString()}
                  </p>
                </Link>
              ))
            ) : (
              <p className="text-sm text-gray-500">No entries yet</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

