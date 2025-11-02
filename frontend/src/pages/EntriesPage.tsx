import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { entryService, EntryListResponse } from '../services/entryService'
import { searchService, EntryFilter } from '../services/searchService'
import { Link } from 'react-router-dom'
import { Plus, Clock, Filter } from 'lucide-react'
import { AdvancedSearchBar } from '../components/search/AdvancedSearchBar'
import { SearchResults } from '../components/search/SearchResults'
import { FilterPanel } from '../components/search/FilterPanel'
import { SearchHistorySidebar } from '../components/search/SearchHistorySidebar'

export default function EntriesPage() {
  const [page, setPage] = useState(1)
  const [searchQuery, setSearchQuery] = useState('')
  const [filters, setFilters] = useState<EntryFilter>({})
  const [sort, setSort] = useState<'relevance' | 'newest' | 'oldest'>('relevance')
  const [showFilters, setShowFilters] = useState(false)
  const [showHistory, setShowHistory] = useState(false)

  // Determine if we're in search mode
  const isSearchMode = searchQuery.trim().length > 0 || Object.keys(filters).length > 0

  const { data, isLoading, error } = useQuery<EntryListResponse>({
    queryKey: ['entries', page, searchQuery, filters, sort],
    queryFn: async () => {
      if (isSearchMode) {
        // Use advanced search
        return searchService.advancedSearch({
          q: searchQuery || '',
          filters: Object.keys(filters).length > 0 ? filters : undefined,
          sort,
          page,
          limit: 20,
        })
      } else {
        // Use regular listing
        return entryService.getEntries({
          page,
          content_type: filters.content_type,
          sort: sort === 'relevance' ? 'newest' : sort,
        })
      }
    },
    enabled: true,
  })

  const handleSearch = (query: string) => {
    setSearchQuery(query)
    setPage(1)
  }

  const handleFiltersChange = (newFilters: EntryFilter) => {
    setFilters(newFilters)
    setPage(1)
  }

  const handleClearFilters = () => {
    setFilters({})
    setPage(1)
  }

  const handleSelectHistory = (query: string) => {
    setSearchQuery(query)
    setPage(1)
  }

  const hasActiveFilters = Object.values(filters).some(
    (value) => value !== undefined && value !== null && (Array.isArray(value) ? value.length > 0 : true)
  )

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Entries</h1>
        <div className="flex gap-2 w-full sm:w-auto">
          <button
            onClick={() => setShowHistory(true)}
            className="btn btn-secondary inline-flex items-center justify-center"
            title="Search History"
          >
            <Clock className="h-4 w-4 mr-2" />
            History
          </button>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`btn ${showFilters ? 'btn-primary' : 'btn-secondary'} inline-flex items-center justify-center`}
            title="Filters"
          >
            <Filter className="h-4 w-4 mr-2" />
            Filters
            {hasActiveFilters && (
              <span className="ml-2 bg-blue-600 text-white text-xs rounded-full px-2 py-0.5">
                {Object.keys(filters).filter((k) => filters[k as keyof EntryFilter]).length}
              </span>
            )}
          </button>
          <Link to="/entries/new" className="btn btn-primary inline-flex items-center justify-center">
            <Plus className="h-4 w-4 mr-2" />
            New Entry
          </Link>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-4">
        {/* Filter Panel */}
        {showFilters && (
          <div className="lg:w-80 flex-shrink-0">
            <FilterPanel
              filters={filters}
              onFiltersChange={handleFiltersChange}
              onClearFilters={handleClearFilters}
            />
          </div>
        )}

        {/* Main Content */}
        <div className="flex-1">
          <div className="card">
            {/* Search Bar */}
            <div className="mb-4">
              <AdvancedSearchBar
                onSearch={handleSearch}
                onSelectSuggestion={handleSearch}
                initialQuery={searchQuery}
              />
            </div>

            {/* Sort Options */}
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Sort by:</span>
                <select
                  value={sort}
                  onChange={(e) => {
                    setSort(e.target.value as 'relevance' | 'newest' | 'oldest')
                    setPage(1)
                  }}
                  className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="relevance">Relevance</option>
                  <option value="newest">Newest</option>
                  <option value="oldest">Oldest</option>
                </select>
              </div>
              {data && (
                <span className="text-sm text-gray-500">
                  {data.pagination.total} result{data.pagination.total !== 1 ? 's' : ''}
                </span>
              )}
            </div>

            {/* Results */}
            <SearchResults
              entries={data?.data || []}
              isLoading={isLoading}
              error={error ? String(error) : null}
              searchQuery={searchQuery}
            />

            {/* Pagination */}
            {data?.pagination && data.pagination.pages > 1 && (
              <div className="mt-6 flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-0">
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
          </div>
        </div>
      </div>

      {/* Search History Sidebar */}
      <SearchHistorySidebar
        isOpen={showHistory}
        onClose={() => setShowHistory(false)}
        onSelectHistory={handleSelectHistory}
      />
    </div>
  )
}
