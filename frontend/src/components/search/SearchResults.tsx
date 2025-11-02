import { Link } from 'react-router-dom'
import { Entry } from '../../services/entryService'
import { Calendar, ExternalLink, FileText, Github } from 'lucide-react'

interface SearchResultsProps {
  entries: Entry[]
  isLoading?: boolean
  error?: string | null
  relevanceScores?: Record<string, number>
  searchQuery?: string
}

export function SearchResults({ entries, isLoading, error, relevanceScores, searchQuery = '' }: SearchResultsProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="p-4 border border-gray-200 rounded-lg animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
          </div>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-800 text-sm">Error: {error}</p>
      </div>
    )
  }

  if (entries.length === 0) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-500">No entries found</p>
      </div>
    )
  }

  const getContentTypeIcon = (type: string) => {
    switch (type) {
      case 'link':
        return <ExternalLink className="h-4 w-4" />
      case 'repo':
        return <Github className="h-4 w-4" />
      case 'note':
        return <FileText className="h-4 w-4" />
      default:
        return <FileText className="h-4 w-4" />
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const highlightText = (text: string, query: string) => {
    if (!query) return text
    const regex = new RegExp(`(${query})`, 'gi')
    const parts = text.split(regex)
    return parts.map((part, index) =>
      regex.test(part) ? (
        <mark key={index} className="bg-yellow-200 px-1 rounded">
          {part}
        </mark>
      ) : (
        part
      )
    )
  }

  return (
    <div className="space-y-4">
      {entries.map((entry) => {
        const relevanceScore = relevanceScores?.[entry.id]
        return (
          <Link
            key={entry.id}
            to={`/entries/${entry.id}`}
            className="block p-4 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-blue-300 transition-colors"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <div className="text-gray-500">{getContentTypeIcon(entry.content_type)}</div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {highlightText(entry.title, searchQuery)}
                  </h3>
                  {relevanceScore !== undefined && (
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                      Relevance: {relevanceScore.toFixed(2)}
                    </span>
                  )}
                </div>
                {entry.ai_summary && (
                  <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                    {entry.ai_summary.substring(0, 150)}...
                  </p>
                )}
                <div className="flex items-center gap-4 text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {formatDate(entry.created_at)}
                  </span>
                  <span className="capitalize">{entry.content_type}</span>
                  {entry.tags && entry.tags.length > 0 && (
                    <span className="flex items-center gap-1">
                      {entry.tags.length} tag{entry.tags.length !== 1 ? 's' : ''}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </Link>
        )
      })}
    </div>
  )
}

