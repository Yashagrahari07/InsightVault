import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { entryService } from '../services/entryService'
import { Link } from 'react-router-dom'
import { Plus, Search } from 'lucide-react'

export default function EntriesPage() {
  const [page, setPage] = useState(1)
  const [searchQuery, setSearchQuery] = useState('')
  const [contentType, setContentType] = useState<'link' | 'repo' | 'note' | undefined>()

  const { data, isLoading } = useQuery({
    queryKey: ['entries', page, contentType, searchQuery],
    queryFn: () => {
      if (searchQuery) {
        return entryService.searchEntries(searchQuery, page)
      }
      return entryService.getEntries({ page, content_type: contentType })
    },
  })

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Entries</h1>
        <Link to="/entries/new" className="btn btn-primary inline-flex items-center w-full sm:w-auto justify-center">
          <Plus className="h-4 w-4 mr-2" />
          New Entry
        </Link>
      </div>

      <div className="card">
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search entries..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 sm:pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
            />
          </div>
          <select
            value={contentType || ''}
            onChange={(e) => {
              const value = e.target.value
              setContentType(value === '' ? undefined : (value as 'link' | 'repo' | 'note'))
            }}
            className="w-full sm:w-auto px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
          >
            <option value="">All Types</option>
            <option value="link">Links</option>
            <option value="repo">Repositories</option>
            <option value="note">Notes</option>
          </select>
        </div>

        {isLoading ? (
          <div>Loading...</div>
        ) : (
          <>
            <div className="space-y-4">
              {data?.data.map((entry) => (
                <Link
                  key={entry.id}
                  to={`/entries/${entry.id}`}
                  className="block p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  <h3 className="text-lg font-semibold">{entry.title}</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    {entry.content_type} • {new Date(entry.created_at).toLocaleDateString()}
                  </p>
                </Link>
              ))}
            </div>

            {data?.pagination && (
              <div className="mt-4 flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-0">
                <button
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1}
                  className="btn btn-secondary disabled:opacity-50 w-full sm:w-auto"
                >
                  Previous
                </button>
                <span className="text-xs sm:text-sm text-gray-500">
                  Page {data.pagination.page} of {data.pagination.pages}
                </span>
                <button
                  onClick={() => setPage(page + 1)}
                  disabled={page >= data.pagination.pages}
                  className="btn btn-secondary disabled:opacity-50 w-full sm:w-auto"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

