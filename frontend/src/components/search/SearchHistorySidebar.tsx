import { useState, useEffect } from 'react'
import { searchService, SearchHistory } from '../../services/searchService'
import { Clock, X, Search } from 'lucide-react'
import toast from 'react-hot-toast'

interface SearchHistorySidebarProps {
  onSelectHistory: (query: string) => void
  isOpen: boolean
  onClose: () => void
}

export function SearchHistorySidebar({
  onSelectHistory,
  isOpen,
  onClose,
}: SearchHistorySidebarProps) {
  const [history, setHistory] = useState<SearchHistory[]>([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (isOpen) {
      loadHistory()
    }
  }, [isOpen])

  const loadHistory = async () => {
    try {
      setIsLoading(true)
      const data = await searchService.getSearchHistory(20)
      setHistory(data)
    } catch (error) {
      console.error('Error loading search history:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleClearHistory = async () => {
    if (!confirm('Clear all search history?')) return

    try {
      await searchService.clearSearchHistory()
      setHistory([])
      toast.success('Search history cleared')
    } catch {
      toast.error('Failed to clear history')
    }
  }

  const handleSelectHistory = (query: string) => {
    onSelectHistory(query)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onClose} />
      <div className="absolute right-0 top-0 h-full w-80 bg-white shadow-xl">
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Search History
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {isLoading ? (
              <div className="text-sm text-gray-500">Loading...</div>
            ) : history.length === 0 ? (
              <div className="text-sm text-gray-500 text-center py-8">
                No search history
              </div>
            ) : (
              <div className="space-y-2">
                {history.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleSelectHistory(item.query)}
                    className="w-full text-left p-3 rounded-lg hover:bg-gray-100 border border-gray-200 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Search className="h-4 w-4 text-gray-400 flex-shrink-0" />
                          <span className="text-sm font-medium text-gray-900 truncate">
                            {item.query}
                          </span>
                        </div>
                        <div className="text-xs text-gray-500 ml-6">
                          {new Date(item.created_at).toLocaleDateString()} • {item.result_count} results
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {history.length > 0 && (
            <div className="p-4 border-t border-gray-200">
              <button
                onClick={handleClearHistory}
                className="w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                Clear All History
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

